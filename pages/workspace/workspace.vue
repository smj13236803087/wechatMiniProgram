<template>
	<view class="container">
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
			<!-- 固定顶部：预览区域 -->
			<view class="preview-panel-fixed">
				<!-- 预览和右侧信息并排 -->
				<view class="preview-content-row">
					<!-- Canvas 圆形预览 -->
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
							
							<view class="canvas-container" @touchmove.prevent.stop>
								<canvas 
									canvas-id="braceletCanvas"
									:style="{ width: previewSizePx + 'px', height: previewSizePx + 'px' }"
									class="bracelet-canvas"
									@touchstart.stop="handleCanvasTouchStart"
									@touchmove.stop.prevent="handleCanvasTouchMove"
									@touchend.stop="handleCanvasTouchEnd"
								></canvas>
							</view>
						</view>
					</view>
					
					<!-- 右侧信息（手围、价格等） -->
					<view class="info-section-right">
						<view class="wrist-info">
							<text class="wrist-label">手围：{{ wristSize }}cm</text>
							<text class="wrist-style">{{ wearingStyle === 'single' ? '单圈' : '双圈' }}</text>
						</view>
						<view class="price-info">
							<text class="price-label">总价：</text>
							<text class="price-value">¥{{ totalPrice }}</text>
						</view>
						<view class="price-info">
							<text class="price-label">项目数：</text>
							<text class="price-value">{{ items.length }}</text>
						</view>
					</view>
				</view>
				
				<!-- 删除区域 -->
				<view 
					class="delete-zone"
					:class="{ 'delete-zone-active': dragState.isDragging && dragState.isOverDeleteZone }"
				>
					<text class="delete-zone-text">拖到此处删除</text>
				</view>
			</view>
			
			<!-- 材料选择区域（占屏幕三分之二高度） -->
			<view class="material-panel">
				<!-- 顶部主tab -->
				<view class="main-tabs">
					<view 
						class="main-tab-item"
						:class="{ 'active': activeMainTab === 'bead' }"
						@click="activeMainTab = 'bead'"
					>
						珠子
					</view>
					<view 
						class="main-tab-item"
						:class="{ 'active': activeMainTab === 'accessory' }"
						@click="activeMainTab = 'accessory'"
					>
						配饰
					</view>
					<view 
						class="main-tab-item"
						:class="{ 'active': activeMainTab === 'pendant' }"
						@click="activeMainTab = 'pendant'"
					>
						吊坠
					</view>
				</view>
				
				<!-- 内容区域 -->
				<view class="material-content">
					<view v-if="loading" class="loading-text">正在加载商品...</view>
					<view v-else-if="error" class="error-text">加载失败：{{ error }}</view>
					<view v-else-if="!categorizedProducts" class="loading-text">暂无商品数据</view>
					<view v-else>
						<!-- 珠子tab -->
						<view v-if="activeMainTab === 'bead'" class="material-tab-content">
							<!-- 左侧：子分类tab -->
							<view class="sub-tabs">
								<view 
									v-for="category in validBeadCategories" 
									:key="category.key"
									class="sub-tab-item"
									:class="{ 'active': activeBeadSubTab === category.key }"
									@click="activeBeadSubTab = category.key"
								>
									{{ categorizedProducts[category.key]?.name || '' }}
								</view>
							</view>
							<!-- 右侧：商品列表 -->
							<scroll-view class="product-list" scroll-y>
								<view 
									v-if="activeBeadSubTab && categorizedProducts[activeBeadSubTab] && categorizedProducts[activeBeadSubTab].products"
									class="product-grid"
								>
									<view 
										v-for="product in categorizedProducts[activeBeadSubTab].products"
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
								<view v-else class="empty-text">请选择分类</view>
							</scroll-view>
						</view>
						
						<!-- 配饰tab -->
						<view v-if="activeMainTab === 'accessory'" class="material-tab-content">
							<!-- 左侧：子分类tab -->
							<view class="sub-tabs">
								<view 
									v-for="category in validAccessoryCategories" 
									:key="category.key"
									class="sub-tab-item"
									:class="{ 'active': activeAccessorySubTab === category.key }"
									@click="activeAccessorySubTab = category.key"
								>
									{{ categorizedProducts[category.key]?.name || '' }}
								</view>
							</view>
							<!-- 右侧：商品列表 -->
							<scroll-view class="product-list" scroll-y>
								<view 
									v-if="activeAccessorySubTab && categorizedProducts[activeAccessorySubTab] && categorizedProducts[activeAccessorySubTab].products"
									class="product-grid"
								>
									<view 
										v-for="product in categorizedProducts[activeAccessorySubTab].products"
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
								<view v-else class="empty-text">请选择分类</view>
							</scroll-view>
						</view>
						
						<!-- 吊坠tab -->
						<view v-if="activeMainTab === 'pendant'" class="material-tab-content">
							<scroll-view class="product-list-full" scroll-y>
								<view 
									v-if="categorizedProducts.pendant && categorizedProducts.pendant.products"
									class="product-grid"
								>
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
								<view v-else class="empty-text">暂无吊坠商品</view>
							</scroll-view>
						</view>
					</view>
					
					<!-- 保存作品区域 -->
					<view class="save-section-compact">
						<view class="save-form-item">
							<text class="save-label">作品名称</text>
							<input 
								type="text" 
								v-model="designName" 
								placeholder="给你的作品起个名字"
								class="save-input"
							/>
						</view>
						<view class="save-btn-group">
							<button 
								class="save-btn-compact secondary" 
								:disabled="items.length === 0 || saving || processingOrder"
								@click="saveDesign"
							>
								{{ saving ? '保存中...' : '仅保存' }}
							</button>
							<button 
								class="save-btn-compact" 
								:disabled="items.length === 0 || processingOrder"
								@click="completeAndGoToCashier"
							>
								{{ processingOrder ? '处理中...' : '完成' }}
							</button>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 可滚动：材料选择区域（旧版，待删除） -->
			<scroll-view 
				class="config-panel" 
				:scroll-y="!dragState.isDragging"
				:enable-back-to-top="!dragState.isDragging"
				style="display: none;"
			>
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
					
					<!-- 保存作品区域 -->
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
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { productAPI, designAPI, cartAPI } from '@/utils/api.js'
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
				// 拖拽状态
				dragState: {
					isDragging: false,
					dragItemId: null,
					dragItemIndex: -1,
					startX: 0,
					startY: 0,
					currentX: 0,
					currentY: 0,
					isOverDeleteZone: false,
					nearestBeadIndex: -1, // 最近的珠子索引（用于换位置）
					longPressTimer: null,
					drawTimer: null, // 绘制节流定时器
					canvasRect: null // 缓存 canvas 位置
				},
				// 珠子选择状态
				beadStep: 'category',
				selectedBeadCategory: null,
				// 配饰选择状态
				accessoryStep: 'category',
				selectedAccessoryCategory: null,
				// 新的tab状态
				activeMainTab: 'bead', // 主tab：bead, accessory, pendant
				activeBeadSubTab: null, // 珠子子tab：obsidian, amethyst, moonshine
				activeAccessorySubTab: null, // 配饰子tab
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
				],
				// 下单 / 收银台流程状态
				processingOrder: false
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
				// 放大预览区域到 260px，使手串更易点击
				return 260
			},
			// 预览尺寸（像素）- 用于样式（rpx转px）
			previewSizePx() {
				// 获取系统信息，计算实际像素值
				const systemInfo = uni.getSystemInfoSync()
				const screenWidth = systemInfo.screenWidth
				// 预览区域放大到 500rpx，使视觉更大
				return (500 / 750) * screenWidth
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
				// 稍微放大圆半径，让手串占据更多空间
				return this.previewSize * 0.35
			},
			// 默认直径（毫米）
			defaultDiameter() {
				return 8
			},
			// 毫米转像素比例
			mmToPx() {
				// 放大珠子尺寸，提升可点击性
				return 3.0
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
				// 编辑已有作品：加载作品并使用已有手围配置
				this.loadDesign(options.designId)
			} else {
				// 新建作品：首次进入时要求设置手围
				this.showWristSizeModal = true
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
			},
			// 监听主tab切换，自动设置第一个子tab
			activeMainTab(newVal) {
				if (newVal === 'bead' && this.validBeadCategories.length > 0) {
					this.activeBeadSubTab = this.validBeadCategories[0].key
				} else if (newVal === 'accessory' && this.validAccessoryCategories.length > 0) {
					this.activeAccessorySubTab = this.validAccessoryCategories[0].key
				}
			},
			// 监听珠子分类变化，自动设置第一个子tab
			validBeadCategories: {
				handler(newVal) {
					if (this.activeMainTab === 'bead' && newVal.length > 0 && !this.activeBeadSubTab) {
						this.activeBeadSubTab = newVal[0].key
					}
				},
				immediate: true
			},
			// 监听配饰分类变化，自动设置第一个子tab
			validAccessoryCategories: {
				handler(newVal) {
					if (this.activeMainTab === 'accessory' && newVal.length > 0 && !this.activeAccessorySubTab) {
						this.activeAccessorySubTab = newVal[0].key
					}
				},
				immediate: true
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
				if (!this.activeBeadSubTab) return
				
				const category = this.beadCategories.find(c => c && c.key === this.activeBeadSubTab)
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
				// 新UI不需要重置，保持在当前tab
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
				if (!this.activeAccessorySubTab) return
				
				const category = this.accessoryCategories.find(c => c && c.key === this.activeAccessorySubTab)
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
				// 新UI不需要重置，保持在当前tab
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
				// 添加删除动画效果
				const index = this.items.findIndex(item => item.id === id)
				if (index === -1) return
				
				// 移除震动反馈，避免屏幕抖动
				// uni.vibrateShort({
				// 	type: 'heavy'
				// })
				
				// 显示删除提示
				uni.showToast({
					title: '已删除',
					icon: 'success',
					duration: 500
				})
				
				// 延迟删除，让用户看到反馈
				setTimeout(() => {
					this.items = this.items.filter(item => item.id !== id)
					this.drawBracelet()
				}, 100)
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
				
				// 使用拖拽状态中保存的最近珠子索引
				const nearestBeadIndex = this.dragState.nearestBeadIndex
				
				// 绘制所有珠子（被选中的珠子不绘制，让它消失）
				for (let i = 0; i < this.items.length; i++) {
					// 被选中的珠子不显示
					if (this.dragState.isDragging && i === this.dragState.dragItemIndex) {
						continue
					}
					
					const item = this.items[i]
					const x = this.getItemX(i)
					const y = this.getItemY(i)
					const radius = this.getBeadRadius(item.diameter)
					const color = item.color || '#8b4513'
					
					// 如果是最近的珠子，先绘制虚线边框
					if (i === nearestBeadIndex) {
						ctx.beginPath()
						ctx.arc(x, y, radius + 4, 0, 2 * Math.PI)
						ctx.setStrokeStyle('#3b82f6')
						ctx.setLineWidth(3)
						ctx.setLineDash([5, 5], 0)
						ctx.stroke()
						ctx.setLineDash([], 0)
					}
					
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
			
			// Canvas 触摸开始 - 检测长按
			handleCanvasTouchStart(e) {
				if (this.items.length === 0) return
				
				// 阻止事件冒泡，防止页面滚动
				e.stopPropagation()
				
				const touch = e.touches[0]
				// 获取 canvas 的位置信息并缓存
				const query = uni.createSelectorQuery().in(this)
				query.select('.canvas-container').boundingClientRect((rect) => {
					if (!rect) return
					
					// 缓存 canvas 位置
					this.dragState.canvasRect = rect
					
					// 计算相对于 canvas 的坐标
					const x = touch.clientX - rect.left
					const y = touch.clientY - rect.top
					
					// 找到点击的珠子
					const itemIndex = this.findItemAtPosition(x, y)
					if (itemIndex === -1) return
					
					// 清除之前的定时器
					if (this.dragState.longPressTimer) {
						clearTimeout(this.dragState.longPressTimer)
					}
					
					// 设置长按定时器（500ms）
					this.dragState.longPressTimer = setTimeout(() => {
						this.startDrag(itemIndex, x, y)
					}, 500)
				}).exec()
			},
			
			// Canvas 触摸移动
			handleCanvasTouchMove(e) {
				// 阻止事件冒泡和默认行为，彻底防止页面滚动
				e.stopPropagation()
				if (e.preventDefault) {
					e.preventDefault()
				}
				
				if (!this.dragState.isDragging) {
					// 如果移动了，取消长按
					if (this.dragState.longPressTimer) {
						clearTimeout(this.dragState.longPressTimer)
						this.dragState.longPressTimer = null
					}
					return false
				}
				
				const touch = e.touches[0]
				
				// 使用缓存的 canvas 位置直接计算坐标，保证流畅
				const canvasRect = this.dragState.canvasRect
				if (!canvasRect) {
					// 如果缓存不存在，立即获取（这种情况应该很少）
					const query = uni.createSelectorQuery().in(this)
					query.select('.canvas-container').boundingClientRect((rect) => {
						if (rect) {
							this.dragState.canvasRect = rect
							const x = touch.clientX - rect.left
							const y = touch.clientY - rect.top
							this.updateDragPosition(x, y, touch)
						}
					}).exec()
					return false
				}
				
				// 直接计算坐标，立即更新
				const x = touch.clientX - canvasRect.left
				const y = touch.clientY - canvasRect.top
				this.updateDragPosition(x, y, touch)
				
				return false
			},
			
			// 更新拖拽位置（节流绘制）
			updateDragPosition(x, y, touch) {
				// 立即更新坐标，保证流畅
				this.dragState.currentX = x
				this.dragState.currentY = y
				
				// 节流绘制，避免频繁绘制导致卡顿
				if (this.dragState.drawTimer) {
					clearTimeout(this.dragState.drawTimer)
				}
				
				// 异步检查删除区域和位置，不阻塞坐标更新
				this.dragState.drawTimer = setTimeout(() => {
					const query = uni.createSelectorQuery().in(this)
					query.select('.delete-zone').boundingClientRect((deleteRect) => {
						// 检查是否在删除区域
						if (deleteRect) {
							const isInDeleteZone = touch.clientY >= deleteRect.top && 
								touch.clientY <= deleteRect.bottom &&
								touch.clientX >= deleteRect.left && 
								touch.clientX <= deleteRect.right
							this.dragState.isOverDeleteZone = isInDeleteZone
						} else {
							this.dragState.isOverDeleteZone = false
						}
						
						// 检查是否在预览区域内，找到最近的珠子
						if (this.isInPreviewArea(x, y)) {
							const nearestIndex = this.findNearestBead(x, y, this.dragState.dragItemIndex)
							this.dragState.nearestBeadIndex = nearestIndex
						} else {
							this.dragState.nearestBeadIndex = -1
						}
						
						// 重新绘制（显示拖拽动画效果）
						this.drawBracelet()
					}).exec()
				}, 16) // 约 60fps
			},
			
			// Canvas 触摸结束
			handleCanvasTouchEnd(e) {
				// 阻止事件冒泡
				e.stopPropagation()
				
				// 清除长按定时器
				if (this.dragState.longPressTimer) {
					clearTimeout(this.dragState.longPressTimer)
					this.dragState.longPressTimer = null
				}
				
				if (!this.dragState.isDragging) return
				
				// 如果在删除区域，删除项目
				if (this.dragState.isOverDeleteZone) {
					this.removeItem(this.dragState.dragItemId)
					this.endDrag()
					return
				}
				
				// 如果有最近的珠子（显示虚线），直接换位置
				if (this.dragState.nearestBeadIndex !== -1 && 
					this.dragState.nearestBeadIndex !== this.dragState.dragItemIndex) {
					this.swapItems(this.dragState.dragItemIndex, this.dragState.nearestBeadIndex)
				}
				
				this.endDrag()
			},
			
			// 开始拖拽
			startDrag(itemIndex, x, y) {
				if (itemIndex < 0 || itemIndex >= this.items.length) return
				
				// canvas 位置已经在 touchstart 时缓存，这里直接使用
				// 如果缓存不存在，立即获取一次
				if (!this.dragState.canvasRect) {
					const query = uni.createSelectorQuery().in(this)
					query.select('.canvas-container').boundingClientRect((rect) => {
						if (rect) {
							this.dragState.canvasRect = rect
						}
					}).exec()
				}
				
				this.dragState.isDragging = true
				this.dragState.dragItemId = this.items[itemIndex].id
				this.dragState.dragItemIndex = itemIndex
				this.dragState.startX = x
				this.dragState.startY = y
				this.dragState.currentX = x
				this.dragState.currentY = y
				this.dragState.isOverDeleteZone = false
				
				// 禁用页面滚动
				this.disableScroll()
				
				// 重新绘制，显示选中效果
				this.drawBracelet()
			},
			
			// 结束拖拽
			endDrag() {
				// 清除绘制定时器
				if (this.dragState.drawTimer) {
					clearTimeout(this.dragState.drawTimer)
					this.dragState.drawTimer = null
				}
				
				this.dragState.isDragging = false
				this.dragState.dragItemId = null
				this.dragState.dragItemIndex = -1
				this.dragState.isOverDeleteZone = false
				this.dragState.nearestBeadIndex = -1
				this.dragState.canvasRect = null
				
				// 启用页面滚动
				this.enableScroll()
				
				// 重新绘制
				this.drawBracelet()
			},
			
			// 禁用滚动
			disableScroll() {
				// 禁用页面滚动
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 0
				})
			},
			
			// 启用滚动
			enableScroll() {
				// 滚动功能由 scroll-view 控制，这里不需要额外操作
			},
			
			// 查找指定位置的珠子索引
			findItemAtPosition(x, y) {
				const centerX = this.centerX
				const centerY = this.centerY
				
				for (let i = 0; i < this.items.length; i++) {
					const itemX = this.getItemX(i)
					const itemY = this.getItemY(i)
					const radius = this.getBeadRadius(this.items[i].diameter)
					
					const distance = Math.sqrt(Math.pow(x - itemX, 2) + Math.pow(y - itemY, 2))
					if (distance <= radius + 5) { // 5px 的容差
						return i
					}
				}
				return -1
			},
			
			// 查找距离指定位置最近的珠子索引
			findNearestBead(x, y, excludeIndex) {
				let nearestIndex = -1
				let minDistance = Infinity
				
				for (let i = 0; i < this.items.length; i++) {
					// 排除被拖拽的珠子
					if (i === excludeIndex) continue
					
					const itemX = this.getItemX(i)
					const itemY = this.getItemY(i)
					const radius = this.getBeadRadius(this.items[i].diameter)
					
					// 计算到珠子边缘的距离
					const distance = Math.sqrt(Math.pow(x - itemX, 2) + Math.pow(y - itemY, 2)) - radius
					
					// 增大距离阈值，让换位置更容易触发（从50px改为80px）
					if (distance < minDistance && distance < 80) {
						minDistance = distance
						nearestIndex = i
					}
				}
				
				return nearestIndex
			},
			
			// 检查是否在预览区域内
			isInPreviewArea(x, y) {
				const size = this.previewSize
				return x >= 0 && x <= size && y >= 0 && y <= size
			},
			
			// 交换两个项目的位置
			swapItems(index1, index2) {
				if (index1 < 0 || index1 >= this.items.length || 
					index2 < 0 || index2 >= this.items.length ||
					index1 === index2) {
					return
				}
				
				// 移除震动反馈，避免屏幕抖动
				// uni.vibrateShort()
				
				// 交换位置
				const temp = this.items[index1]
				this.$set(this.items, index1, this.items[index2])
				this.$set(this.items, index2, temp)
				
				// 重新绘制，显示新位置
				this.$nextTick(() => {
					this.drawBracelet()
				})
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
						uni.navigateTo({
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
			},
			
			// 完成并前往收银台
			async completeAndGoToCashier() {
				if (this.processingOrder) return
				if (!this.items.length) {
					uni.showToast({
						title: '请先设计手串再完成～',
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
				
				this.processingOrder = true
				try {
					// 先保存设计，确保有设计ID
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
					
					// 跳转到收银台页面，携带设计信息
					const payload = encodeURIComponent(JSON.stringify({
						designId: this.currentDesignId,
						name: trimmed,
						totalPrice: this.totalPrice
					}))
					
					uni.navigateTo({
						url: `/pages/cashier/cashier?data=${payload}`
					})
				} catch (err) {
					uni.showToast({
						title: err.message || '处理失败，请稍后重试',
						icon: 'none'
					})
				} finally {
					this.processingOrder = false
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 40%, #f3e8ff 100%);
		padding: 24rpx;
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
		height: 100vh;
		overflow: hidden;
	}
	
	.preview-panel-fixed {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 32rpx;
		padding: 20rpx 24rpx 24rpx 24rpx;
		box-shadow: 0 12rpx 40rpx rgba(31, 41, 55, 0.18);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		position: relative;
		z-index: 10;
	}
	
	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx; /* 减小下边距 */
		padding-bottom: 16rpx;
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
		border-radius: 0 0 24rpx 24rpx;
		padding: 30rpx;
		overflow-y: auto;
		height: 0; /* 配合 flex: 1 使用 */
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
		gap: 12rpx; /* 减小间距 */
	}
	
	.category-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 16rpx; /* 减小内边距 */
		border: 3rpx solid #e5e7eb;
		border-radius: 12rpx;
		transition: all 0.3s;
	}
	
	.category-item:active {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	
	.category-image {
		width: 100rpx; /* 减小尺寸 */
		height: 100rpx;
		border-radius: 50%;
		margin-bottom: 12rpx;
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
		grid-template-columns: repeat(3, 1fr); /* 改为3列，显示更多 */
		gap: 12rpx; /* 减小间距 */
	}
	
	.product-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16rpx; /* 减小内边距 */
		border: 3rpx solid #e5e7eb;
		border-radius: 12rpx;
		transition: all 0.3s;
	}
	
	.product-item:active {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	
	.product-image {
		width: 120rpx; /* 减小尺寸 */
		height: 120rpx;
		border-radius: 12rpx;
		margin-bottom: 12rpx;
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
	
	.preview-content-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 20rpx;
		margin-bottom: 20rpx;
	}
	
	.bracelet-preview-container {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
	}
	
	.preview-svg-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.preview-tip {
		width: 100%;
		padding: 16rpx;
		border-radius: 12rpx;
		margin-bottom: 16rpx;
		font-size: 22rpx;
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
		width: 500rpx;
		height: 500rpx;
		display: flex;
		align-items: center;
		justify-content: center;
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
	
	.delete-zone {
		margin: 20rpx 0;
		padding: 30rpx;
		background: #f9fafb;
		border: 2rpx dashed #d1d5db;
		border-radius: 16rpx;
		text-align: center;
		transition: all 0.3s;
		transform: scale(1);
	}
	
	.delete-zone-active {
		background: #fef2f2;
		border-color: #dc2626;
		border-style: solid;
		border-width: 3rpx;
		transform: scale(1.05);
		animation: deletePulse 1s ease-in-out infinite;
	}
	
	@keyframes deletePulse {
		0%, 100% {
			transform: scale(1.05);
		}
		50% {
			transform: scale(1.08);
		}
	}
	
	.delete-zone-text {
		font-size: 26rpx;
		color: #6b7280;
		transition: all 0.3s;
	}
	
	.delete-zone-active .delete-zone-text {
		color: #dc2626;
		font-weight: 600;
		font-size: 28rpx;
	}
	
	.preview-footer {
		border-top: 2rpx solid #f3f4f6;
		padding-top: 24rpx;
	}
	
	.empty-preview {
		text-align: center;
		padding: 60rpx 0;
		font-size: 22rpx;
		color: #6b7280;
		width: 400rpx;
		height: 400rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.info-section-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: 16rpx;
		padding: 16rpx;
		background: #f9fafb;
		border-radius: 16rpx;
		min-height: 400rpx;
	}
	
	.price-section-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 24rpx;
		padding: 20rpx;
		background: #f9fafb;
		border-radius: 16rpx;
		min-height: 500rpx;
	}
	
	/* 材料选择区域 */
	.material-panel {
		flex: 1;
		height: 66.67vh; /* 占屏幕三分之二高度 */
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 24rpx;
		overflow: hidden;
	}
	
	/* 主tab */
	.main-tabs {
		display: flex;
		border-bottom: 2rpx solid #e5e7eb;
		background: #ffffff;
	}
	
	.main-tab-item {
		flex: 1;
		padding: 24rpx 0;
		text-align: center;
		font-size: 28rpx;
		color: #6b7280;
		position: relative;
		transition: all 0.3s;
	}
	
	.main-tab-item.active {
		color: #3b82f6;
		font-weight: 600;
	}
	
	.main-tab-item.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: #3b82f6;
	}
	
	/* 材料内容区域 */
	.material-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.material-tab-content {
		flex: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}
	
	/* 子tab（左侧） */
	.sub-tabs {
		width: 200rpx;
		background: #f9fafb;
		border-right: 2rpx solid #e5e7eb;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}
	
	.sub-tab-item {
		padding: 32rpx 24rpx;
		font-size: 26rpx;
		color: #6b7280;
		text-align: center;
		border-bottom: 1rpx solid #e5e7eb;
		transition: all 0.3s;
	}
	
	.sub-tab-item.active {
		background: #ffffff;
		color: #3b82f6;
		font-weight: 600;
		border-right: 4rpx solid #3b82f6;
	}
	
	/* 商品列表（右侧） */
	.product-list {
		flex: 1;
		padding: 20rpx;
		overflow-y: auto;
	}
	
	.product-list-full {
		flex: 1;
		padding: 20rpx;
		overflow-y: auto;
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
		align-items: flex-start;
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
		margin-top: 60rpx;
		margin-bottom: 40rpx;
		padding-top: 40rpx;
		border-top: 2rpx solid #f3f4f6;
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
	
	/* 紧凑版保存区域 */
	.save-section-compact {
		padding: 20rpx;
		border-top: 2rpx solid #e5e7eb;
		background: #ffffff;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 16rpx;
	}
	
	.save-form-item {
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}
	
	.save-label {
		font-size: 24rpx;
		color: #6b7280;
		white-space: nowrap;
	}
	
	.save-input {
		flex: 1;
		height: 64rpx;
		padding: 0 16rpx;
		background: #f9fafb;
		border: 2rpx solid #e5e7eb;
		border-radius: 8rpx;
		font-size: 24rpx;
		color: #1f2937;
	}
	
	.save-btn-compact {
		flex: 0 0 120rpx;
		height: 64rpx;
		background: linear-gradient(135deg, #8b5cf6, #ec4899);
		color: #ffffff;
		font-size: 24rpx;
		font-weight: 600;
		border-radius: 8rpx;
		border: none;
		white-space: nowrap;
	}
	
	.save-btn-compact[disabled] {
		opacity: 0.5;
	}
</style>
