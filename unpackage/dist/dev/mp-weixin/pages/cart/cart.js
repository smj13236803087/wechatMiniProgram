"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      loading: true,
      error: null,
      items: [],
      deletingId: null
    };
  },
  computed: {
    // 是否全选
    allSelected() {
      return this.items.length > 0 && this.items.every((i) => i.checked);
    },
    // 已选条数
    selectedCount() {
      return this.items.filter((i) => i.checked).length;
    },
    // 已选条目的 id 列表
    selectedIds() {
      return this.items.filter((i) => i.checked).map((i) => i.id);
    },
    // 已选合计金额（数量 * 单价）
    selectedTotalPrice() {
      return this.items.filter((i) => i.checked).reduce((sum, item) => {
        const qty = item.quantity || 1;
        const price = item.totalPrice || 0;
        return sum + qty * price;
      }, 0);
    }
  },
  onShow() {
    this.fetchCart();
  },
  watch: {
    items: {
      handler() {
        this.$nextTick(() => {
          this.drawAllPreviews();
        });
      },
      deep: true
    }
  },
  methods: {
    async fetchCart() {
      this.loading = true;
      this.error = null;
      try {
        const res = await utils_api.cartAPI.getCart();
        const rawItems = res.items || [];
        this.items = rawItems.map((item) => ({
          ...item,
          checked: false,
          quantity: 1
        }));
      } catch (err) {
        this.items = [];
        this.error = err.message || "拉取购物车失败";
      } finally {
        this.loading = false;
      }
    },
    drawAllPreviews() {
      this.items.forEach((cartItem) => {
        var _a;
        const designItems = ((_a = cartItem.design) == null ? void 0 : _a.items) || [];
        if (Array.isArray(designItems) && designItems.length > 0) {
          this.drawPreview(cartItem.id, designItems);
        }
      });
    },
    // 使用与作品集一致的 canvas 预览风格（保证珠子不被裁剪）
    drawPreview(cartItemId, items) {
      const canvasId = "cart-preview-" + cartItemId;
      const ctx = common_vendor.index.createCanvasContext(canvasId, this);
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      const size = 220 / 750 * screenWidth;
      const centerX = size / 2;
      const centerY = size / 2;
      ctx.clearRect(0, 0, size, size);
      const baseBeadRadius = 8;
      const margin = 4;
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
        radius = Math.max(minRadius + beadRadius * 0.5, size * 0.28);
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
      const angleStep = 2 * Math.PI / items.length;
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
    // 单条选中/取消
    toggleItemChecked(item) {
      item.checked = !item.checked;
    },
    // 全选/反选
    toggleSelectAll() {
      const target = !this.allSelected;
      this.items = this.items.map((i) => ({
        ...i,
        checked: target
      }));
    },
    // 数量增加
    increaseQuantity(item) {
      item.quantity = (item.quantity || 1) + 1;
    },
    // 数量减少（最少为 1）
    decreaseQuantity(item) {
      const current = item.quantity || 1;
      if (current <= 1)
        return;
      item.quantity = current - 1;
    },
    deleteItem(id) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要从购物车删除该作品吗？",
        success: async (res) => {
          if (!res.confirm)
            return;
          this.deletingId = id;
          try {
            await utils_api.cartAPI.deleteItems([id]);
            common_vendor.index.showToast({
              title: "已删除",
              icon: "success"
            });
            this.items = this.items.filter((i) => i.id !== id);
          } catch (err) {
            common_vendor.index.showToast({
              title: err.message || "删除失败",
              icon: "none"
            });
          } finally {
            this.deletingId = null;
          }
        }
      });
    },
    // 删除选中条目
    deleteSelected() {
      if (this.selectedIds.length === 0)
        return;
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除选中的 ${this.selectedIds.length} 个作品吗？`,
        success: async (res) => {
          if (!res.confirm)
            return;
          this.deletingId = "batch";
          try {
            await utils_api.cartAPI.deleteItems(this.selectedIds);
            common_vendor.index.showToast({
              title: "已删除选中",
              icon: "success"
            });
            this.items = this.items.filter((i) => !this.selectedIds.includes(i.id));
          } catch (err) {
            common_vendor.index.showToast({
              title: err.message || "删除失败",
              icon: "none"
            });
          } finally {
            this.deletingId = null;
          }
        }
      });
    },
    // 清空购物车
    clearCart() {
      if (!this.items.length)
        return;
      common_vendor.index.showModal({
        title: "清空购物车",
        content: "确定要清空购物车中所有作品吗？",
        success: async (res) => {
          if (!res.confirm)
            return;
          this.deletingId = "clear";
          try {
            await utils_api.cartAPI.deleteItems();
            common_vendor.index.showToast({
              title: "已清空",
              icon: "success"
            });
            this.items = [];
          } catch (err) {
            common_vendor.index.showToast({
              title: err.message || "清空失败",
              icon: "none"
            });
          } finally {
            this.deletingId = null;
          }
        }
      });
    },
    // 去结算（占位，暂不实现具体逻辑）
    goToCheckout() {
      if (this.selectedIds.length === 0) {
        common_vendor.index.showToast({
          title: "请先选择要结算的作品",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showToast({
        title: "结算流程待实现",
        icon: "none"
      });
    },
    goToWorkspace() {
      common_vendor.index.navigateTo({
        url: "/pages/workspace/workspace"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.loading
  }, $data.loading ? {} : $data.error ? {
    c: common_vendor.t($data.error),
    d: common_vendor.o((...args) => $options.fetchCart && $options.fetchCart(...args))
  } : $data.items.length === 0 ? {
    f: common_vendor.o((...args) => $options.goToWorkspace && $options.goToWorkspace(...args))
  } : {
    g: common_vendor.f($data.items, (item, k0, i0) => {
      var _a, _b, _c, _d, _e, _f, _g;
      return common_vendor.e({
        a: item.checked
      }, item.checked ? {} : {}, {
        b: item.checked ? 1 : "",
        c: common_vendor.o(($event) => $options.toggleItemChecked(item), item.id),
        d: "cart-preview-" + item.id,
        e: common_vendor.t(item.name || ((_a = item.design) == null ? void 0 : _a.name) || "未命名作品"),
        f: common_vendor.t(((_c = (_b = item.design) == null ? void 0 : _b.items) == null ? void 0 : _c.length) || 0),
        g: common_vendor.t(item.totalPrice || 0),
        h: (_d = item.design) == null ? void 0 : _d.wristSize
      }, ((_e = item.design) == null ? void 0 : _e.wristSize) ? {
        i: common_vendor.t(item.design.wristSize)
      } : {}, {
        j: (_f = item.design) == null ? void 0 : _f.wearingStyle
      }, ((_g = item.design) == null ? void 0 : _g.wearingStyle) ? {
        k: common_vendor.t(item.design.wearingStyle === "double" ? "双圈" : "单圈")
      } : {}, {
        l: common_vendor.o(($event) => $options.decreaseQuantity(item), item.id),
        m: common_vendor.t(item.quantity),
        n: common_vendor.o(($event) => $options.increaseQuantity(item), item.id),
        o: common_vendor.t($data.deletingId === item.id ? "删除中..." : "删除"),
        p: $data.deletingId === item.id,
        q: common_vendor.o(($event) => $options.deleteItem(item.id), item.id),
        r: item.id
      });
    })
  }, {
    b: $data.error,
    e: $data.items.length === 0,
    h: $data.items.length
  }, $data.items.length ? common_vendor.e({
    i: $options.allSelected
  }, $options.allSelected ? {} : {}, {
    j: $options.allSelected ? 1 : "",
    k: common_vendor.t($options.selectedCount),
    l: common_vendor.o((...args) => $options.toggleSelectAll && $options.toggleSelectAll(...args)),
    m: common_vendor.t($options.selectedTotalPrice),
    n: common_vendor.o((...args) => $options.clearCart && $options.clearCart(...args)),
    o: common_vendor.o((...args) => $options.deleteSelected && $options.deleteSelected(...args)),
    p: $options.selectedIds.length === 0,
    q: common_vendor.o((...args) => $options.goToCheckout && $options.goToCheckout(...args)),
    r: $options.selectedIds.length === 0
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c91e7611"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/cart/cart.js.map
