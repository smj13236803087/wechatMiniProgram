<template>
	<view class="cashier-container">
		<view class="header">
			<text class="title">收银台</text>
		</view>
		
		<view class="content">
			<!-- 预览区域：使用与作品集相同的圆形手串预览样式（canvas） -->
			<view class="preview-card">
				<text class="section-title">作品预览</text>
				<view v-if="designItems.length === 0" class="empty-preview">
					<text>未获取到作品数据</text>
				</view>
				<view v-else class="preview-section">
					<canvas 
						canvas-id="cashier-preview"
						class="preview-canvas"
					></canvas>
				</view>
			</view>
			
			<!-- 商品明细 -->
			<view class="detail-card">
				<view class="detail-header">
					<text class="section-title">商品明细</text>
					<text class="section-subtitle">{{ designName }}</text>
				</view>
				<view class="detail-row">
					<text class="label">手围</text>
					<text class="value">{{ wristSize }}cm（{{ wearingStyleLabel }}）</text>
				</view>
				<view class="detail-row">
					<text class="label">件数</text>
					<text class="value">{{ designItems.length }}</text>
				</view>
				<view class="detail-row">
					<text class="label">总价</text>
					<text class="price">¥{{ totalPrice }}</text>
				</view>
				
				<view class="items-list" v-if="designItems.length">
					<view
						v-for="(item, index) in designItems"
						:key="item.id || index"
						class="item-row"
					>
						<view class="item-left">
							<image
								v-if="item.image"
								:src="item.image"
								class="item-image"
								mode="aspectFill"
							/>
							<view v-else class="item-image placeholder"></view>
							<view class="item-info">
								<text class="item-name">{{ item.name }}</text>
								<text class="item-sub" v-if="item.beadCategory">{{ item.beadCategory }}</text>
								<text class="item-sub" v-else-if="item.accessoryCategory">{{ item.accessoryCategory }}</text>
								<text class="item-sub" v-else-if="item.pendantType">吊坠</text>
							</view>
						</view>
						<view class="item-right">
							<text class="item-price">¥{{ item.price || 0 }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 底部操作条 -->
		<view class="footer">
			<view class="footer-left">
				<text class="footer-label">合计</text>
				<text class="footer-price">¥{{ totalPrice }}</text>
			</view>
			<button
				class="cart-btn"
				:disabled="submitting"
				@click="handleAddToCart"
			>
				{{ submitting ? '处理中...' : '加入购物车' }}
			</button>
		</view>
	</view>
</template>

<script>
import { designAPI, cartAPI } from '@/utils/api.js'

export default {
	data() {
		return {
			designId: null,
			designName: '',
			totalPrice: 0,
			wristSize: null,
			wearingStyle: '',
			designItems: [],
			design: null,
			submitting: false
		}
	},
	computed: {
		wearingStyleLabel() {
			if (this.wearingStyle === 'double') return '双圈'
			return '单圈'
		}
	},
	watch: {
		designItems: {
			handler(newVal) {
				if (newVal && newVal.length > 0) {
					this.$nextTick(() => {
						this.drawPreview()
					})
				}
			},
			deep: true
		}
	},
	onLoad(options) {
		// 从工作台传过来的 data（包含 designId、name、totalPrice）
		if (options && options.data) {
			try {
				const payload = JSON.parse(decodeURIComponent(options.data))
				if (payload.designId) {
					this.designId = payload.designId
					this.designName = payload.name || ''
					this.totalPrice = payload.totalPrice || 0
					this.fetchDesignDetail()
				}
			} catch (e) {
				console.error('解析收银台参数失败', e)
			}
		}
	},
	methods: {
		async fetchDesignDetail() {
			if (!this.designId) return
			try {
				const res = await designAPI.getDesign(this.designId)
				const design = res.design
				if (design) {
					this.design = design
					this.designItems = design.items || []
					this.wristSize = design.wristSize || null
					this.wearingStyle = design.wearingStyle || 'single'
					if (!this.designName) {
						this.designName = design.name || ''
					}
					if (!this.totalPrice) {
						this.totalPrice = design.totalPrice || 0
					}
				}
			} catch (err) {
				console.error('获取设计详情失败：', err)
				uni.showToast({
					title: '获取作品详情失败',
					icon: 'none'
				})
			}
		},
		
		// 使用与作品集相同的方式绘制圆形手串预览（保证珠子不被裁剪）
		drawPreview() {
			const items = this.designItems || []
			if (!items.length) return
			
			const ctx = uni.createCanvasContext('cashier-preview', this)
			
			// 计算画布尺寸（参考作品集：320rpx）
			const systemInfo = uni.getSystemInfoSync()
			const screenWidth = systemInfo.screenWidth
			const size = (320 / 750) * screenWidth
			const centerX = size / 2
			const centerY = size / 2
			
			// 清空画布
			ctx.clearRect(0, 0, size, size)
			
			// 基础珠子半径
			const baseBeadRadius = 10
			const margin = 4
			const maxRadius = size / 2 - baseBeadRadius - margin
			if (maxRadius <= 0) {
				ctx.draw()
				return
			}
			
			const minCircumference = items.length * baseBeadRadius * 2
			const minRadius = minCircumference / (2 * Math.PI)
			
			let beadRadius = baseBeadRadius
			let radius
			
			if (minRadius <= maxRadius) {
				radius = Math.max(minRadius + beadRadius * 0.5, size * 0.25)
				radius = Math.min(radius, maxRadius)
			} else {
				const scale = maxRadius / minRadius
				beadRadius = baseBeadRadius * scale
				radius = maxRadius
			}
			
			// 绘制圆形虚线路径
			ctx.beginPath()
			ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
			ctx.setStrokeStyle('#e5e7eb')
			ctx.setLineWidth(2)
			ctx.setLineDash([5, 5], 0)
			ctx.stroke()
			ctx.setLineDash([], 0)
			
			// 均匀分布角度
			const totalAngle = 2 * Math.PI
			const angleStep = totalAngle / items.length
			
			items.forEach((item, index) => {
				const angle = index * angleStep
				const x = centerX + radius * Math.cos(angle)
				const y = centerY + radius * Math.sin(angle)
				const color = item.color || '#8b4513'
				
				ctx.beginPath()
				ctx.arc(x, y, beadRadius, 0, 2 * Math.PI)
				ctx.setFillStyle(color)
				ctx.fill()
				
				ctx.setStrokeStyle('#ffffff')
				ctx.setLineWidth(1.5)
				ctx.stroke()
			})
			
			ctx.draw()
		},
		
		handleAddToCart() {
			if (!this.designId) {
				uni.showToast({
					title: '暂未获取到作品信息',
					icon: 'none'
				})
				return
			}
			
			uni.showModal({
				title: '加入购物车',
				content: '是否将当前作品加入购物车？',
				confirmText: '确认',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						this.addToCart()
					}
				}
			})
		},
		
		async addToCart() {
			if (this.submitting) return
			this.submitting = true
			try {
				const payload = {
					name: this.designName,
					design: this.design || {
						id: this.designId,
						name: this.designName,
						items: this.designItems,
						wristSize: this.wristSize,
						wearingStyle: this.wearingStyle
					},
					totalPrice: this.totalPrice
				}
				await cartAPI.addItem(payload)
				uni.showToast({
					title: '已加入购物车',
					icon: 'success'
				})
				
				// 加入成功后跳转到购物车（tabBar 页面）
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/cart/cart'
					})
				}, 300)
			} catch (err) {
				console.error('加入购物车失败：', err)
				uni.showToast({
					title: err.message || '加入购物车失败',
					icon: 'none'
				})
			} finally {
				this.submitting = false
			}
		}
	}
}
</script>

<style scoped>
.cashier-container {
	min-height: 100vh;
	background: #f3f4f6;
	display: flex;
	flex-direction: column;
}

.header {
	padding: 24rpx 32rpx;
	background: #ffffff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.title {
	font-size: 36rpx;
	font-weight: 600;
	color: #111827;
}

.content {
	flex: 1;
	padding: 24rpx 24rpx 120rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.preview-card,
.detail-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #111827;
}

.section-subtitle {
	font-size: 24rpx;
	color: #6b7280;
	margin-top: 8rpx;
}

.empty-preview {
	margin-top: 40rpx;
	padding: 40rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: #9ca3af;
}

.preview-scroll {
	margin-top: 24rpx;
	white-space: nowrap;
}

.beads-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12rpx;
}

.bead-preview {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	overflow: hidden;
	background: #f3f4f6;
}

.bead-image {
	width: 100%;
	height: 100%;
}

.bead-placeholder {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: #e5e7eb;
}

.detail-header {
	margin-bottom: 16rpx;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1rpx solid #f3f4f6;
}

.detail-row:last-child {
	border-bottom-width: 0;
}

.label {
	font-size: 26rpx;
	color: #6b7280;
}

.value {
	font-size: 26rpx;
	color: #111827;
}

.price {
	font-size: 30rpx;
	font-weight: 600;
	color: #ef4444;
}

.items-list {
	margin-top: 24rpx;
	border-top: 1rpx solid #f3f4f6;
}

.item-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f3f4f6;
}

.item-left {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.item-image {
	width: 80rpx;
	height: 80rpx;
	border-radius: 12rpx;
	background: #f3f4f6;
}

.item-image.placeholder {
	background: #e5e7eb;
}

.item-info {
	display: flex;
	flex-direction: column;
}

.item-name {
	font-size: 26rpx;
	color: #111827;
}

.item-sub {
	font-size: 22rpx;
	color: #6b7280;
	margin-top: 4rpx;
}

.item-right {
	min-width: 120rpx;
	text-align: right;
}

.item-price {
	font-size: 26rpx;
	color: #111827;
}

.footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 16rpx 24rpx 24rpx;
	background: #ffffff;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.footer-left {
	display: flex;
	flex-direction: column;
}

.footer-label {
	font-size: 24rpx;
	color: #6b7280;
}

.footer-price {
	margin-top: 4rpx;
	font-size: 32rpx;
	font-weight: 600;
	color: #ef4444;
}

.cart-btn {
	flex: 0 0 220rpx;
	height: 80rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #3b82f6, #8b5cf6);
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
	border: none;
}

.cart-btn[disabled] {
	opacity: 0.6;
}
</style>

