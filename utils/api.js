// API工具类
// 注意：需要根据实际情况修改BASE_URL
// 开发环境：http://localhost:3000
// 生产环境：需要修改为实际域名，例如：https://your-domain.com
const BASE_URL = 'http://localhost:3000' // 请根据实际情况修改

// 统一请求方法
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      // 小程序中需要手动处理cookie
      withCredentials: true,
      success: (res) => {
        // 处理响应中的cookie（如果需要）
        if (res.cookies && res.cookies.length > 0) {
          // 可以在这里处理cookie，但uni.request会自动处理
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          // 处理401未授权，跳转到登录页
          if (res.statusCode === 401) {
            // 可以在这里统一处理未授权情况
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
  logout() {
    return request('/api/auth/logout', {
      method: 'POST'
    })
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

export default {
  request,
  authAPI,
  designAPI,
  productAPI
}
