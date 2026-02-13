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
			<!-- 左侧：配置面板 -->
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
			
			<!-- 右侧：预览和操作 -->
			<view class="preview-panel">
				<view class="preview-section">
					<view class="preview-title">手串预览</view>
					<scroll-view class="items-list" scroll-y>
						<view v-if="items.length === 0" class="empty-preview">
							<text>暂无项目，请从左侧选择添加</text>
						</view>
						<view v-else>
							<view 
								v-for="(item, index) in items" 
								:key="item.id"
								class="item-card"
							>
								<view class="item-info">
									<text class="item-index">{{ index + 1 }}</text>
									<text class="item-name">{{ item.name }}</text>
									<text class="item-price">¥{{ item.price }}</text>
								</view>
								<view class="item-actions">
									<button class="delete-btn" @click="removeItem(item.id)">删除</button>
								</view>
							</view>
						</view>
					</scroll-view>
				</view>
				
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
				showWristSizeModal: true,
				wristSize: null,
				wristSizeInput: '',
				wearingStyle: null,
				designName: '',
				currentDesignId: null,
				saving: false,
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
			}
		},
		onLoad(options) {
			if (options.designId) {
				this.loadDesign(options.designId)
			}
			this.fetchProducts()
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
						this.wristSize = design.wristSize
						this.wristSizeInput = design.wristSize ? String(design.wristSize) : ''
						this.wearingStyle = design.wearingStyle
						this.showWristSizeModal = !design.wristSize || !design.wearingStyle
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
				// 如果已经有手围设置，允许关闭
				if (this.wristSize && this.wearingStyle) {
					this.showWristSizeModal = false
				}
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
		padding: 30rpx;
	}
	
	.title {
		font-size: 56rpx;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 30rpx;
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
		gap: 30rpx;
		height: calc(100vh - 200rpx);
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
	
	.preview-panel {
		width: 400rpx;
		display: flex;
		flex-direction: column;
		gap: 30rpx;
	}
	
	.preview-section {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.preview-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 24rpx;
	}
	
	.items-list {
		flex: 1;
		max-height: 600rpx;
	}
	
	.empty-preview {
		text-align: center;
		padding: 60rpx 0;
		font-size: 26rpx;
		color: #6b7280;
	}
	
	.item-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx;
		background: #f9fafb;
		border-radius: 16rpx;
		margin-bottom: 16rpx;
	}
	
	.item-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 16rpx;
	}
	
	.item-index {
		width: 48rpx;
		height: 48rpx;
		background: #3b82f6;
		color: #ffffff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		font-weight: 600;
		flex-shrink: 0;
	}
	
	.item-name {
		flex: 1;
		font-size: 28rpx;
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.item-price {
		font-size: 28rpx;
		font-weight: 600;
		color: #3b82f6;
		margin-left: 16rpx;
	}
	
	.delete-btn {
		padding: 12rpx 24rpx;
		background: #fef2f2;
		color: #dc2626;
		border-radius: 12rpx;
		font-size: 24rpx;
		border: none;
	}
	
	.price-section {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}
	
	.price-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}
	
	.price-info:last-child {
		margin-bottom: 0;
	}
	
	.price-label {
		font-size: 28rpx;
		color: #6b7280;
	}
	
	.price-value {
		font-size: 32rpx;
		font-weight: bold;
		color: #3b82f6;
	}
	
	.save-section {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
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
		margin-top: 24rpx;
	}
	
	.save-btn[disabled] {
		opacity: 0.5;
	}
</style>
