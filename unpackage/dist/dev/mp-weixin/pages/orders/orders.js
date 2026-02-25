"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      tabs: [
        { key: "all", label: "全部" },
        { key: "pending-ship", label: "待发货" },
        { key: "pending-receive", label: "待收货" },
        { key: "completed", label: "已完成" },
        { key: "after-sale", label: "退款/售后" }
      ],
      activeTab: "all"
    };
  },
  computed: {
    currentTabLabel() {
      const found = this.tabs.find((t) => t.key === this.activeTab);
      return found ? found.label : "";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.tabs, (tab, k0, i0) => {
      return {
        a: common_vendor.t(tab.label),
        b: tab.key,
        c: $data.activeTab === tab.key ? 1 : "",
        d: common_vendor.o(($event) => $data.activeTab = tab.key, tab.key)
      };
    }),
    b: common_vendor.t($options.currentTabLabel)
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1acc51a1"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/orders/orders.js.map
