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
  methods: {
    async fetchDesigns() {
      this.loading = true;
      try {
        const res = await utils_api.designAPI.getDesigns();
        this.designs = res.designs || [];
      } catch (err) {
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at pages/portfolio/portfolio.vue:94", err);
      } finally {
        this.loading = false;
      }
    },
    viewDesign(id) {
      common_vendor.index.showToast({
        title: "功能开发中",
        icon: "none"
      });
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
      common_vendor.index.switchTab({
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
        a: common_vendor.t(((_a = design.items) == null ? void 0 : _a.length) || 0),
        b: common_vendor.o(($event) => $options.editDesign(design.id), design.id),
        c: common_vendor.t($data.deletingId === design.id ? "删除中" : "删除"),
        d: common_vendor.o(($event) => $options.deleteDesign(design.id), design.id),
        e: $data.deletingId === design.id,
        f: common_vendor.o(($event) => $options.viewDesign(design.id), design.id),
        g: common_vendor.t(design.name),
        h: common_vendor.t(design.totalPrice),
        i: design.id
      };
    })
  }, {
    c: $data.designs.length === 0
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-eea16c96"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/portfolio/portfolio.js.map
