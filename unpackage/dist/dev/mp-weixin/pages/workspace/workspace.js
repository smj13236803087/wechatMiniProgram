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
      showWristSizeModal: true,
      wristSize: null,
      wristSizeInput: "",
      wearingStyle: null,
      designName: "",
      currentDesignId: null,
      saving: false,
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
    }
  },
  onLoad(options) {
    if (options.designId) {
      this.loadDesign(options.designId);
    }
    this.fetchProducts();
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
        common_vendor.index.__f__("error", "at pages/workspace/workspace.vue:329", "拉取商品失败：", err);
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
          this.wristSize = design.wristSize;
          this.wristSizeInput = design.wristSize ? String(design.wristSize) : "";
          this.wearingStyle = design.wearingStyle;
          this.showWristSizeModal = !design.wristSize || !design.wearingStyle;
          this.designName = design.name || "";
          this.currentDesignId = design.id;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/workspace/workspace.vue:350", "加载作品失败：", err);
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
      if (this.wristSize && this.wearingStyle) {
        this.showWristSizeModal = false;
      }
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
    k: $data.loading
  }, $data.loading ? {} : $data.error ? {
    m: common_vendor.t($data.error)
  } : !$data.categorizedProducts ? {} : common_vendor.e({
    o: $data.beadStep !== "category"
  }, $data.beadStep !== "category" ? {
    p: common_vendor.o((...args) => $options.resetBeadSelection && $options.resetBeadSelection(...args))
  } : {}, {
    q: $data.beadStep === "category"
  }, $data.beadStep === "category" ? common_vendor.e({
    r: $data.categorizedProducts && $options.validBeadCategories.length > 0
  }, $data.categorizedProducts && $options.validBeadCategories.length > 0 ? {
    s: common_vendor.f($options.validBeadCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: $options.getCategoryImage(category.key),
        b: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        c: category.key,
        d: common_vendor.o(($event) => $options.selectBeadCategory(category.key), category.key)
      };
    })
  } : {}) : common_vendor.e({
    t: $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory]
  }, $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] ? {
    v: common_vendor.t(((_a = $data.categorizedProducts[$data.selectedBeadCategory]) == null ? void 0 : _a.name) || "")
  } : {}, {
    w: $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] && $data.categorizedProducts[$data.selectedBeadCategory].products
  }, $data.selectedBeadCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedBeadCategory] && $data.categorizedProducts[$data.selectedBeadCategory].products ? {
    x: common_vendor.f($data.categorizedProducts[$data.selectedBeadCategory].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectBeadProduct(product), product.id)
      };
    })
  } : {}), {
    y: $data.accessoryStep !== "category"
  }, $data.accessoryStep !== "category" ? {
    z: common_vendor.o((...args) => $options.resetAccessorySelection && $options.resetAccessorySelection(...args))
  } : {}, {
    A: $data.accessoryStep === "category"
  }, $data.accessoryStep === "category" ? common_vendor.e({
    B: $data.categorizedProducts && $options.validAccessoryCategories.length > 0
  }, $data.categorizedProducts && $options.validAccessoryCategories.length > 0 ? {
    C: common_vendor.f($options.validAccessoryCategories, (category, k0, i0) => {
      var _a2;
      return {
        a: $options.getCategoryImage(category.key),
        b: common_vendor.t(((_a2 = $data.categorizedProducts[category.key]) == null ? void 0 : _a2.name) || ""),
        c: category.key,
        d: common_vendor.o(($event) => $options.selectAccessoryCategory(category.key), category.key)
      };
    })
  } : {}) : common_vendor.e({
    D: $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory]
  }, $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] ? {
    E: common_vendor.t(((_b = $data.categorizedProducts[$data.selectedAccessoryCategory]) == null ? void 0 : _b.name) || "")
  } : {}, {
    F: $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] && $data.categorizedProducts[$data.selectedAccessoryCategory].products
  }, $data.selectedAccessoryCategory && $data.categorizedProducts && $data.categorizedProducts[$data.selectedAccessoryCategory] && $data.categorizedProducts[$data.selectedAccessoryCategory].products ? {
    G: common_vendor.f($data.categorizedProducts[$data.selectedAccessoryCategory].products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectAccessoryProduct(product), product.id)
      };
    })
  } : {}), {
    H: !$data.categorizedProducts || !$data.categorizedProducts.pendant || !$data.categorizedProducts.pendant.products || $data.categorizedProducts.pendant.products.length === 0
  }, !$data.categorizedProducts || !$data.categorizedProducts.pendant || !$data.categorizedProducts.pendant.products || $data.categorizedProducts.pendant.products.length === 0 ? {} : {
    I: common_vendor.f($data.categorizedProducts.pendant.products, (product, k0, i0) => {
      return {
        a: $options.getProductImage(product),
        b: common_vendor.t(product.title),
        c: common_vendor.t($options.getProductPrice(product)),
        d: product.id,
        e: common_vendor.o(($event) => $options.selectPendantProduct(product), product.id)
      };
    })
  }), {
    l: $data.error,
    n: !$data.categorizedProducts,
    J: $data.items.length === 0
  }, $data.items.length === 0 ? {} : {
    K: common_vendor.f($data.items, (item, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.price),
        d: common_vendor.o(($event) => $options.removeItem(item.id), item.id),
        e: item.id
      };
    })
  }, {
    L: common_vendor.t($options.totalPrice),
    M: common_vendor.t($data.items.length),
    N: $data.designName,
    O: common_vendor.o(($event) => $data.designName = $event.detail.value),
    P: common_vendor.t($data.saving ? "保存中..." : "保存到我的作品集"),
    Q: $data.items.length === 0 || $data.saving,
    R: common_vendor.o((...args) => $options.saveDesign && $options.saveDesign(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-245b3c15"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/workspace/workspace.js.map
