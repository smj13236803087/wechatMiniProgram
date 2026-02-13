// API工具类
// 注意：需要根据实际情况修改BASE_URL
// 开发环境：http://localhost:3000
// 生产环境：需要修改为实际域名，例如：https://your-domain.com
const BASE_URL = 'http://localhost:3000' // 请根据实际情况修改

// Cookie存储（小程序中需要手动管理cookie）
let storedCookies = {}

// 从响应头中提取cookie
function extractCookies(setCookieHeader) {
  if (!setCookieHeader) return
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  cookies.forEach(cookieStr => {
    const parts = cookieStr.split(';')[0].split('=')
    if (parts.length === 2) {
      storedCookies[parts[0].trim()] = parts[1].trim()
    }
  })
}

// 生成Cookie请求头
function getCookieHeader() {
  return Object.entries(storedCookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
}

// 统一请求方法
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    // 添加Cookie到请求头
    const cookieHeader = getCookieHeader()
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }
    
    uni.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      success: (res) => {
        // 处理响应中的cookie
        if (res.header && res.header['Set-Cookie']) {
          extractCookies(res.header['Set-Cookie'])
        }
        if (res.cookies && res.cookies.length > 0) {
          res.cookies.forEach(cookie => {
            if (cookie.name && cookie.value) {
              storedCookies[cookie.name] = cookie.value
            }
          })
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          // 处理401未授权
          if (res.statusCode === 401) {
            // 清除cookie
            storedCookies = {}
          }
          reject(new Error(res.data?.error || `请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

// 清除所有cookie（用于登出）
export function clearCookies() {
  storedCookies = {}
}

// 认证相关API
export const authAPI = {
  // 微信登录
  wechatLogin(code, userInfo) {
    return request('/api/auth/wechat/login', {
      method: 'POST',
      data: { code, ...userInfo }
    })
  },
  
  // 邮箱登录（保留，可能不需要）
  login(email, password) {
    return request('/api/auth/login', {
      method: 'POST',
      data: { email, password }
    })
  },
  
  // 注册 - 请求验证码
  requestCode(email, name, password) {
    return request('/api/auth/register/request-code', {
      method: 'POST',
      data: { email, name, password }
    })
  },
  
  // 注册 - 验证验证码
  verifyCode(email, code) {
    return request('/api/auth/register/verify', {
      method: 'POST',
      data: { email, code }
    })
  },
  
  // 获取当前用户信息
  getMe() {
    return request('/api/auth/me')
  },
  
  // 登出
  async logout() {
    try {
      await request('/api/auth/logout', {
        method: 'POST'
      })
    } finally {
      // 清除本地cookie
      clearCookies()
    }
  }
}

// 设计相关API
export const designAPI = {
  // 获取所有设计
  getDesigns() {
    return request('/api/designs')
  },
  
  // 获取单个设计
  getDesign(id) {
    return request(`/api/designs/${id}`)
  },
  
  // 保存设计
  saveDesign(designData) {
    return request('/api/designs', {
      method: 'POST',
      data: designData
    })
  },
  
  // 更新设计
  updateDesign(id, designData) {
    return request(`/api/designs/${id}`, {
      method: 'PUT',
      data: designData
    })
  },
  
  // 删除设计
  deleteDesign(id) {
    return request(`/api/designs/${id}`, {
      method: 'DELETE'
    })
  }
}

// 商品相关API
export const productAPI = {
  // 获取Shopify商品列表
  getProducts() {
    return request('/api/shopify/products')
  }
}

// 地址相关API
export const addressAPI = {
  // 获取地址列表
  getAddresses() {
    return request('/api/addresses')
  },
  
  // 创建地址
  createAddress(addressData) {
    return request('/api/addresses', {
      method: 'POST',
      data: addressData
    })
  },
  
  // 更新地址
  updateAddress(id, addressData) {
    return request(`/api/addresses/${id}`, {
      method: 'PUT',
      data: addressData
    })
  },
  
  // 删除地址
  deleteAddress(id) {
    return request(`/api/addresses/${id}`, {
      method: 'DELETE'
    })
  }
}

export default {
  request,
  authAPI,
  designAPI,
  productAPI,
  addressAPI
}
