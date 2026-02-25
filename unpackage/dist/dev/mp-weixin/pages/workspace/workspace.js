"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_bracelet = require("../../utils/bracelet.js");
const _sfc_main = {
  data() {
    return {
      loading: true,
      error: null,
      categorizedProducts: null,
      items: [],
      showWristSizeModal: false,
      // 默认不显示，因为已经有默认值
      wristSize: 16,
      // 默认手围16
      wristSizeInput: "16",
      wearingStyle: "single",
      // 默认单圈
      designName: "",
      currentDesignId: null,
      saving: false,
      canvasCtx: null,
      // Canvas 上下文
      // 拖拽状态
      dragState: {
        isDragging: false,
        dragItemId: null,
        dragItemIndex: -1,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        isOverDeleteZone: false,
        nearestBeadIndex: -1,
        // 最近的珠子索引（用于换位置）
        longPressTimer: null,
        drawTimer: null,
        // 绘制节流定时器
        canvasRect: null
        // 缓存 canvas 位置
      },
      // 珠子选择状态
      beadStep: "category",
      selectedBeadCategory: null,
      // 配饰选择状态
      accessoryStep: "category",
      selectedAccessoryCategory: null,
      // 新的tab状态
      activeMainTab: "bead",
      // 主tab：bead, accessory, pendant
      activeBeadSubTab: null,
      // 珠子子tab：obsidian, amethyst, moonshine
      activeAccessorySubTab: null,
      // 配饰子tab
      // 分类映射
      beadCategories: [
        { key: "obsidian", category: "obsidian" },
        { key: "amethyst", category: "amethyst" },
        { key: "moonshine", category: "moonstone" }
      ],
      accessoryCategories: [
        { key: "cutoff", category: "spacer" },
        { key: "running-laps", category: "decoration" },
        { key: "double-pointed-crystal", category: "doubleTerminated" }
      ],
      // 下单 / 收银台流程状态
      processingOrder: false
    };
  },
  computed: {
    totalPrice() {
      return utils_bracelet.calculateTotalPrice(this.items);
    },
    // 过滤有效的珠子分类
    validBeadCategories() {
      if (!this.categorizedProducts)
        return [];
      return this.beadCategories.filter((category) => {
        return category && category.key && this.categorizedProducts[category.key] && this.categorizedProducts[category.key].products && this.categorizedProducts[category.key].products.length > 0;
      });
    },
    // 过滤有效的配饰分类
    validAccessoryCategories() {
      if (!this.categorizedProducts)
        return [];
      return this.accessoryCategories.filter((category) => {
        return category && category.key && this.categorizedProducts[category.key] && this.categorizedProducts[category.key].products && this.categorizedProducts[category.key].products.length > 0;
      });
    },
    // 预览尺寸（像素）- 用于计算（缩小预览区域）
    previewSize() {
      return 200;
    },
    // 预览尺寸（像素）- 用于样式（rpx转px）
    previewSizePx() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      return 400 / 750 * screenWidth;
    },
    // 中心点坐标
    centerX() {
      return this.previewSize / 2;
    },
    centerY() {
      return this.previewSize / 2;
    },
    // 基础半径
    radius() {
      return this.previewSize * 0.3;
    },
    // 默认直径（毫米）
    defaultDiameter() {
      return 8;
    },
    // 毫米转像素比例
    mmToPx() {
      return 2.5;
    },
    // 最大和最小缩放因子
    maxPreferredScale() {
      return 2;
    },
    minPreferredScale() {
      return 0.25;
    },
    // 计算当前周长（厘米）
    currentCircumference() {
      const totalDiameterMm = this.items.reduce((sum, item) => {
        return sum + (item.diameter || this.defaultDiameter);
      }, 0);
      return totalDiameterMm / 10;
    },
    // 计算最大周长
    maxCircumference() {
      if (!this.wristSize || !this.wearingStyle)
        return null;
      return this.wearingStyle === "single" ? this.wristSize * 1.1 : this.wristSize * 2.2;
    },
    // 是否达到设定手围
    reachesLimit() {
      if (!this.maxCircumference || this.items.length === 0)
        return false;
      return this.currentCircumference >= this.maxCircumference * 0.95;
    },
    // 是否超过设定手围
    exceedsLimit() {
      return this.maxCircumference !== null && this.currentCircumference > this.maxCircumference;
    },
    // 计算珠子大小的缩放因子
    beadScale() {
      if (this.items.length === 0)
        return this.maxPreferredScale;
      const target = 2 * Math.PI;
      const totalAngleForScale = (scale) => {
        let total = 0;
        for (let i = 0; i < this.items.length; i++) {
          const a = this.items[i];
          const b = this.items[(i + 1) % this.items.length];
          const d1 = a.diameter ?? this.defaultDiameter;
          const d2 = b.diameter ?? this.defaultDiameter;
          const r1 = d1 / 2 * this.mmToPx * scale;
          const r2 = d2 / 2 * this.mmToPx * scale;
          const combined = r1 + r2;
          const safeRatio = Math.min(combined / (2 * this.radius), 0.999);
          total += 2 * Math.asin(safeRatio);
        }
        return total;
      };
      const maxScale = this.maxPreferredScale;
      const minScale = this.minPreferredScale;
      const totalAtMax = totalAngleForScale(maxScale);
      if (Math.abs(totalAtMax - target) < 1e-4)
        return maxScale;
      if (totalAtMax < target) {
        return maxScale;
      }
      const totalAtMin = totalAngleForScale(minScale);
      if (totalAtMin > target) {
        return minScale;
      }
      let lo = minScale;
      let hi = maxScale;
      let best = minScale;
      for (let iter = 0; iter < 50; iter++) {
        const mid = (lo + hi) / 2;
        const t = totalAngleForScale(mid);
        if (Math.abs(t - target) < 1e-4) {
          best = mid;
          break;
        }
        if (t > target) {
          hi = mid;
        } else {
          lo = mid;
          best = mid;
        }
        if (hi - lo < 1e-4)
          break;
      }
      return best;
    },
    // 计算角度间隔
    angleSteps() {
      if (this.items.length === 0)
        return [];
      const steps = [];
      for (let i = 0; i < this.items.length; i++) {
        const currentItem = this.items[i];
        const nextItem = this.items[(i + 1) % this.items.length];
        const radius1 = this.getBeadRadius(currentItem.diameter);
        const radius2 = this.getBeadRadius(nextItem.diameter);
        const combinedRadius = radius1 + radius2;
        const safeRatio = Math.min(combinedRadius / (2 * this.radius), 0.999);
        const angleStep = 2 * Math.asin(safeRatio);
        steps.push(angleStep);
      }
      return steps;
    }
  },
  onLoad(options) {
    if (options.designId) {
      this.loadDesign(options.designId);
    }
    this.fetchProducts();
    this.$nextTick(() => {
      setTimeout(() => {
        this.initCanvas();
      }, 500);
    });
  },
  watch: {
    items: {
      handler() {
        this.$nextTick(() => {
          this.drawBracelet();
        });
      },
      deep: true
    },
    wristSize() {
      this.$nextTick(() => {
        this.drawBracelet();
      });
    },
    wearingStyle() {
      this.$nextTick(() => {
        this.drawBracelet();
      });
    },
    // 监听主tab切换，自动设置第一个子tab
    activeMainTab(newVal) {
      if (newVal === "bead" && this.validBeadCategories.length > 0) {
        this.activeBeadSubTab = this.validBeadCategories[0].key;
      } else if (newVal === "accessory" && this.validAccessoryCategories.length > 0) {
        this.activeAccessorySubTab = this.validAccessoryCategories[0].key;
      }
    },
    // 监听珠子分类变化，自动设置第一个子tab
    validBeadCategories: {
      handler(newVal) {
        if (this.activeMainTab === "bead" && newVal.length > 0 && !this.activeBeadSubTab) {
          this.activeBeadSubTab = newVal[0].key;
        }
      },
      immediate: true
    },
    // 监听配饰分类变化，自动设置第一个子tab
    validAccessoryCategories: {
      handler(newVal) {
        if (this.activeMainTab === "accessory" && newVal.length > 0 && !this.activeAccessorySubTab) {
          this.activeAccessorySubTab = newVal[0].key;
        }
      },
      immediate: true
    }
  },
  methods: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      try {
        const res = await utils_api.productAPI.getProducts();
        const products = res.products || res || [];
        if (!Array.isArray(products)) {
          throw new Error("商品数据格式不正确");
        }
        this.categorizedProducts = utils_bracelet.categorizeProducts(products);
      } catch (err) {
        this.error = err.message || "拉取商品失败";
        common_vendor.index.__f__("error", "at pages/workspace/workspace.vue:733", "拉取商品失败：", err);
        this.categorizedProducts = null;
      } finally {
        this.loading = false;
      }
    },
    async loadDesign(id) {
      try {
        const res = await utils_api.designAPI.getDesign(id);
        const design = res.design;
        if (design) {
          this.items = design.items || [];
          this.wristSize = design.wristSize || 16;
          this.wristSizeInput = String(this.wristSize);
          this.wearingStyle = design.wearingStyle || "single";
          this.showWristSizeModal = false;
          this.designName = design.name || "";
          this.currentDesignId = design.id;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/workspace/workspace.vue:754", "加载作品失败：", err);
        common_vendor.index.showToast({
          title: "加载作品失败",
          icon: "none"
        });
      }
    },
    getCategoryImage(categoryKey) {
      var _a;
      if (!this.categorizedProducts || !categoryKey || !this.categorizedProducts[categoryKey]) {
        return "";
      }
      const products = (_a = this.categorizedProducts[categoryKey]) == null ? void 0 : _a.products;
      if (products && products.length > 0) {
        return utils_bracelet.getProductImage(products[0]);
      }
      return "";
    },
    getProductImage: utils_bracelet.getProductImage,
    getProductPrice: utils_bracelet.getProductPrice,
    checkWristSizeLimit(newDiameter) {
      if (!this.wristSize || !this.wearingStyle)
        return true;
      const maxCircumference = this.wearingStyle === "single" ? this.wristSize * 1.1 : this.wristSize * 2.2;
      const defaultDiameter = 8;
      const currentTotalDiameterMm = this.items.reduce((sum, item) => {
        return sum + (item.diameter || defaultDiameter);
      }, 0);
      const newTotalDiameterMm = currentTotalDiameterMm + (newDiameter || defaultDiameter);
      const newCircumference = newTotalDiameterMm / 10;
      return newCircumference <= maxCircumference;
    },
    selectBeadCategory(categoryKey) {
      this.selectedBeadCategory = categoryKey;
      this.beadStep = "product";
    },
    resetBeadSelection() {
      this.beadStep = "category";
      this.selectedBeadCategory = null;
    },
    selectBeadProduct(product) {
      if (!this.activeBeadSubTab)
        return;
      const category = this.beadCategories.find((c) => c && c.key === this.activeBeadSubTab);
      if (!category || !category.category)
        return;
      const diameterStr = utils_bracelet.getProductDiameter(product);
      const weightStr = utils_bracelet.getProductWeight(product);
      const diameter = diameterStr ? utils_bracelet.parseDiameter(diameterStr) : void 0;
      const weight = weightStr ? utils_bracelet.parseWeight(weightStr) : void 0;
      if (!this.checkWristSizeLimit(diameter || 8)) {
        common_vendor.index.showToast({
          title: "已达到设定手围！无法添加更多珠子。",
          icon: "none"
        });
        return;
      }
      const newItem = {
        id: utils_bracelet.generateId(),
        type: "bead",
        beadCategory: category.category,
        beadSubType: product.title,
        name: product.title,
        price: utils_bracelet.getProductPrice(product),
        color: "#8b4513",
        image: utils_bracelet.getProductImage(product),
        diameter,
        weight
      };
      this.items.push(newItem);
    },
    selectAccessoryCategory(categoryKey) {
      this.selectedAccessoryCategory = categoryKey;
      this.accessoryStep = "product";
    },
    resetAccessorySelection() {
      this.accessoryStep = "category";
      this.selectedAccessoryCategory = null;
    },
    selectAccessoryProduct(product) {
      if (!this.activeAccessorySubTab)
        return;
      const category = this.accessoryCategories.find((c) => c && c.key === this.activeAccessorySubTab);
      if (!category || !category.category)
        return;
      const diameterStr = utils_bracelet.getProductDiameter(product);
      const weightStr = utils_bracelet.getProductWeight(product);
      const diameter = diameterStr ? utils_bracelet.parseDiameter(diameterStr) : void 0;
      const weight = weightStr ? utils_bracelet.parseWeight(weightStr) : void 0;
      if (!this.checkWristSizeLimit(diameter || 8)) {
        common_vendor.index.showToast({
          title: "已达到设定手围！无法添加更多配饰。",
          icon: "none"
        });
        return;
      }
      const newItem = {
        id: utils_bracelet.generateId(),
        type: "accessory",
        accessoryCategory: category.category,
        accessorySubType: product.title,
        name: product.title,
        price: utils_bracelet.getProductPrice(product),
        color: "#8b4513",
        image: utils_bracelet.getProductImage(product),
        diameter,
        weight
      };
      this.items.push(newItem);
    },
    selectPendantProduct(product) {
      const diameterStr = utils_bracelet.getProductDiameter(product);
      const weightStr = utils_bracelet.getProductWeight(product);
      const diameter = diameterStr ? utils_bracelet.parseDiameter(diameterStr) : void 0;
      const weight = weightStr ? utils_bracelet.parseWeight(weightStr) : void 0;
      if (!this.checkWristSizeLimit(diameter || 8)) {
        common_vendor.index.showToast({
          title: "已达到设定手围！无法添加更多吊坠。",
          icon: "none"
        });
        return;
      }
      const newItem = {
        id: utils_bracelet.generateId(),
        type: "pendant",
        pendantType: "pendant",
        name: product.title,
        price: utils_bracelet.getProductPrice(product),
        color: "#8b4513",
        image: utils_bracelet.getProductImage(product),
        diameter,
        weight
      };
      this.items.push(newItem);
    },
    removeItem(id) {
      const index = this.items.findIndex((item) => item.id === id);
      if (index === -1)
        return;
      common_vendor.index.showToast({
        title: "已删除",
        icon: "success",
        duration: 500
      });
      setTimeout(() => {
        this.items = this.items.filter((item) => item.id !== id);
        this.drawBracelet();
      }, 100);
    },
    // 获取珠子半径（像素）
    getBeadRadius(diameter) {
      const diameterMm = diameter || this.defaultDiameter;
      return diameterMm / 2 * this.mmToPx * this.beadScale;
    },
    // 获取珠子的角度位置
    getItemAngle(index) {
      if (index === 0)
        return 0;
      let cumulativeAngle = 0;
      for (let i = 0; i < index; i++) {
        cumulativeAngle += this.angleSteps[i];
      }
      return cumulativeAngle;
    },
    // 获取珠子的 X 坐标
    getItemX(index) {
      const angle = this.getItemAngle(index);
      return this.centerX + this.radius * Math.cos(angle);
    },
    // 获取珠子的 Y 坐标
    getItemY(index) {
      const angle = this.getItemAngle(index);
      return this.centerY + this.radius * Math.sin(angle);
    },
    // 初始化 canvas
    initCanvas() {
      this.canvasCtx = common_vendor.index.createCanvasContext("braceletCanvas", this);
      setTimeout(() => {
        this.drawBracelet();
      }, 100);
    },
    // 绘制手串
    drawBracelet() {
      if (!this.canvasCtx) {
        return;
      }
      const ctx = this.canvasCtx;
      const size = this.previewSize;
      ctx.clearRect(0, 0, size, size);
      if (this.items.length === 0) {
        ctx.draw();
        return;
      }
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
      ctx.setStrokeStyle("#e5e7eb");
      ctx.setLineWidth(2);
      ctx.setLineDash([5, 5], 0);
      ctx.stroke();
      ctx.setLineDash([], 0);
      const nearestBeadIndex = this.dragState.nearestBeadIndex;
      for (let i = 0; i < this.items.length; i++) {
        if (this.dragState.isDragging && i === this.dragState.dragItemIndex) {
          continue;
        }
        const item = this.items[i];
        const x = this.getItemX(i);
        const y = this.getItemY(i);
        const radius = this.getBeadRadius(item.diameter);
        const color = item.color || "#8b4513";
        if (i === nearestBeadIndex) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
          ctx.setStrokeStyle("#3b82f6");
          ctx.setLineWidth(3);
          ctx.setLineDash([5, 5], 0);
          ctx.stroke();
          ctx.setLineDash([], 0);
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.setFillStyle(color);
        ctx.fill();
        ctx.setStrokeStyle("#ffffff");
        ctx.setLineWidth(2);
        ctx.stroke();
      }
      ctx.draw();
    },
    // Canvas 触摸开始 - 检测长按
    handleCanvasTouchStart(e) {
      if (this.items.length === 0)
        return;
      e.stopPropagation();
      const touch = e.touches[0];
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".canvas-container").boundingClientRect((rect) => {
        if (!rect)
          return;
        this.dragState.canvasRect = rect;
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const itemIndex = this.findItemAtPosition(x, y);
        if (itemIndex === -1)
          return;
        if (this.dragState.longPressTimer) {
          clearTimeout(this.dragState.longPressTimer);
        }
        this.dragState.longPressTimer = setTimeout(() => {
          this.startDrag(itemIndex, x, y);
        }, 500);
      }).exec();
    },
    // Canvas 触摸移动
    handleCanvasTouchMove(e) {
      e.stopPropagation();
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (!this.dragState.isDragging) {
        if (this.dragState.longPressTimer) {
          clearTimeout(this.dragState.longPressTimer);
          this.dragState.longPressTimer = null;
        }
        return false;
      }
      const touch = e.touches[0];
      const canvasRect = this.dragState.canvasRect;
      if (!canvasRect) {
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.select(".canvas-container").boundingClientRect((rect) => {
          if (rect) {
            this.dragState.canvasRect = rect;
            const x2 = touch.clientX - rect.left;
            const y2 = touch.clientY - rect.top;
            this.updateDragPosition(x2, y2, touch);
          }
        }).exec();
        return false;
      }
      const x = touch.clientX - canvasRect.left;
      const y = touch.clientY - canvasRect.top;
      this.updateDragPosition(x, y, touch);
      return false;
    },
    // 更新拖拽位置（节流绘制）
    updateDragPosition(x, y, touch) {
      this.dragState.currentX = x;
      this.dragState.currentY = y;
      if (this.dragState.drawTimer) {
        clearTimeout(this.dragState.drawTimer);
      }
      this.dragState.drawTimer = setTimeout(() => {
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.select(".delete-zone").boundingClientRect((deleteRect) => {
          if (deleteRect) {
            const isInDeleteZone = touch.clientY >= deleteRect.top && touch.clientY <= deleteRect.bottom && touch.clientX >= deleteRect.left && touch.clientX <= deleteRect.right;
            this.dragState.isOverDeleteZone = isInDeleteZone;
          } else {
            this.dragState.isOverDeleteZone = false;
          }
          if (this.isInPreviewArea(x, y)) {
            const nearestIndex = this.findNearestBead(x, y, this.dragState.dragItemIndex);
            this.dragState.nearestBeadIndex = nearestIndex;
          } else {
            this.dragState.nearestBeadIndex = -1;
          }
          this.drawBracelet();
        }).exec();
      }, 16);
    },
    // Canvas 触摸结束
    handleCanvasTouchEnd(e) {
      e.stopPropagation();
      if (this.dragState.longPressTimer) {
        clearTimeout(this.dragState.longPressTimer);
        this.dragState.longPressTimer = null;
      }
      if (!this.dragState.isDragging)
        return;
      if (this.dragState.isOverDeleteZone) {
        this.removeItem(this.dragState.dragItemId);
        this.endDrag();
        return;
      }
      if (this.dragState.nearestBeadIndex !== -1 && this.dragState.nearestBeadIndex !== this.dragState.dragItemIndex) {
        this.swapItems(this.dragState.dragItemIndex, this.dragState.nearestBeadIndex);
      }
      this.endDrag();
    },
    // 开始拖拽
    startDrag(itemIndex, x, y) {
      if (itemIndex < 0 || itemIndex >= this.items.length)
        return;
      if (!this.dragState.canvasRect) {
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.select(".canvas-container").boundingClientRect((rect) => {
          if (rect) {
            this.dragState.canvasRect = rect;
          }
        }).exec();
      }
      this.dragState.isDragging = true;
      this.dragState.dragItemId = this.items[itemIndex].id;
      this.dragState.dragItemIndex = itemIndex;
      this.dragState.startX = x;
      this.dragState.startY = y;
      this.dragState.currentX = x;
      this.dragState.currentY = y;
      this.dragState.isOverDeleteZone = false;
      this.disableScroll();
      this.drawBracelet();
    },
    // 结束拖拽
    endDrag() {
      if (this.dragState.drawTimer) {
        clearTimeout(this.dragState.drawTimer);
        this.dragState.drawTimer = null;
      }
      this.dragState.isDragging = false;
      this.dragState.dragItemId = null;
      this.dragState.dragItemIndex = -1;
      this.dragState.isOverDeleteZone = false;
      this.dragState.nearestBeadIndex = -1;
      this.dragState.canvasRect = null;
      this.enableScroll();
      this.drawBracelet();
    },
    // 禁用滚动
    disableScroll() {
      common_vendor.index.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
    },
    // 启用滚动
    enableScroll() {
    },
    // 查找指定位置的珠子索引
    findItemAtPosition(x, y) {
      this.centerX;
      this.centerY;
      for (let i = 0; i < this.items.length; i++) {
        const itemX = this.getItemX(i);
        const itemY = this.getItemY(i);
        const radius = this.getBeadRadius(this.items[i].diameter);
        const distance = Math.sqrt(Math.pow(x - itemX, 2) + Math.pow(y - itemY, 2));
        if (distance <= radius + 5) {
          return i;
        }
      }
      return -1;
    },
    // 查找距离指定位置最近的珠子索引
    findNearestBead(x, y, excludeIndex) {
      let nearestIndex = -1;
      let minDistance = Infinity;
      for (let i = 0; i < this.items.length; i++) {
        if (i === excludeIndex)
          continue;
        const itemX = this.getItemX(i);
        const itemY = this.getItemY(i);
        const radius = this.getBeadRadius(this.items[i].diameter);
        const distance = Math.sqrt(Math.pow(x - itemX, 2) + Math.pow(y - itemY, 2)) - radius;
        if (distance < minDistance && distance < 80) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      return nearestIndex;
    },
    // 检查是否在预览区域内
    isInPreviewArea(x, y) {
      const size = this.previewSize;
      return x >= 0 && x <= size && y >= 0 && y <= size;
    },
    // 交换两个项目的位置
    swapItems(index1, index2) {
      if (index1 < 0 || index1 >= this.items.length || index2 < 0 || index2 >= this.items.length || index1 === index2) {
        return;
      }
      const temp = this.items[index1];
      this.$set(this.items, index1, this.items[index2]);
      this.$set(this.items, index2, temp);
      this.$nextTick(() => {
        this.drawBracelet();
      });
    },
    completeWristSize() {
      const size = parseFloat(this.wristSizeInput);
      if (!size || size <= 0) {
        common_vendor.index.showToast({
          title: "请输入有效的手围",
          icon: "none"
        });
        return;
      }
      if (!this.wearingStyle) {
        common_vendor.index.showToast({
          title: "请选择佩戴方式",
          icon: "none"
        });
        return;
      }
      this.wristSize = size;
      this.showWristSizeModal = false;
    },
    closeModal() {
      this.showWristSizeModal = false;
    },
    async saveDesign() {
      if (!this.items.length) {
        common_vendor.index.showToast({
          title: "请先设计手串再保存～",
          icon: "none"
        });
        return;
      }
      if (!this.wristSize || !this.wearingStyle) {
        common_vendor.index.showToast({
          title: "请先完成手腕尺寸设置～",
          icon: "none"
        });
        this.showWristSizeModal = true;
        return;
      }
      const trimmed = this.designName.trim();
      if (!trimmed) {
        common_vendor.index.showToast({
          title: "请先输入作品名称",
          icon: "none"
        });
        return;
      }
      this.saving = true;
      try {
        const totalWeight = this.items.reduce((sum, item) => sum + (item.weight || 0), 0);
        const diameters = this.items.map((i) => i.diameter).filter((d) => !!d);
        const averageDiameter = diameters.length > 0 ? diameters.reduce((a, b) => a + b, 0) / diameters.length : null;
        const designData = {
          id: this.currentDesignId || void 0,
          name: trimmed,
          items: this.items,
          totalPrice: this.totalPrice,
          totalWeight,
          averageDiameter,
          wristSize: this.wristSize,
          wearingStyle: this.wearingStyle
        };
        const res = await utils_api.designAPI.saveDesign(designData);
        this.currentDesignId = res.design.id;
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateTo({
            url: "/pages/portfolio/portfolio"
          });
        }, 1500);
      } catch (err) {
        common_vendor.index.showToast({
          title: err.message || "保存失败，请稍后重试",
          icon: "none"
        });
      } finally {
        this.saving = false;
      }
    },
    // 完成并前往收银台
    async completeAndGoToCashier() {
      if (this.processingOrder)
        return;
      if (!this.items.length) {
        common_vendor.index.showToast({
          title: "请先设计手串再完成～",
          icon: "none"
        });
        return;
      }
      if (!this.wristSize || !this.wearingStyle) {
        common_vendor.index.showToast({
          title: "请先完成手腕尺寸设置～",
          icon: "none"
        });
        this.showWristSizeModal = true;
        return;
      }
      const trimmed = this.designName.trim();
      if (!trimmed) {
        common_vendor.index.showToast({
          title: "请先输入作品名称",
          icon: "none"
        });
        return;
      }
      this.processingOrder = true;
      try {
        const totalWeight = this.items.reduce((sum, item) => sum + (item.weight || 0), 0);
        const diameters = this.items.map((i) => i.diameter).filter((d) => !!d);
        const averageDiameter = diameters.length > 0 ? diameters.reduce((a, b) => a + b, 0) / diameters.length : null;
        const designData = {
          id: this.currentDesignId || void 0,
          name: trimmed,
          items: this.items,
          totalPrice: this.totalPrice,
          totalWeight,
          averageDiameter,
          wristSize: this.wristSize,
          wearingStyle: this.wearingStyle
        };
        const res = await utils_api.designAPI.saveDesign(designData);
        this.currentDesignId = res.design.id;
        const payload = encodeURIComponent(JSON.stringify({
          designId: this.currentDesignId,
          name: trimmed,
          totalPrice: this.totalPrice
        }));
        common_vendor.index.navigateTo({
          url: `/pages/cashier/cashier?data=${payload}`
        });
      } catch (err) {
        common_vendor.index.showToast({
          title: err.message || "处理失败，请稍后重试",
          icon: "none"
        });
      } finally {
        this.processingOrder = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b;
  return common_vendor.e({
    a: $data.showWristSizeModal
  }, $data.showWristSizeModal ? {
    b: $data.wristSizeInput,
    c: common_vendor.o(($event) => $data.wristSizeInput = $event.detail.value),
    d: $data.wearingStyle === "single" ? 1 : "",
    e: common_vendor.o(($event) => $data.wearingStyle = "single"),
    f: $data.wearingStyle === "double" ? 1 : "",
    g: common_vendor.o(($event) => $data.wearingStyle = "double"),
    h: common_vendor.o((...args) => $options.completeWristSize && $options.completeWristSize(...args)),
    i: common_vendor.o(() => {
    }),
    j: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args))
  } : {}, {
    k: $data.items.length === 0
  }, $data.items.length === 0 ? {} : common_vendor.e({
    l: $options.exceedsLimit
  }, $options.exceedsLimit ? {
    m: common_vendor.t($options.currentCircumference.toFixed(1)),
    n: common_vendor.t($options.maxCircumference.toFixed(1))
  } : $options.reachesLimit ? {} : {}, {
    o: $options.reachesLimit,
    p: $options.previewSizePx + "px",
    q: $options.previewSizePx + "px",
    r: common_vendor.o((...args) => $options.handleCanvasTouchStart && $options.handleCanvasTouchStart(...args)),
    s: common_vendor.o((...args) => $options.handleCanvasTouchMove && $options.handleCanvasTouchMove(...args)),
    t: common_vendor.o((...args) => $options.handleCanvasTouchEnd && $options.handleCanvasTouchEnd(...args)),
    v: common_vendor.o(() => {
    })
  }), {
    w: common_vendor.t($data.wristSize),
    x: common_vendor.t($data.wearingStyle === "single" ? "单圈" : "双圈"),
    y: common_vendor.o(($event) => $data.showWristSizeModal = true),
    z: common_vendor.t($options.totalPrice),
    A: common_vendor.t($data.items.length),
    B: $data.dragState.isDragging && $data.dragState.isOverDeleteZone ? 1 : "",
    C: $data.activeMainTab === "bead" ? 1 : "",
    D: common_vendor.o(($event) => $data.activeMainTab = "bead"),
    E: $data.activeMainTab === "accessory" ? 1 : "",
    F: common_vendor.o(($event) => $data.activeMainTab = "accessory"),
    G: $data.activeMainTab === "pendant" ? 1 : "",
    H: common_vendor.o(($event) => $data.activeMainTab = "pendant"),
    I: $data.loading
  }, $data.loading ? {} : $data.error ? {
    K: common_vendor.t($data.error)
  } : !$data.categorizedProducts ? {} : common_vendor.e({
    M: $data.activeMainTab === "bead"
  }, $data.activeMainTab === "bead" ? common_vendor.e({
    N: common_vendor.f($options.validBeadCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        b: category.key,
        c: $data.activeBeadSubTab === category.key ? 1 : "",
        d: common_vendor.o(($event) => $data.activeBeadSubTab = category.key, category.key)
      };
    }),
    O: $data.activeBeadSubTab && $data.categorizedProducts[$data.activeBeadSubTab] && $data.categorizedProducts[$data.activeBeadSubTab].products
  }, $data.activeBeadSubTab && $data.categorizedProducts[$data.activeBeadSubTab] && $data.categorizedProducts[$data.activeBeadSubTab].products ? {
    P: common_vendor.f($data.categorizedProducts[$data.activeBeadSubTab].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectBeadProduct(product), product.id)
      };
    })
  } : {}) : {}, {
    Q: $data.activeMainTab === "accessory"
  }, $data.activeMainTab === "accessory" ? common_vendor.e({
    R: common_vendor.f($options.validAccessoryCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        b: category.key,
        c: $data.activeAccessorySubTab === category.key ? 1 : "",
        d: common_vendor.o(($event) => $data.activeAccessorySubTab = category.key, category.key)
      };
    }),
    S: $data.activeAccessorySubTab && $data.categorizedProducts[$data.activeAccessorySubTab] && $data.categorizedProducts[$data.activeAccessorySubTab].products
  }, $data.activeAccessorySubTab && $data.categorizedProducts[$data.activeAccessorySubTab] && $data.categorizedProducts[$data.activeAccessorySubTab].products ? {
    T: common_vendor.f($data.categorizedProducts[$data.activeAccessorySubTab].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectAccessoryProduct(product), product.id)
      };
    })
  } : {}) : {}, {
    U: $data.activeMainTab === "pendant"
  }, $data.activeMainTab === "pendant" ? common_vendor.e({
    V: $data.categorizedProducts.pendant && $data.categorizedProducts.pendant.products
  }, $data.categorizedProducts.pendant && $data.categorizedProducts.pendant.products ? {
    W: common_vendor.f($data.categorizedProducts.pendant.products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectPendantProduct(product), product.id)
      };
    })
  } : {}) : {}), {
    J: $data.error,
    L: !$data.categorizedProducts,
    X: $data.designName,
    Y: common_vendor.o(($event) => $data.designName = $event.detail.value),
    Z: common_vendor.t($data.saving ? "保存中..." : "仅保存"),
    aa: $data.items.length === 0 || $data.saving || $data.processingOrder,
    ab: common_vendor.o((...args) => $options.saveDesign && $options.saveDesign(...args)),
    ac: common_vendor.t($data.processingOrder ? "处理中..." : "完成"),
    ad: $data.items.length === 0 || $data.processingOrder,
    ae: common_vendor.o((...args) => $options.completeAndGoToCashier && $options.completeAndGoToCashier(...args)),
    af: $data.loading
  }, $data.loading ? {} : $data.error ? {
    ah: common_vendor.t($data.error)
  } : !$data.categorizedProducts ? {} : common_vendor.e({
    aj: $data.beadStep !== "category"
  }, $data.beadStep !== "category" ? {
    ak: common_vendor.o((...args) => $options.resetBeadSelection && $options.resetBeadSelection(...args))
  } : {}, {
    al: $data.beadStep === "category"
  }, $data.beadStep === "category" ? common_vendor.e({
    am: $data.categorizedProducts && $options.validBeadCategories.length > 0
  }, $data.categorizedProducts && $options.validBeadCategories.length > 0 ? {
    an: common_vendor.f($options.validBeadCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: $options.getCategoryImage(category.key),
        b: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        c: category.key,
        d: common_vendor.o(($event) => $options.selectBeadCategory(category.key), category.key)
      };
    })
  } : {}) : common_vendor.e({
    ao: $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory]
  }, $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] ? {
    ap: common_vendor.t(((_a = $data.categorizedProducts[$data.selectedBeadCategory]) == null ? void 0 : _a.name) || "")
  } : {}, {
    aq: $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] && $data.categorizedProducts[$data.selectedBeadCategory].products
  }, $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] && $data.categorizedProducts[$data.selectedBeadCategory].products ? {
    ar: common_vendor.f($data.categorizedProducts[$data.selectedBeadCategory].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectBeadProduct(product), product.id)
      };
    })
  } : {}), {
    as: $data.accessoryStep !== "category"
  }, $data.accessoryStep !== "category" ? {
    at: common_vendor.o((...args) => $options.resetAccessorySelection && $options.resetAccessorySelection(...args))
  } : {}, {
    av: $data.accessoryStep === "category"
  }, $data.accessoryStep === "category" ? common_vendor.e({
    aw: $data.categorizedProducts && $options.validAccessoryCategories.length > 0
  }, $data.categorizedProducts && $options.validAccessoryCategories.length > 0 ? {
    ax: common_vendor.f($options.validAccessoryCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: $options.getCategoryImage(category.key),
        b: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        c: category.key,
        d: common_vendor.o(($event) => $options.selectAccessoryCategory(category.key), category.key)
      };
    })
  } : {}) : common_vendor.e({
    ay: $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory]
  }, $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] ? {
    az: common_vendor.t(((_b = $data.categorizedProducts[$data.selectedAccessoryCategory]) == null ? void 0 : _b.name) || "")
  } : {}, {
    aA: $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] && $data.categorizedProducts[$data.selectedAccessoryCategory].products
  }, $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] && $data.categorizedProducts[$data.selectedAccessoryCategory].products ? {
    aB: common_vendor.f($data.categorizedProducts[$data.selectedAccessoryCategory].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectAccessoryProduct(product), product.id)
      };
    })
  } : {}), {
    aC: !$data.categorizedProducts || !$data.categorizedProducts.pendant || !$data.categorizedProducts.pendant.products || $data.categorizedProducts.pendant.products.length === 0
  }, !$data.categorizedProducts || !$data.categorizedProducts.pendant || !$data.categorizedProducts.pendant.products || $data.categorizedProducts.pendant.products.length === 0 ? {} : {
    aD: common_vendor.f($data.categorizedProducts.pendant.products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectPendantProduct(product), product.id)
      };
    })
  }, {
    aE: $data.designName,
    aF: common_vendor.o(($event) => $data.designName = $event.detail.value),
    aG: common_vendor.t($data.saving ? "保存中..." : "保存到我的作品集"),
    aH: $data.items.length === 0 || $data.saving,
    aI: common_vendor.o((...args) => $options.saveDesign && $options.saveDesign(...args))
  }), {
    ag: $data.error,
    ai: !$data.categorizedProducts,
    aJ: !$data.dragState.isDragging,
    aK: !$data.dragState.isDragging
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-245b3c15"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/workspace/workspace.js.map
