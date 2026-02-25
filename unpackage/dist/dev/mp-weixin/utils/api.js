"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "http://localhost:4000";
let storedCookies = {};
function extractCookies(setCookieHeader) {
  if (!setCookieHeader)
    return;
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  cookies.forEach((cookieStr) => {
    const parts = cookieStr.split(";")[0].split("=");
    if (parts.length === 2) {
      storedCookies[parts[0].trim()] = parts[1].trim();
    }
  });
}
function getCookieHeader() {
  return Object.entries(storedCookies).map(([key, value]) => `${key}=${value}`).join("; ");
}
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.header
    };
    const cookieHeader = getCookieHeader();
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }
    common_vendor.index.request({
      url: BASE_URL + url,
      method: options.method || "GET",
      data: options.data || {},
      header: headers,
      success: (res) => {
        var _a;
        if (res.header && res.header["Set-Cookie"]) {
          extractCookies(res.header["Set-Cookie"]);
        }
        if (res.cookies && res.cookies.length > 0) {
          res.cookies.forEach((cookie) => {
            if (cookie.name && cookie.value) {
              storedCookies[cookie.name] = cookie.value;
            }
          });
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          if (res.statusCode === 401) {
            storedCookies = {};
          }
          reject(new Error(((_a = res.data) == null ? void 0 : _a.error) || `请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/api.js:73", "请求失败:", err);
        reject(new Error(err.errMsg || "网络请求失败"));
      }
    });
  });
}
function clearCookies() {
  storedCookies = {};
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
  async logout() {
    try {
      await request("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      clearCookies();
    }
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
  // 获取商品列表（从 mini-program-backstage 的 Product 表拉取）
  getProducts() {
    return request("/api/products");
  }
};
const cartAPI = {
  // 获取当前用户购物车
  getCart() {
    return request("/api/cart");
  },
  // 向购物车添加一个手串设计
  addItem(designPayload) {
    return request("/api/cart", {
      method: "POST",
      data: designPayload
    });
  },
  // 批量删除或清空购物车；传 ids 则删除指定条目，不传则清空
  deleteItems(ids) {
    return request("/api/cart", {
      method: "DELETE",
      data: ids && ids.length ? { ids } : {}
    });
  }
};
const addressAPI = {
  // 获取地址列表
  getAddresses() {
    return request("/api/addresses");
  },
  // 创建地址
  createAddress(addressData) {
    return request("/api/addresses", {
      method: "POST",
      data: addressData
    });
  },
  // 更新地址
  updateAddress(id, addressData) {
    return request(`/api/addresses/${id}`, {
      method: "PUT",
      data: addressData
    });
  },
  // 删除地址
  deleteAddress(id) {
    return request(`/api/addresses/${id}`, {
      method: "DELETE"
    });
  }
};
exports.addressAPI = addressAPI;
exports.authAPI = authAPI;
exports.cartAPI = cartAPI;
exports.designAPI = designAPI;
exports.productAPI = productAPI;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
