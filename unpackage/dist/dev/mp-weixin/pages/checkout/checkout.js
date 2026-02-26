"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      orderItems: [],
      totalPrice: 0,
      defaultAddress: null,
      loadingAddress: true,
      submitting: false
    };
  },
  computed: {
    totalQuantity() {
      return this.orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
  },
  onLoad(options) {
    if (options && options.data) {
      try {
        const payload = JSON.parse(decodeURIComponent(options.data));
        this.orderItems = payload.items || [];
        this.totalPrice = payload.totalPrice || 0;
        this.$nextTick(() => {
          this.drawAllPreviews();
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/checkout/checkout.vue:104", "解析订单数据失败", e);
        common_vendor.index.showToast({
          title: "订单数据错误",
          icon: "none"
        });
      }
    }
    this.fetchDefaultAddress();
  },
  methods: {
    async fetchDefaultAddress() {
      this.loadingAddress = true;
      try {
        const res = await utils_api.addressAPI.getAddresses();
        const addresses = res.addresses || [];
        this.defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0] || null;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/checkout/checkout.vue:122", "获取地址失败：", err);
        common_vendor.index.showToast({
          title: "获取地址失败",
          icon: "none"
        });
      } finally {
        this.loadingAddress = false;
      }
    },
    drawAllPreviews() {
      this.orderItems.forEach((item) => {
        var _a;
        const designItems = ((_a = item.design) == null ? void 0 : _a.items) || [];
        if (Array.isArray(designItems) && designItems.length > 0) {
          this.drawPreview(item.id, designItems);
        }
      });
    },
    // 绘制预览图（与购物车/作品集相同的算法）
    drawPreview(itemId, items) {
      const canvasId = "checkout-preview-" + itemId;
      const ctx = common_vendor.index.createCanvasContext(canvasId, this);
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      const size = 180 / 750 * screenWidth;
      const centerX = size / 2;
      const centerY = size / 2;
      ctx.clearRect(0, 0, size, size);
      const baseBeadRadius = 8;
      const margin = 6;
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
    goToAddresses() {
      common_vendor.index.navigateTo({
        url: "/pages/address/address"
      });
    },
    // 提交订单（预留，暂不实现）
    handleSubmitOrder() {
      if (!this.defaultAddress) {
        common_vendor.index.showToast({
          title: "请先选择收货地址",
          icon: "none"
        });
        return;
      }
      if (this.submitting)
        return;
      common_vendor.index.showToast({
        title: "提交订单功能开发中",
        icon: "none"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.loadingAddress
  }, $data.loadingAddress ? {} : !$data.defaultAddress ? {
    c: common_vendor.o((...args) => $options.goToAddresses && $options.goToAddresses(...args))
  } : {
    d: common_vendor.t($data.defaultAddress.recipient),
    e: common_vendor.t($data.defaultAddress.phone),
    f: common_vendor.t($data.defaultAddress.country),
    g: common_vendor.t($data.defaultAddress.province),
    h: common_vendor.t($data.defaultAddress.city),
    i: common_vendor.t($data.defaultAddress.district),
    j: common_vendor.t($data.defaultAddress.detail),
    k: common_vendor.o((...args) => $options.goToAddresses && $options.goToAddresses(...args))
  }, {
    b: !$data.defaultAddress,
    l: common_vendor.f($data.orderItems, (item, index, i0) => {
      var _a, _b;
      return {
        a: "checkout-preview-" + item.id,
        b: common_vendor.t(item.name),
        c: common_vendor.t(((_b = (_a = item.design) == null ? void 0 : _a.items) == null ? void 0 : _b.length) || 0),
        d: common_vendor.t(item.quantity),
        e: common_vendor.t(item.totalPrice),
        f: item.id || index
      };
    }),
    m: common_vendor.t($options.totalQuantity),
    n: common_vendor.t($data.totalPrice),
    o: common_vendor.t($data.totalPrice),
    p: common_vendor.t($data.submitting ? "提交中..." : "提交订单"),
    q: $data.submitting || !$data.defaultAddress,
    r: common_vendor.o((...args) => $options.handleSubmitOrder && $options.handleSubmitOrder(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-fd186f5c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/checkout/checkout.js.map
