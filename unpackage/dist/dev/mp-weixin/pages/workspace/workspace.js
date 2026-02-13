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
      // 珠子选择状态
      beadStep: "category",
      selectedBeadCategory: null,
      // 配饰选择状态
      accessoryStep: "category",
      selectedAccessoryCategory: null,
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
      ]
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
    // 预览尺寸（像素）- 用于计算
    previewSize() {
      return 300;
    },
    // 预览尺寸（像素）- 用于样式（rpx转px）
    previewSizePx() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      return 600 / 750 * screenWidth;
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
        common_vendor.index.__f__("error", "at pages/workspace/workspace.vue:523", "拉取商品失败：", err);
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
        common_vendor.index.__f__("error", "at pages/workspace/workspace.vue:544", "加载作品失败：", err);
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
      if (!this.selectedBeadCategory)
        return;
      const category = this.beadCategories.find((c) => c && c.key === this.selectedBeadCategory);
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
      this.resetBeadSelection();
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
      if (!this.selectedAccessoryCategory)
        return;
      const category = this.accessoryCategories.find((c) => c && c.key === this.selectedAccessoryCategory);
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
      this.resetAccessorySelection();
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
      this.items = this.items.filter((item) => item.id !== id);
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
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        const x = this.getItemX(i);
        const y = this.getItemY(i);
        const radius = this.getBeadRadius(item.diameter);
        const color = item.color || "#8b4513";
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
    // Canvas 触摸开始
    handleCanvasTouchStart(e) {
      common_vendor.index.__f__("log", "at pages/workspace/workspace.vue:797", "Canvas touch start", e);
    },
    // Canvas 触摸移动
    handleCanvasTouchMove(e) {
      common_vendor.index.__f__("log", "at pages/workspace/workspace.vue:803", "Canvas touch move", e);
    },
    // Canvas 触摸结束
    handleCanvasTouchEnd(e) {
      common_vendor.index.__f__("log", "at pages/workspace/workspace.vue:809", "Canvas touch end", e);
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
          common_vendor.index.switchTab({
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
    k: common_vendor.t($data.wristSize),
    l: common_vendor.t($data.wearingStyle === "single" ? "单圈" : "双圈"),
    m: common_vendor.o(($event) => $data.showWristSizeModal = true),
    n: $data.items.length === 0
  }, $data.items.length === 0 ? {} : common_vendor.e({
    o: $options.exceedsLimit
  }, $options.exceedsLimit ? {
    p: common_vendor.t($options.currentCircumference.toFixed(1)),
    q: common_vendor.t($options.maxCircumference.toFixed(1))
  } : $options.reachesLimit ? {} : {}, {
    r: $options.reachesLimit,
    s: $options.previewSizePx + "px",
    t: $options.previewSizePx + "px",
    v: common_vendor.o((...args) => $options.handleCanvasTouchStart && $options.handleCanvasTouchStart(...args)),
    w: common_vendor.o((...args) => $options.handleCanvasTouchMove && $options.handleCanvasTouchMove(...args)),
    x: common_vendor.o((...args) => $options.handleCanvasTouchEnd && $options.handleCanvasTouchEnd(...args)),
    y: common_vendor.f($data.items, (item, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.price),
        d: common_vendor.o(($event) => $options.removeItem(item.id), item.id),
        e: item.id
      };
    })
  }), {
    z: common_vendor.t($options.totalPrice),
    A: common_vendor.t($data.items.length),
    B: $data.designName,
    C: common_vendor.o(($event) => $data.designName = $event.detail.value),
    D: common_vendor.t($data.saving ? "保存中..." : "保存到我的作品集"),
    E: $data.items.length === 0 || $data.saving,
    F: common_vendor.o((...args) => $options.saveDesign && $options.saveDesign(...args)),
    G: $data.loading
  }, $data.loading ? {} : $data.error ? {
    I: common_vendor.t($data.error)
  } : !$data.categorizedProducts ? {} : common_vendor.e({
    K: $data.beadStep !== "category"
  }, $data.beadStep !== "category" ? {
    L: common_vendor.o((...args) => $options.resetBeadSelection && $options.resetBeadSelection(...args))
  } : {}, {
    M: $data.beadStep === "category"
  }, $data.beadStep === "category" ? common_vendor.e({
    N: $data.categorizedProducts && $options.validBeadCategories.length > 0
  }, $data.categorizedProducts && $options.validBeadCategories.length > 0 ? {
    O: common_vendor.f($options.validBeadCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: $options.getCategoryImage(category.key),
        b: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        c: category.key,
        d: common_vendor.o(($event) => $options.selectBeadCategory(category.key), category.key)
      };
    })
  } : {}) : common_vendor.e({
    P: $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory]
  }, $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] ? {
    Q: common_vendor.t(((_a = $data.categorizedProducts[$data.selectedBeadCategory]) == null ? void 0 : _a.name) || "")
  } : {}, {
    R: $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] && $data.categorizedProducts[$data.selectedBeadCategory].products
  }, $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] && $data.categorizedProducts[$data.selectedBeadCategory].products ? {
    S: common_vendor.f($data.categorizedProducts[$data.selectedBeadCategory].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectBeadProduct(product), product.id)
      };
    })
  } : {}), {
    T: $data.accessoryStep !== "category"
  }, $data.accessoryStep !== "category" ? {
    U: common_vendor.o((...args) => $options.resetAccessorySelection && $options.resetAccessorySelection(...args))
  } : {}, {
    V: $data.accessoryStep === "category"
  }, $data.accessoryStep === "category" ? common_vendor.e({
    W: $data.categorizedProducts && $options.validAccessoryCategories.length > 0
  }, $data.categorizedProducts && $options.validAccessoryCategories.length > 0 ? {
    X: common_vendor.f($options.validAccessoryCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: $options.getCategoryImage(category.key),
        b: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        c: category.key,
        d: common_vendor.o(($event) => $options.selectAccessoryCategory(category.key), category.key)
      };
    })
  } : {}) : common_vendor.e({
    Y: $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory]
  }, $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] ? {
    Z: common_vendor.t(((_b = $data.categorizedProducts[$data.selectedAccessoryCategory]) == null ? void 0 : _b.name) || "")
  } : {}, {
    aa: $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] && $data.categorizedProducts[$data.selectedAccessoryCategory].products
  }, $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] && $data.categorizedProducts[$data.selectedAccessoryCategory].products ? {
    ab: common_vendor.f($data.categorizedProducts[$data.selectedAccessoryCategory].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectAccessoryProduct(product), product.id)
      };
    })
  } : {}), {
    ac: !$data.categorizedProducts || !$data.categorizedProducts.pendant || !$data.categorizedProducts.pendant.products || $data.categorizedProducts.pendant.products.length === 0
  }, !$data.categorizedProducts || !$data.categorizedProducts.pendant || !$data.categorizedProducts.pendant.products || $data.categorizedProducts.pendant.products.length === 0 ? {} : {
    ad: common_vendor.f($data.categorizedProducts.pendant.products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectPendantProduct(product), product.id)
      };
    })
  }), {
    H: $data.error,
    J: !$data.categorizedProducts
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-245b3c15"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/workspace/workspace.js.map
