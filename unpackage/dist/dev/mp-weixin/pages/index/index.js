"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      activeTab: "ai"
    };
  },
  onLoad() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.drawPreview();
      }, 300);
    });
  },
  methods: {
    goToWorkspace() {
      common_vendor.index.navigateTo({
        url: "/pages/workspace/workspace"
      });
    },
    // 绘制预览图（虚线圆形 + 两个加号）
    drawPreview() {
      const ctx = common_vendor.index.createCanvasContext("diy-preview", this);
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      const size = 500 / 750 * screenWidth;
      const centerX = size / 2;
      const centerY = size / 2;
      ctx.clearRect(0, 0, size, size);
      const radius = size * 0.35;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.setStrokeStyle("rgba(168, 85, 247, 0.3)");
      ctx.setLineWidth(3);
      ctx.setLineDash([8, 8], 0);
      ctx.stroke();
      ctx.setLineDash([], 0);
      const plusPositions = [
        { angle: 45 },
        // 右上
        { angle: 225 }
        // 左下
      ];
      plusPositions.forEach((pos) => {
        const rad = pos.angle * Math.PI / 180;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);
        const plusSize = 20;
        ctx.beginPath();
        ctx.arc(x, y, plusSize, 0, 2 * Math.PI);
        ctx.setStrokeStyle("rgba(168, 85, 247, 0.5)");
        ctx.setLineWidth(2);
        ctx.setLineDash([4, 4], 0);
        ctx.stroke();
        ctx.setLineDash([], 0);
        ctx.setStrokeStyle("#8b5cf6");
        ctx.setLineWidth(3);
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.stroke();
      });
      ctx.draw();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: common_vendor.o((...args) => $options.goToWorkspace && $options.goToWorkspace(...args)),
    c: $data.activeTab === "ai" ? 1 : "",
    d: common_vendor.o(($event) => $data.activeTab = "ai"),
    e: $data.activeTab === "classic" ? 1 : "",
    f: common_vendor.o(($event) => $data.activeTab = "classic")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
