"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      user: null,
      userInfo: {},
      logging: false
    };
  },
  computed: {
    userInitial() {
      if (!this.user)
        return "U";
      const name = this.userInfo.nickName || this.user.name || this.user.email || "U";
      return name[0].toUpperCase();
    }
  },
  onLoad() {
    this.checkLogin();
  },
  onShow() {
    this.checkLogin();
  },
  methods: {
    async checkLogin() {
      try {
        const res = await utils_api.authAPI.getMe();
        if (res.user) {
          this.user = res.user;
          const userInfo = common_vendor.index.getStorageSync("wechatUserInfo");
          if (userInfo) {
            this.userInfo = userInfo;
          }
        }
      } catch (err) {
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:116", "未登录");
        this.user = null;
      }
    },
    async handleWechatLogin() {
      this.logging = true;
      try {
        const loginRes = await new Promise((resolve, reject) => {
          common_vendor.index.login({
            provider: "weixin",
            success: resolve,
            fail: reject
          });
        });
        if (!loginRes.code) {
          throw new Error("获取微信登录code失败");
        }
        let userInfo = {};
        try {
          const userInfoRes = await new Promise((resolve, reject) => {
            common_vendor.index.getUserProfile({
              desc: "用于完善用户资料",
              success: resolve,
              fail: reject
            });
          });
          userInfo = {
            nickName: userInfoRes.userInfo.nickName,
            avatarUrl: userInfoRes.userInfo.avatarUrl,
            gender: userInfoRes.userInfo.gender,
            country: userInfoRes.userInfo.country,
            province: userInfoRes.userInfo.province,
            city: userInfoRes.userInfo.city
          };
          common_vendor.index.setStorageSync("wechatUserInfo", userInfo);
          this.userInfo = userInfo;
        } catch (err) {
          common_vendor.index.__f__("log", "at pages/profile/profile.vue:159", "用户取消授权，使用基础信息");
        }
        const res = await utils_api.authAPI.wechatLogin(loginRes.code, userInfo);
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success"
        });
        await this.checkLogin();
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:174", "微信登录失败：", err);
        common_vendor.index.showToast({
          title: err.message || "登录失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.logging = false;
      }
    },
    async handleLogout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_api.authAPI.logout();
              common_vendor.index.removeStorageSync("wechatUserInfo");
              this.user = null;
              this.userInfo = {};
              common_vendor.index.showToast({
                title: "已退出登录",
                icon: "success"
              });
            } catch (err) {
              common_vendor.index.showToast({
                title: "退出失败",
                icon: "none"
              });
            }
          }
        }
      });
    },
    goToWorkspace() {
      common_vendor.index.navigateTo({
        url: "/pages/workspace/workspace"
      });
    },
    goToPortfolio() {
      common_vendor.index.navigateTo({
        url: "/pages/portfolio/portfolio"
      });
    },
    goToAddresses() {
      common_vendor.index.showToast({
        title: "功能开发中",
        icon: "none"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.user
  }, !$data.user ? common_vendor.e({
    b: $data.logging
  }, $data.logging ? {} : {}, {
    c: $data.logging,
    d: common_vendor.o((...args) => $options.handleWechatLogin && $options.handleWechatLogin(...args))
  }) : common_vendor.e({
    e: $data.userInfo.avatarUrl
  }, $data.userInfo.avatarUrl ? {
    f: $data.userInfo.avatarUrl
  } : {
    g: common_vendor.t($options.userInitial)
  }, {
    h: common_vendor.t($data.userInfo.nickName || $data.user.name || "微信用户"),
    i: $data.user.email
  }, $data.user.email ? {
    j: common_vendor.t($data.user.email)
  } : {}, {
    k: common_vendor.o((...args) => $options.goToWorkspace && $options.goToWorkspace(...args)),
    l: common_vendor.o((...args) => $options.goToPortfolio && $options.goToPortfolio(...args)),
    m: common_vendor.o((...args) => $options.goToAddresses && $options.goToAddresses(...args)),
    n: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args))
  }));
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dd383ca2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
