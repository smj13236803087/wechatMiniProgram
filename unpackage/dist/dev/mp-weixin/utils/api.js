"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "http://localhost:3000";
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: BASE_URL + url,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "Content-Type": "application/json",
        ...options.header
      },
      // 小程序中需要手动处理cookie
      withCredentials: true,
      success: (res) => {
        var _a;
        if (res.cookies && res.cookies.length > 0)
          ;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          if (res.statusCode === 401)
            ;
          reject(new Error(((_a = res.data) == null ? void 0 : _a.error) || `请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/api.js:37", "请求失败:", err);
        reject(new Error(err.errMsg || "网络请求失败"));
      }
    });
  });
}
const authAPI = {
  // 微信登录
  wechatLogin(code, userInfo) {
    return request("/api/auth/wechat/login", {
      method: "POST",
      data: { code, ...userInfo }
    });
  },
  // 邮箱登录（保留，可能不需要）
  login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      data: { email, password }
    });
  },
  // 注册 - 请求验证码
  requestCode(email, name, password) {
    return request("/api/auth/register/request-code", {
      method: "POST",
      data: { email, name, password }
    });
  },
  // 注册 - 验证验证码
  verifyCode(email, code) {
    return request("/api/auth/register/verify", {
      method: "POST",
      data: { email, code }
    });
  },
  // 获取当前用户信息
  getMe() {
    return request("/api/auth/me");
  },
  // 登出
  logout() {
    return request("/api/auth/logout", {
      method: "POST"
    });
  }
};
const designAPI = {
  // 获取所有设计
  getDesigns() {
    return request("/api/designs");
  },
  // 获取单个设计
  getDesign(id) {
    return request(`/api/designs/${id}`);
  },
  // 保存设计
  saveDesign(designData) {
    return request("/api/designs", {
      method: "POST",
      data: designData
    });
  },
  // 更新设计
  updateDesign(id, designData) {
    return request(`/api/designs/${id}`, {
      method: "PUT",
      data: designData
    });
  },
  // 删除设计
  deleteDesign(id) {
    return request(`/api/designs/${id}`, {
      method: "DELETE"
    });
  }
};
const productAPI = {
  // 获取Shopify商品列表
  getProducts() {
    return request("/api/shopify/products");
  }
};
exports.authAPI = authAPI;
exports.designAPI = designAPI;
exports.productAPI = productAPI;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
