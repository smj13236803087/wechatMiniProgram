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
      const name = this.userInfo.nickName || this.user.name || "微";
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
    // 通过button的open-type获取用户信息（小程序推荐方式）
    onGetUserInfo(e) {
      common_vendor.index.__f__("log", "at pages/profile/profile.vue:107", "通过button获取用户信息:", e);
      let userInfo = {};
      if (e.detail && e.detail.userInfo) {
        userInfo = {
          nickName: e.detail.userInfo.nickName,
          avatarUrl: e.detail.userInfo.avatarUrl,
          gender: e.detail.userInfo.gender,
          country: e.detail.userInfo.country,
          province: e.detail.userInfo.province,
          city: e.detail.userInfo.city
        };
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:119", "解析后的用户信息:", userInfo);
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:120", "昵称:", userInfo.nickName, "头像:", userInfo.avatarUrl);
        common_vendor.index.setStorageSync("wechatUserInfo", userInfo);
        this.userInfo = userInfo;
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:125", "设置后的this.userInfo:", this.userInfo);
      } else {
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:128", "用户拒绝授权");
        common_vendor.index.showToast({
          title: "需要授权才能获取昵称和头像",
          icon: "none",
          duration: 2e3
        });
      }
      this.handleWechatLoginWithInfo(userInfo);
    },
    async handleWechatLoginWithInfo(userInfo) {
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
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:155", "获取登录code成功，开始调用登录API...");
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:156", "使用的用户信息:", userInfo);
        const res = await utils_api.authAPI.wechatLogin(loginRes.code, userInfo);
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:161", "登录API返回:", res);
        if (res && res.user) {
          this.user = res.user;
          if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
            this.userInfo = userInfo;
            common_vendor.index.__f__("log", "at pages/profile/profile.vue:170", "使用微信用户信息，设置userInfo:", this.userInfo);
          } else if (res.user.name) {
            this.userInfo = {
              nickName: res.user.name
            };
            common_vendor.index.__f__("log", "at pages/profile/profile.vue:176", "使用后端用户名，设置userInfo:", this.userInfo);
          } else {
            this.userInfo = {
              nickName: "微信用户"
            };
            common_vendor.index.__f__("log", "at pages/profile/profile.vue:181", "使用默认用户名，设置userInfo:", this.userInfo);
          }
          common_vendor.index.__f__("log", "at pages/profile/profile.vue:183", "登录后最终userInfo:", this.userInfo);
          common_vendor.index.__f__("log", "at pages/profile/profile.vue:184", "登录后最终user:", this.user);
        } else {
          await this.checkLogin();
        }
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success"
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:195", "微信登录失败：", err);
        common_vendor.index.showToast({
          title: err.message || "登录失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.logging = false;
      }
    },
    async checkLogin() {
      try {
        const res = await utils_api.authAPI.getMe();
        common_vendor.index.__f__("log", "at pages/profile/profile.vue:209", "getMe响应:", res);
        if (res && res.user) {
          this.user = res.user;
          const storedUserInfo = common_vendor.index.getStorageSync("wechatUserInfo");
          if (storedUserInfo && (storedUserInfo.nickName || storedUserInfo.avatarUrl)) {
            this.userInfo = storedUserInfo;
          } else {
            this.userInfo = {
              nickName: this.user.name || "微信用户"
            };
          }
        } else {
          this.user = null;
          this.userInfo = {};
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:227", "检查登录状态失败:", err);
        this.user = null;
        this.userInfo = {};
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
              this.user = null;
              this.userInfo = {};
              common_vendor.index.showToast({
                title: "已退出登录",
                icon: "success"
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
      common_vendor.index.navigateTo({
        url: "/pages/address/address"
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
    d: common_vendor.o((...args) => $options.onGetUserInfo && $options.onGetUserInfo(...args))
  }) : common_vendor.e({
    e: $data.userInfo.avatarUrl
  }, $data.userInfo.avatarUrl ? {
    f: $data.userInfo.avatarUrl
  } : {
    g: common_vendor.t($options.userInitial)
  }, {
    h: common_vendor.t($data.userInfo.nickName || "微信用户"),
    i: $data.user.email && !$data.userInfo.nickName
  }, $data.user.email && !$data.userInfo.nickName ? {
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
