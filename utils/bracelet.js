// 手串相关工具函数

// 计算手串总价
export function calculateTotalPrice(items) {
  return items.reduce((total, item) => total + (item.price || 0), 0)
}

// 生成唯一ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 解析直径字符串，如 "6mm" -> 6（毫米）
export function parseDiameter(diameterStr) {
  if (!diameterStr) return undefined
  
  const match = diameterStr.match(/(\d+\.?\d*)/)
  if (match) {
    return parseFloat(match[1])
  }
  return undefined
}

// 解析重量字符串，如 "1.65g" -> 1.65（克）
export function parseWeight(weightStr) {
  if (!weightStr) return undefined
  
  const match = weightStr.match(/(\d+\.?\d*)/)
  if (match) {
    return parseFloat(match[1])
  }
  return undefined
}

// 从商品数据中获取图片
export function getProductImage(product) {
  if (product.image && product.image.src) {
    return product.image.src
  }
  if (product.images && product.images.length > 0) {
    return product.images[0].src
  }
  return ''
}

// 获取商品价格
export function getProductPrice(product) {
  if (product.variants && product.variants.length > 0) {
    return parseFloat(product.variants[0].price) || 0
  }
  return 0
}

// 获取商品直径
export function getProductDiameter(product) {
  if (!product.options || product.options.length === 0) {
    return null
  }
  
  const diameterOption = product.options.find(
    (opt) => opt.name.toLowerCase().trim() === 'diameter'
  )
  
  if (diameterOption && diameterOption.values && diameterOption.values.length > 0) {
    return diameterOption.values[0].trim()
  }
  
  return null
}

// 获取商品重量
export function getProductWeight(product) {
  if (!product.options || product.options.length === 0) {
    return null
  }
  
  const weightOption = product.options.find(
    (opt) => opt.name.toLowerCase().trim() === 'weight'
  )
  
  if (weightOption && weightOption.values && weightOption.values.length > 0) {
    return weightOption.values[0].trim()
  }
  
  return null
}

// 将商品按 product_type 分类
export function categorizeProducts(products) {
  const categorized = {
    obsidian: { category: 'obsidian', name: '曜石', products: [] },
    amethyst: { category: 'amethyst', name: '紫水晶', products: [] },
    moonshine: { category: 'moonstone', name: '月光', products: [] },
    cutoff: { category: 'spacer', name: '隔断', products: [] },
    'double-pointed-crystal': { category: 'doubleTerminated', name: '双尖水晶', products: [] },
    'running-laps': { category: 'decoration', name: '跑环', products: [] },
    pendant: { category: 'pendant', name: '吊坠', products: [] }
  }
  
  products.forEach((product) => {
    const productType = (product.product_type || '').toLowerCase()
    if (productType in categorized) {
      categorized[productType].products.push(product)
    }
  })
  
  return categorized
}
