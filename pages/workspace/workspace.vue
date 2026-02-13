<template>
	<view class="container">
		<view class="title">工作台</view>
		
		<!-- 手腕尺寸设置弹窗 -->
		<view v-if="showWristSizeModal" class="modal-overlay" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-title">设置手腕尺寸</view>
				<view class="form-item">
					<view class="label">手围（厘米）</view>
					<input 
						type="digit" 
						v-model="wristSizeInput" 
						placeholder="请输入手围"
						class="input"
					/>
				</view>
				<view class="form-item">
					<view class="label">佩戴方式</view>
					<view class="radio-group">
						<view 
							class="radio-item" 
							:class="{ active: wearingStyle === 'single' }"
							@click="wearingStyle = 'single'"
						>
							<text>单圈</text>
						</view>
						<view 
							class="radio-item" 
							:class="{ active: wearingStyle === 'double' }"
							@click="wearingStyle = 'double'"
						>
							<text>双圈</text>
						</view>
					</view>
				</view>
				<button class="modal-btn" @click="completeWristSize">完成</button>
			</view>
		</view>
		
		<view class="workspace-content">
			<!-- 上面：预览区域 -->
			<view class="preview-panel">
				<view class="preview-header">
					<view class="preview-title">手串预览</view>
					<view class="wrist-info" @click="showWristSizeModal = true">
						<text class="wrist-label">手围：{{ wristSize }}cm</text>
						<text class="wrist-style">{{ wearingStyle === 'single' ? '单圈' : '双圈' }}</text>
						<text class="wrist-edit">✏️</text>
					</view>
				</view>
				
				<!-- SVG 圆形预览 -->
				<view class="bracelet-preview-container">
					<view v-if="items.length === 0" class="empty-preview">
						<text>从下方选择材料开始设计</text>
					</view>
					<view v-else class="preview-svg-wrapper">
						<!-- 提示信息 -->
						<view v-if="exceedsLimit" class="preview-tip preview-tip-error">
							已达到设定手围！当前周长：{{ currentCircumference.toFixed(1) }}cm，最大周长：{{ maxCircumference.toFixed(1) }}cm
						</view>
						<view v-else-if="reachesLimit" class="preview-tip preview-tip-success">
							已完美匹配设定手围！手串已自动调整为完美圆形
						</view>
						
						<view class="canvas-container">
							<canvas 
								canvas-id="braceletCanvas"
								:style="{ width: previewSizePx + 'px', height: previewSizePx + 'px' }"
								class="bracelet-canvas"
								@touchstart="handleCanvasTouchStart"
								@touchmove="handleCanvasTouchMove"
								@touchend="handleCanvasTouchEnd"
							></canvas>
						</view>
						
						<!-- 项目列表（简化显示） -->
						<scroll-view class="items-list-mini" scroll-y>
							<view 
								v-for="(item, index) in items" 
								:key="item.id"
								class="item-card-mini"
							>
								<view class="item-info-mini">
									<text class="item-index-mini">{{ index + 1 }}</text>
									<text class="item-name-mini">{{ item.name }}</text>
									<text class="item-price-mini">¥{{ item.price }}</text>
								</view>
								<button class="delete-btn-mini" @click="removeItem(item.id)">删除</button>
							</view>
						</scroll-view>
					</view>
				</view>
				
				<view class="preview-footer">
					<view class="price-section">
						<view class="price-info">
							<text class="price-label">总价：</text>
							<text class="price-value">¥{{ totalPrice }}</text>
						</view>
						<view class="price-info">
							<text class="price-label">项目数：</text>
							<text class="price-value">{{ items.length }}</text>
						</view>
					</view>
					
					<view class="save-section">
						<view class="form-item">
							<view class="label">作品名称</view>
							<input 
								type="text" 
								v-model="designName" 
								placeholder="给你的作品起个名字吧"
								class="input"
							/>
						</view>
						<button 
							class="save-btn" 
							:disabled="items.length === 0 || saving"
							@click="saveDesign"
						>
							{{ saving ? '保存中...' : '保存到我的作品集' }}
						</button>
					</view>
				</view>
			</view>
			
			<!-- 下面：材料选择区域 -->
			<scroll-view class="config-panel" scroll-y>
				<view v-if="loading" class="loading-text">正在加载商品...</view>
				<view v-else-if="error" class="error-text">加载失败：{{ error }}</view>
				<view v-else-if="!categorizedProducts" class="loading-text">暂无商品数据</view>
				<view v-else>
					<!-- 珠子 -->
					<view class="section">
						<view class="section-header">
							<view class="section-title">珠子</view>
							<view v-if="beadStep !== 'category'" class="back-btn" @click="resetBeadSelection">
								<text>← 返回</text>
							</view>
						</view>
						
						<view v-if="beadStep === 'category'">
							<view class="category-grid" v-if="categorizedProducts && validBeadCategories.length > 0">
								<view 
									v-for="category in validBeadCategories" 
									:key="category.key"
									class="category-item"
									@click="selectBeadCategory(category.key)"
								>
									<image 
										:src="getCategoryImage(category.key)" 
										class="category-image"
										mode="aspectFill"
									/>
									<text class="category-name">{{ categorizedProducts[category.key]?.name || '' }}</text>
								</view>
							</view>
						</view>
						
						<view v-else>
							<view class="section-subtitle" v-if="selectedBeadCategory && categorizedProducts && categorizedProducts[selectedBeadCategory]">
								选择 {{ categorizedProducts[selectedBeadCategory]?.name || '' }}
							</view>
							<view class="product-grid" v-if="selectedBeadCategory && categorizedProducts && categorizedProducts[selectedBeadCategory] && categorizedProducts[selectedBeadCategory].products">
								<view 
									v-for="product in categorizedProducts[selectedBeadCategory].products"
									:key="product.id"
									class="product-item"
									@click="selectBeadProduct(product)"
								>
									<image 
										:src="getProductImage(product)" 
										class="product-image"
										mode="aspectFill"
									/>
									<text class="product-name">{{ product.title }}</text>
									<text class="product-price">¥{{ getProductPrice(product) }}</text>
								</view>
							</view>
						</view>
					</view>
					
					<!-- 配饰 -->
					<view class="section">
						<view class="section-header">
							<view class="section-title">配饰</view>
							<view v-if="accessoryStep !== 'category'" class="back-btn" @click="resetAccessorySelection">
								<text>← 返回</text>
							</view>
						</view>
						
						<view v-if="accessoryStep === 'category'">
							<view class="category-grid" v-if="categorizedProducts && validAccessoryCategories.length > 0">
								<view 
									v-for="category in validAccessoryCategories" 
									:key="category.key"
									class="category-item"
									@click="selectAccessoryCategory(category.key)"
								>
									<image 
										:src="getCategoryImage(category.key)" 
										class="category-image"
										mode="aspectFill"
									/>
									<text class="category-name">{{ categorizedProducts[category.key]?.name || '' }}</text>
								</view>
							</view>
						</view>
						
						<view v-else>
							<view class="section-subtitle" v-if="selectedAccessoryCategory && categorizedProducts && categorizedProducts[selectedAccessoryCategory]">
								选择 {{ categorizedProducts[selectedAccessoryCategory]?.name || '' }}
							</view>
							<view class="product-grid" v-if="selectedAccessoryCategory && categorizedProducts && categorizedProducts[selectedAccessoryCategory] && categorizedProducts[selectedAccessoryCategory].products">
								<view 
									v-for="product in categorizedProducts[selectedAccessoryCategory].products"
									:key="product.id"
									class="product-item"
									@click="selectAccessoryProduct(product)"
								>
									<image 
										:src="getProductImage(product)" 
										class="product-image"
										mode="aspectFill"
									/>
									<text class="product-name">{{ product.title }}</text>
									<text class="product-price">¥{{ getProductPrice(product) }}</text>
								</view>
							</view>
						</view>
					</view>
					
					<!-- 吊坠 -->
					<view class="section">
						<view class="section-title">吊坠</view>
						<view v-if="!categorizedProducts || !categorizedProducts.pendant || !categorizedProducts.pendant.products || categorizedProducts.pendant.products.length === 0" class="empty-text">
							暂无吊坠商品
						</view>
						<view v-else class="product-grid">
							<view 
								v-for="product in categorizedProducts.pendant.products"
								:key="product.id"
								class="product-item"
								@click="selectPendantProduct(product)"
							>
								<image 
									:src="getProductImage(product)" 
									class="product-image"
									mode="aspectFill"
								/>
								<text class="product-name">{{ product.title }}</text>
								<text class="product-price">¥{{ getProductPrice(product) }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import { productAPI, designAPI } from '@/utils/api.js'
	import { 
		categorizeProducts, 
		getProductImage, 
		getProductPrice, 
		getProductDiameter, 
		getProductWeight,
		parseDiameter,
		parseWeight,
		calculateTotalPrice,
		generateId
	} from '@/utils/bracelet.js'
	
	export default {
		data() {
			return {
				loading: true,
				error: null,
				categorizedProducts: null,
				items: [],
				showWristSizeModal: false, // 默认不显示，因为已经有默认值
				wristSize: 16, // 默认手围16
				wristSizeInput: '16',
				wearingStyle: 'single', // 默认单圈
				designName: '',
				currentDesignId: null,
				saving: false,
				canvasCtx: null, // Canvas 上下文
				// 珠子选择状态
				beadStep: 'category',
				selectedBeadCategory: null,
				// 配饰选择状态
				accessoryStep: 'category',
				selectedAccessoryCategory: null,
				// 分类映射
				beadCategories: [
					{ key: 'obsidian', category: 'obsidian' },
					{ key: 'amethyst', category: 'amethyst' },
					{ key: 'moonshine', category: 'moonstone' }
				],
				accessoryCategories: [
					{ key: 'cutoff', category: 'spacer' },
					{ key: 'running-laps', category: 'decoration' },
					{ key: 'double-pointed-crystal', category: 'doubleTerminated' }
				]
			}
		},
		computed: {
			totalPrice() {
				return calculateTotalPrice(this.items)
			},
			// 过滤有效的珠子分类
			validBeadCategories() {
				if (!this.categorizedProducts) return []
				return this.beadCategories.filter(category => {
					return category && 
						category.key && 
						this.categorizedProducts[category.key] && 
						this.categorizedProducts[category.key].products && 
						this.categorizedProducts[category.key].products.length > 0
				})
			},
			// 过滤有效的配饰分类
			validAccessoryCategories() {
				if (!this.categorizedProducts) return []
				return this.accessoryCategories.filter(category => {
					return category && 
						category.key && 
						this.categorizedProducts[category.key] && 
						this.categorizedProducts[category.key].products && 
						this.categorizedProducts[category.key].products.length > 0
				})
			},
			// 预览尺寸（像素）- 用于计算
			previewSize() {
				// 在小程序中，canvas 使用像素单位，这里使用 600rpx 对应的像素值
				// 根据设备像素比，通常 1rpx = 0.5px（在 750rpx 设计稿下）
				// 但 canvas 内部使用绝对像素，这里使用固定值 300px 确保显示正常
				return 300
			},
			// 预览尺寸（像素）- 用于样式（rpx转px）
			previewSizePx() {
				// 获取系统信息，计算实际像素值
				const systemInfo = uni.getSystemInfoSync()
				const screenWidth = systemInfo.screenWidth
				// 750rpx 设计稿标准，600rpx 对应的像素值
				return (600 / 750) * screenWidth
			},
			// 中心点坐标
			centerX() {
				return this.previewSize / 2
			},
			centerY() {
				return this.previewSize / 2
			},
			// 基础半径
			radius() {
				return this.previewSize * 0.3
			},
			// 默认直径（毫米）
			defaultDiameter() {
				return 8
			},
			// 毫米转像素比例
			mmToPx() {
				return 2.5
			},
			// 最大和最小缩放因子
			maxPreferredScale() {
				return 2.0
			},
			minPreferredScale() {
				return 0.25
			},
			// 计算当前周长（厘米）
			currentCircumference() {
				const totalDiameterMm = this.items.reduce((sum, item) => {
					return sum + (item.diameter || this.defaultDiameter)
				}, 0)
				return totalDiameterMm / 10 // 毫米转厘米
			},
			// 计算最大周长
			maxCircumference() {
				if (!this.wristSize || !this.wearingStyle) return null
				return this.wearingStyle === 'single' ? this.wristSize * 1.1 : this.wristSize * 2.2
			},
			// 是否达到设定手围
			reachesLimit() {
				if (!this.maxCircumference || this.items.length === 0) return false
				return this.currentCircumference >= this.maxCircumference * 0.95
			},
			// 是否超过设定手围
			exceedsLimit() {
				return this.maxCircumference !== null && this.currentCircumference > this.maxCircumference
			},
			// 计算珠子大小的缩放因子
			beadScale() {
				if (this.items.length === 0) return this.maxPreferredScale

				const target = 2 * Math.PI

				const totalAngleForScale = (scale) => {
					let total = 0
					for (let i = 0; i < this.items.length; i++) {
						const a = this.items[i]
						const b = this.items[(i + 1) % this.items.length]
						const d1 = a.diameter ?? this.defaultDiameter
						const d2 = b.diameter ?? this.defaultDiameter
						const r1 = (d1 / 2) * this.mmToPx * scale
						const r2 = (d2 / 2) * this.mmToPx * scale
						const combined = r1 + r2
						const safeRatio = Math.min(combined / (2 * this.radius), 0.999)
						total += 2 * Math.asin(safeRatio)
					}
					return total
				}

				const maxScale = this.maxPreferredScale
				const minScale = this.minPreferredScale

				const totalAtMax = totalAngleForScale(maxScale)
				if (Math.abs(totalAtMax - target) < 1e-4) return maxScale
				if (totalAtMax < target) {
					return maxScale
				}

				const totalAtMin = totalAngleForScale(minScale)
				if (totalAtMin > target) {
					return minScale
				}

				// 二分查找
				let lo = minScale
				let hi = maxScale
				let best = minScale
				for (let iter = 0; iter < 50; iter++) {
					const mid = (lo + hi) / 2
					const t = totalAngleForScale(mid)
					if (Math.abs(t - target) < 1e-4) {
						best = mid
						break
					}
					if (t > target) {
						hi = mid
					} else {
						lo = mid
						best = mid
					}
					if (hi - lo < 1e-4) break
				}

				return best
			},
			// 计算角度间隔
			angleSteps() {
				if (this.items.length === 0) return []
				
				const steps = []
				for (let i = 0; i < this.items.length; i++) {
					const currentItem = this.items[i]
					const nextItem = this.items[(i + 1) % this.items.length]
					
					const radius1 = this.getBeadRadius(currentItem.diameter)
					const radius2 = this.getBeadRadius(nextItem.diameter)
					const combinedRadius = radius1 + radius2
					const safeRatio = Math.min(combinedRadius / (2 * this.radius), 0.999)
					const angleStep = 2 * Math.asin(safeRatio)
					steps.push(angleStep)
				}
				return steps
			}
		},
		onLoad(options) {
			if (options.designId) {
				this.loadDesign(options.designId)
			}
			this.fetchProducts()
			// 延迟初始化 canvas，确保 DOM 已渲染
			this.$nextTick(() => {
				setTimeout(() => {
					this.initCanvas()
				}, 500)
			})
		},
		watch: {
			items: {
				handler() {
					this.$nextTick(() => {
						this.drawBracelet()
					})
				},
				deep: true
			},
			wristSize() {
				this.$nextTick(() => {
					this.drawBracelet()
				})
			},
			wearingStyle() {
				this.$nextTick(() => {
					this.drawBracelet()
				})
			}
		},
		methods: {
			async fetchProducts() {
				this.loading = true
				this.error = null
				try {
					const res = await productAPI.getProducts()
					// 处理返回的数据结构
					const products = res.products || res || []
					if (!Array.isArray(products)) {
						throw new Error('商品数据格式不正确')
					}
					this.categorizedProducts = categorizeProducts(products)
				} catch (err) {
					this.error = err.message || '拉取商品失败'
					console.error('拉取商品失败：', err)
					this.categorizedProducts = null
				} finally {
					this.loading = false
				}
			},
			
			async loadDesign(id) {
				try {
					const res = await designAPI.getDesign(id)
					const design = res.design
					if (design) {
						this.items = design.items || []
						this.wristSize = design.wristSize || 16
						this.wristSizeInput = String(this.wristSize)
						this.wearingStyle = design.wearingStyle || 'single'
						this.showWristSizeModal = false
						this.designName = design.name || ''
						this.currentDesignId = design.id
					}
				} catch (err) {
					console.error('加载作品失败：', err)
					uni.showToast({
						title: '加载作品失败',
						icon: 'none'
					})
				}
			},
			
			getCategoryImage(categoryKey) {
				if (!this.categorizedProducts || !categoryKey || !this.categorizedProducts[categoryKey]) {
					return ''
				}
				const products = this.categorizedProducts[categoryKey]?.products
				if (products && products.length > 0) {
					return getProductImage(products[0])
				}
				return ''
			},
			
			getProductImage,
			getProductPrice,
			
			checkWristSizeLimit(newDiameter) {
				if (!this.wristSize || !this.wearingStyle) return true
				
				const maxCircumference = this.wearingStyle === 'single' 
					? this.wristSize * 1.1 
					: this.wristSize * 2.2
				const defaultDiameter = 8
				const currentTotalDiameterMm = this.items.reduce((sum, item) => {
					return sum + (item.diameter || defaultDiameter)
				}, 0)
				const newTotalDiameterMm = currentTotalDiameterMm + (newDiameter || defaultDiameter)
				const newCircumference = newTotalDiameterMm / 10
				
				return newCircumference <= maxCircumference
			},
			
			selectBeadCategory(categoryKey) {
				this.selectedBeadCategory = categoryKey
				this.beadStep = 'product'
			},
			
			resetBeadSelection() {
				this.beadStep = 'category'
				this.selectedBeadCategory = null
			},
			
			selectBeadProduct(product) {
				if (!this.selectedBeadCategory) return
				
				const category = this.beadCategories.find(c => c && c.key === this.selectedBeadCategory)
				if (!category || !category.category) return
				
				const diameterStr = getProductDiameter(product)
				const weightStr = getProductWeight(product)
				const diameter = diameterStr ? parseDiameter(diameterStr) : undefined
				const weight = weightStr ? parseWeight(weightStr) : undefined
				
				if (!this.checkWristSizeLimit(diameter || 8)) {
					uni.showToast({
						title: '已达到设定手围！无法添加更多珠子。',
						icon: 'none'
					})
					return
				}
				
				const newItem = {
					id: generateId(),
					type: 'bead',
					beadCategory: category.category,
					beadSubType: product.title,
					name: product.title,
					price: getProductPrice(product),
					color: '#8b4513',
					image: getProductImage(product),
					diameter,
					weight
				}
				this.items.push(newItem)
				this.resetBeadSelection()
			},
			
			selectAccessoryCategory(categoryKey) {
				this.selectedAccessoryCategory = categoryKey
				this.accessoryStep = 'product'
			},
			
			resetAccessorySelection() {
				this.accessoryStep = 'category'
				this.selectedAccessoryCategory = null
			},
			
			selectAccessoryProduct(product) {
				if (!this.selectedAccessoryCategory) return
				
				const category = this.accessoryCategories.find(c => c && c.key === this.selectedAccessoryCategory)
				if (!category || !category.category) return
				
				const diameterStr = getProductDiameter(product)
				const weightStr = getProductWeight(product)
				const diameter = diameterStr ? parseDiameter(diameterStr) : undefined
				const weight = weightStr ? parseWeight(weightStr) : undefined
				
				if (!this.checkWristSizeLimit(diameter || 8)) {
					uni.showToast({
						title: '已达到设定手围！无法添加更多配饰。',
						icon: 'none'
					})
					return
				}
				
				const newItem = {
					id: generateId(),
					type: 'accessory',
					accessoryCategory: category.category,
					accessorySubType: product.title,
					name: product.title,
					price: getProductPrice(product),
					color: '#8b4513',
					image: getProductImage(product),
					diameter,
					weight
				}
				this.items.push(newItem)
				this.resetAccessorySelection()
			},
			
			selectPendantProduct(product) {
				const diameterStr = getProductDiameter(product)
				const weightStr = getProductWeight(product)
				const diameter = diameterStr ? parseDiameter(diameterStr) : undefined
				const weight = weightStr ? parseWeight(weightStr) : undefined
				
				if (!this.checkWristSizeLimit(diameter || 8)) {
					uni.showToast({
						title: '已达到设定手围！无法添加更多吊坠。',
						icon: 'none'
					})
					return
				}
				
				const newItem = {
					id: generateId(),
					type: 'pendant',
					pendantType: 'pendant',
					name: product.title,
					price: getProductPrice(product),
					color: '#8b4513',
					image: getProductImage(product),
					diameter,
					weight
				}
				this.items.push(newItem)
			},
			
			removeItem(id) {
				this.items = this.items.filter(item => item.id !== id)
			},
			
			// 获取珠子半径（像素）
			getBeadRadius(diameter) {
				const diameterMm = diameter || this.defaultDiameter
				return (diameterMm / 2) * this.mmToPx * this.beadScale
			},
			
			// 获取珠子的角度位置
			getItemAngle(index) {
				if (index === 0) return 0
				
				let cumulativeAngle = 0
				for (let i = 0; i < index; i++) {
					cumulativeAngle += this.angleSteps[i]
				}
				return cumulativeAngle
			},
			
			// 获取珠子的 X 坐标
			getItemX(index) {
				const angle = this.getItemAngle(index)
				return this.centerX + this.radius * Math.cos(angle)
			},
			
			// 获取珠子的 Y 坐标
			getItemY(index) {
				const angle = this.getItemAngle(index)
				return this.centerY + this.radius * Math.sin(angle)
			},
			
			// 初始化 canvas
			initCanvas() {
				// 使用 uni.createCanvasContext 创建 canvas 上下文（适用于微信小程序）
				this.canvasCtx = uni.createCanvasContext('braceletCanvas', this)
				// 延迟绘制，确保 canvas 已渲染
				setTimeout(() => {
					this.drawBracelet()
				}, 100)
			},
			
			// 绘制手串
			drawBracelet() {
				if (!this.canvasCtx) {
					return
				}
				
				const ctx = this.canvasCtx
				const size = this.previewSize
				
				// 清空画布
				ctx.clearRect(0, 0, size, size)
				
				if (this.items.length === 0) {
					ctx.draw()
					return
				}
				
				// 绘制圆形路径（虚线）
				ctx.beginPath()
				ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI)
				ctx.setStrokeStyle('#e5e7eb')
				ctx.setLineWidth(2)
				// 小程序中虚线使用 setLineDash
				ctx.setLineDash([5, 5], 0)
				ctx.stroke()
				ctx.setLineDash([], 0)
				
				// 绘制每个珠子
				for (let i = 0; i < this.items.length; i++) {
					const item = this.items[i]
					const x = this.getItemX(i)
					const y = this.getItemY(i)
					const radius = this.getBeadRadius(item.diameter)
					const color = item.color || '#8b4513'
					
					// 绘制珠子
					ctx.beginPath()
					ctx.arc(x, y, radius, 0, 2 * Math.PI)
					ctx.setFillStyle(color)
					ctx.fill()
					
					// 绘制白色边框
					ctx.setStrokeStyle('#ffffff')
					ctx.setLineWidth(2)
					ctx.stroke()
				}
				
				// 绘制到画布
				ctx.draw()
			},
			
			// Canvas 触摸开始
			handleCanvasTouchStart(e) {
				// 拖拽功能可以后续完善
				console.log('Canvas touch start', e)
			},
			
			// Canvas 触摸移动
			handleCanvasTouchMove(e) {
				// 拖拽功能可以后续完善
				console.log('Canvas touch move', e)
			},
			
			// Canvas 触摸结束
			handleCanvasTouchEnd(e) {
				// 拖拽功能可以后续完善
				console.log('Canvas touch end', e)
			},
			
			completeWristSize() {
				const size = parseFloat(this.wristSizeInput)
				if (!size || size <= 0) {
					uni.showToast({
						title: '请输入有效的手围',
						icon: 'none'
					})
					return
				}
				if (!this.wearingStyle) {
					uni.showToast({
						title: '请选择佩戴方式',
						icon: 'none'
					})
					return
				}
				this.wristSize = size
				this.showWristSizeModal = false
			},
			
			closeModal() {
				// 允许关闭，因为有默认值
				this.showWristSizeModal = false
			},
			
			async saveDesign() {
				if (!this.items.length) {
					uni.showToast({
						title: '请先设计手串再保存～',
						icon: 'none'
					})
					return
				}
				if (!this.wristSize || !this.wearingStyle) {
					uni.showToast({
						title: '请先完成手腕尺寸设置～',
						icon: 'none'
					})
					this.showWristSizeModal = true
					return
				}
				const trimmed = this.designName.trim()
				if (!trimmed) {
					uni.showToast({
						title: '请先输入作品名称',
						icon: 'none'
					})
					return
				}
				
				this.saving = true
				try {
					const totalWeight = this.items.reduce((sum, item) => sum + (item.weight || 0), 0)
					const diameters = this.items.map(i => i.diameter).filter(d => !!d)
					const averageDiameter = diameters.length > 0
						? diameters.reduce((a, b) => a + b, 0) / diameters.length
						: null
					
					const designData = {
						id: this.currentDesignId || undefined,
						name: trimmed,
						items: this.items,
						totalPrice: this.totalPrice,
						totalWeight: totalWeight,
						averageDiameter: averageDiameter,
						wristSize: this.wristSize,
						wearingStyle: this.wearingStyle
					}
					
					const res = await designAPI.saveDesign(designData)
					this.currentDesignId = res.design.id
					
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					})
					
					setTimeout(() => {
						uni.switchTab({
							url: '/pages/portfolio/portfolio'
						})
					}, 1500)
				} catch (err) {
					uni.showToast({
						title: err.message || '保存失败，请稍后重试',
						icon: 'none'
					})
				} finally {
					this.saving = false
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: #f3f4f6;
		padding: 20rpx;
	}
	
	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 20rpx;
	}
	
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 60rpx 40rpx;
		width: 80%;
		max-width: 600rpx;
	}
	
	.modal-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 40rpx;
		text-align: center;
	}
	
	.form-item {
		margin-bottom: 40rpx;
	}
	
	.label {
		font-size: 28rpx;
		font-weight: 600;
		color: #374151;
		margin-bottom: 16rpx;
		display: block;
	}
	
	.input {
		width: 100%;
		height: 88rpx;
		border: 4rpx solid #e5e7eb;
		border-radius: 16rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		background: #ffffff;
	}
	
	.radio-group {
		display: flex;
		gap: 20rpx;
	}
	
	.radio-item {
		flex: 1;
		padding: 24rpx;
		border: 4rpx solid #e5e7eb;
		border-radius: 16rpx;
		text-align: center;
		font-size: 28rpx;
		color: #6b7280;
		transition: all 0.3s;
	}
	
	.radio-item.active {
		border-color: #3b82f6;
		background: #eff6ff;
		color: #3b82f6;
		font-weight: 600;
	}
	
	.modal-btn {
		width: 100%;
		height: 96rpx;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		border-radius: 16rpx;
		border: none;
	}
	
	.workspace-content {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}
	
	.preview-panel {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}
	
	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
		padding-bottom: 20rpx;
		border-bottom: 2rpx solid #f3f4f6;
	}
	
	.preview-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #1f2937;
	}
	
	.wrist-info {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 12rpx 20rpx;
		background: #f3f4f6;
		border-radius: 20rpx;
		font-size: 24rpx;
	}
	
	.wrist-label {
		color: #6b7280;
	}
	
	.wrist-style {
		color: #3b82f6;
		font-weight: 600;
	}
	
	.wrist-edit {
		font-size: 28rpx;
	}
	
	.config-panel {
		flex: 1;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}
	
	.loading-text, .error-text, .empty-text {
		text-align: center;
		padding: 60rpx 0;
		font-size: 28rpx;
		color: #6b7280;
	}
	
	.error-text {
		color: #dc2626;
	}
	
	.section {
		margin-bottom: 60rpx;
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}
	
	.section-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #1f2937;
	}
	
	.back-btn {
		font-size: 26rpx;
		color: #3b82f6;
	}
	
	.section-subtitle {
		font-size: 26rpx;
		color: #6b7280;
		margin-bottom: 24rpx;
	}
	
	.category-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20rpx;
	}
	
	.category-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30rpx 20rpx;
		border: 4rpx solid #e5e7eb;
		border-radius: 16rpx;
		transition: all 0.3s;
	}
	
	.category-item:active {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	
	.category-image {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		margin-bottom: 16rpx;
		background: #f3f4f6;
	}
	
	.category-name {
		font-size: 26rpx;
		font-weight: 500;
		color: #374151;
		text-align: center;
	}
	
	.product-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}
	
	.product-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24rpx;
		border: 4rpx solid #e5e7eb;
		border-radius: 16rpx;
		transition: all 0.3s;
	}
	
	.product-item:active {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	
	.product-image {
		width: 160rpx;
		height: 160rpx;
		border-radius: 16rpx;
		margin-bottom: 16rpx;
		background: #f3f4f6;
	}
	
	.product-name {
		font-size: 24rpx;
		font-weight: 500;
		color: #374151;
		text-align: center;
		margin-bottom: 8rpx;
	}
	
	.product-price {
		font-size: 24rpx;
		color: #6b7280;
	}
	
	.bracelet-preview-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		margin-bottom: 24rpx;
	}
	
	.preview-svg-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.preview-tip {
		width: 100%;
		padding: 20rpx;
		border-radius: 16rpx;
		margin-bottom: 24rpx;
		font-size: 24rpx;
		text-align: center;
	}
	
	.preview-tip-error {
		background: #fef2f2;
		border: 2rpx solid #fecaca;
		color: #dc2626;
	}
	
	.preview-tip-success {
		background: #f0fdf4;
		border: 2rpx solid #bbf7d0;
		color: #16a34a;
	}
	
	.canvas-container {
		width: 600rpx;
		height: 600rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 24rpx;
		background: #ffffff;
		border-radius: 16rpx;
		overflow: hidden;
	}
	
	.bracelet-canvas {
		width: 100%;
		height: 100%;
		display: block;
	}
	
	.bead-circle {
		transition: all 0.3s;
	}
	
	.items-list-mini {
		width: 100%;
		max-height: 300rpx;
		margin-top: 24rpx;
	}
	
	.item-card-mini {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 20rpx;
		background: #f9fafb;
		border-radius: 12rpx;
		margin-bottom: 12rpx;
	}
	
	.item-info-mini {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}
	
	.item-index-mini {
		width: 40rpx;
		height: 40rpx;
		background: #3b82f6;
		color: #ffffff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		font-weight: 600;
		flex-shrink: 0;
	}
	
	.item-name-mini {
		flex: 1;
		font-size: 26rpx;
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.item-price-mini {
		font-size: 26rpx;
		font-weight: 600;
		color: #3b82f6;
		margin-left: 12rpx;
	}
	
	.delete-btn-mini {
		padding: 8rpx 16rpx;
		background: #fef2f2;
		color: #dc2626;
		border-radius: 8rpx;
		font-size: 22rpx;
		border: none;
	}
	
	.preview-footer {
		border-top: 2rpx solid #f3f4f6;
		padding-top: 24rpx;
	}
	
	.empty-preview {
		text-align: center;
		padding: 120rpx 0;
		font-size: 26rpx;
		color: #6b7280;
	}
	
	
	.price-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;
		padding: 20rpx;
		background: #f9fafb;
		border-radius: 16rpx;
	}
	
	.price-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
	}
	
	.price-label {
		font-size: 24rpx;
		color: #6b7280;
	}
	
	.price-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #3b82f6;
	}
	
	.save-section {
		margin-top: 24rpx;
	}
	
	.save-btn {
		width: 100%;
		height: 96rpx;
		background: linear-gradient(135deg, #8b5cf6, #ec4899);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		border-radius: 16rpx;
		border: none;
		margin-top: 20rpx;
	}
	
	.save-btn[disabled] {
		opacity: 0.5;
	}
</style>
