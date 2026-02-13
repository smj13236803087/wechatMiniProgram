"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      designs: [],
      loading: true,
      deletingId: null
    };
  },
  onLoad() {
    this.fetchDesigns();
  },
  onShow() {
    this.fetchDesigns();
  },
  watch: {
    designs: {
      handler() {
        this.$nextTick(() => {
          this.drawAllPreviews();
        });
      },
      deep: true
    }
  },
  methods: {
    async fetchDesigns() {
      this.loading = true;
      try {
        const res = await utils_api.designAPI.getDesigns();
        this.designs = res.designs || [];
        this.$nextTick(() => {
          this.drawAllPreviews();
        });
      } catch (err) {
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at pages/portfolio/portfolio.vue:113", err);
      } finally {
        this.loading = false;
      }
    },
    // 绘制所有预览图
    drawAllPreviews() {
      this.designs.forEach((design) => {
        if (design.items && design.items.length > 0) {
          this.drawPreview(design);
        }
      });
    },
    // 绘制单个预览图
    drawPreview(design) {
      const canvasId = "preview-" + design.id;
      const ctx = common_vendor.index.createCanvasContext(canvasId, this);
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      const size = 320 / 750 * screenWidth;
      const centerX = size / 2;
      const centerY = size / 2;
      ctx.clearRect(0, 0, size, size);
      const items = design.items || [];
      if (items.length === 0) {
        ctx.draw();
        return;
      }
      const beadRadius = 10;
      const minCircumference = items.length * beadRadius * 2;
      const minRadius = minCircumference / (2 * Math.PI);
      const radius = Math.max(minRadius + beadRadius * 0.5, size * 0.25);
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
    editDesign(id) {
      common_vendor.index.navigateTo({
        url: `/pages/workspace/workspace?designId=${id}`
      });
    },
    async deleteDesign(id) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个作品吗？此操作不可恢复。",
        success: async (res) => {
          if (res.confirm) {
            this.deletingId = id;
            try {
              await utils_api.designAPI.deleteDesign(id);
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
              this.designs = this.designs.filter((d) => d.id !== id);
            } catch (err) {
              common_vendor.index.showToast({
                title: err.message || "删除失败",
                icon: "none"
              });
            } finally {
              this.deletingId = null;
            }
          }
        }
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
    a: common_vendor.o((...args) => $options.goToWorkspace && $options.goToWorkspace(...args)),
    b: $data.loading
  }, $data.loading ? {} : $data.designs.length === 0 ? {
    d: common_vendor.o((...args) => $options.goToWorkspace && $options.goToWorkspace(...args))
  } : {
    e: common_vendor.f($data.designs, (design, k0, i0) => {
      var _a;
      return {
        a: "preview-" + design.id,
        b: common_vendor.t(design.name),
        c: common_vendor.t(((_a = design.items) == null ? void 0 : _a.length) || 0),
        d: common_vendor.t(design.totalPrice),
        e: common_vendor.o(($event) => $options.editDesign(design.id), design.id),
        f: common_vendor.t($data.deletingId === design.id ? "删除中" : "删除"),
        g: common_vendor.o(($event) => $options.deleteDesign(design.id), design.id),
        h: $data.deletingId === design.id,
        i: design.id,
        j: common_vendor.o(($event) => $options.editDesign(design.id), design.id)
      };
    })
  }, {
    c: $data.designs.length === 0
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-eea16c96"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/portfolio/portfolio.js.map
