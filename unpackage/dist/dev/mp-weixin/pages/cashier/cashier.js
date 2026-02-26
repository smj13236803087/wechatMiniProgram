"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      designId: null,
      designName: "",
      totalPrice: 0,
      wristSize: null,
      wearingStyle: "",
      designItems: [],
      design: null,
      submitting: false
    };
  },
  computed: {
    wearingStyleLabel() {
      if (this.wearingStyle === "double")
        return "双圈";
      return "单圈";
    }
  },
  watch: {
    designItems: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.$nextTick(() => {
            this.drawPreview();
          });
        }
      },
      deep: true
    }
  },
  onLoad(options) {
    if (options && options.data) {
      try {
        const payload = JSON.parse(decodeURIComponent(options.data));
        if (payload.designId) {
          this.designId = payload.designId;
          this.designName = payload.name || "";
          this.totalPrice = payload.totalPrice || 0;
          this.fetchDesignDetail();
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/cashier/cashier.vue:133", "解析收银台参数失败", e);
      }
    }
  },
  methods: {
    async fetchDesignDetail() {
      if (!this.designId)
        return;
      try {
        const res = await utils_api.designAPI.getDesign(this.designId);
        const design = res.design;
        if (design) {
          this.design = design;
          this.designItems = design.items || [];
          this.wristSize = design.wristSize || null;
          this.wearingStyle = design.wearingStyle || "single";
          if (!this.designName) {
            this.designName = design.name || "";
          }
          if (!this.totalPrice) {
            this.totalPrice = design.totalPrice || 0;
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/cashier/cashier.vue:156", "获取设计详情失败：", err);
        common_vendor.index.showToast({
          title: "获取作品详情失败",
          icon: "none"
        });
      }
    },
    // 使用与作品集相同的方式绘制圆形手串预览（保证珠子不被裁剪）
    drawPreview() {
      const items = this.designItems || [];
      if (!items.length)
        return;
      const ctx = common_vendor.index.createCanvasContext("cashier-preview", this);
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      const size = 280 / 750 * screenWidth;
      const centerX = size / 2;
      const centerY = size / 2;
      ctx.clearRect(0, 0, size, size);
      const baseBeadRadius = 10;
      const margin = 8;
      const maxRadius = size / 2 - baseBeadRadius - margin;
      if (maxRadius <= 0) {
        ctx.draw();
        return;
      }
      const minCircumference = items.length * baseBeadRadius * 2;
      const minRadius = minCircumference / (2 * Math.PI);
      let beadRadius = baseBeadRadius;
      let radius;
      if (minRadius <= maxRadius) {
        radius = Math.max(minRadius + beadRadius * 0.5, size * 0.25);
        radius = Math.min(radius, maxRadius);
      } else {
        const scale = maxRadius / minRadius;
        beadRadius = baseBeadRadius * scale;
        radius = maxRadius;
      }
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.setStrokeStyle("#e5e7eb");
      ctx.setLineWidth(2);
      ctx.setLineDash([5, 5], 0);
      ctx.stroke();
      ctx.setLineDash([], 0);
      const totalAngle = 2 * Math.PI;
      const angleStep = totalAngle / items.length;
      items.forEach((item, index) => {
        const angle = index * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const color = item.color || "#8b4513";
        ctx.beginPath();
        ctx.arc(x, y, beadRadius, 0, 2 * Math.PI);
        ctx.setFillStyle(color);
        ctx.fill();
        ctx.setStrokeStyle("#ffffff");
        ctx.setLineWidth(1.5);
        ctx.stroke();
      });
      ctx.draw();
    },
    handleAddToCart() {
      if (!this.designId) {
        common_vendor.index.showToast({
          title: "暂未获取到作品信息",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "加入购物车",
        content: "是否将当前作品加入购物车？",
        confirmText: "确认",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.addToCart();
          }
        }
      });
    },
    async addToCart() {
      if (this.submitting)
        return;
      this.submitting = true;
      try {
        const payload = {
          name: this.designName,
          design: this.design || {
            id: this.designId,
            name: this.designName,
            items: this.designItems,
            wristSize: this.wristSize,
            wearingStyle: this.wearingStyle
          },
          totalPrice: this.totalPrice
        };
        await utils_api.cartAPI.addItem(payload);
        common_vendor.index.showToast({
          title: "已加入购物车",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/cart/cart"
          });
        }, 300);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/cashier/cashier.vue:289", "加入购物车失败：", err);
        common_vendor.index.showToast({
          title: err.message || "加入购物车失败",
          icon: "none"
        });
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.designItems.length === 0
  }, $data.designItems.length === 0 ? {} : {}, {
    b: common_vendor.t($data.designName),
    c: common_vendor.t($data.wristSize),
    d: common_vendor.t($options.wearingStyleLabel),
    e: common_vendor.t($data.designItems.length),
    f: common_vendor.t($data.totalPrice),
    g: $data.designItems.length
  }, $data.designItems.length ? {
    h: common_vendor.f($data.designItems, (item, index, i0) => {
      return common_vendor.e({
        a: item.image
      }, item.image ? {
        b: item.image
      } : {}, {
        c: common_vendor.t(item.name),
        d: item.beadCategory
      }, item.beadCategory ? {
        e: common_vendor.t(item.beadCategory)
      } : item.accessoryCategory ? {
        g: common_vendor.t(item.accessoryCategory)
      } : item.pendantType ? {} : {}, {
        f: item.accessoryCategory,
        h: item.pendantType,
        i: common_vendor.t(item.price || 0),
        j: item.id || index
      });
    })
  } : {}, {
    i: common_vendor.t($data.totalPrice),
    j: common_vendor.t($data.submitting ? "处理中..." : "加入购物车"),
    k: $data.submitting,
    l: common_vendor.o((...args) => $options.handleAddToCart && $options.handleAddToCart(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-bb25b75b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/cashier/cashier.js.map
