<template>
	<view class="checkout-container">
		<scroll-view class="content" scroll-y>
			<!-- 收货地址 -->
			<view class="address-card">
				<view class="card-title">收货地址</view>
				<view v-if="loadingAddress" class="loading-text">加载地址中...</view>
				<view v-else-if="!defaultAddress" class="empty-address" @click="goToAddresses">
					<text class="empty-text">请选择收货地址</text>
					<text class="empty-arrow">›</text>
				</view>
				<view v-else class="address-info" @click="goToAddresses">
					<view class="address-top">
						<text class="address-name">{{ defaultAddress.recipient }}</text>
						<text class="address-phone">{{ defaultAddress.phone }}</text>
					</view>
					<view class="address-bottom">
						<text class="address-full">
							{{ defaultAddress.country }} {{ defaultAddress.province }} {{ defaultAddress.city }} {{ defaultAddress.district }} {{ defaultAddress.detail }}
						</text>
					</view>
					<text class="address-arrow">›</text>
				</view>
			</view>
			
			<!-- 商品信息 -->
			<view class="goods-card">
				<view class="card-title">商品信息</view>
				<view v-for="(item, index) in orderItems" :key="item.id || index" class="goods-item">
					<view class="goods-preview">
						<canvas :canvas-id="'checkout-preview-' + item.id" class="preview-canvas"></canvas>
					</view>
					<view class="goods-info">
						<view class="goods-name">{{ item.name }}</view>
						<view class="goods-meta">
							<text class="goods-count">{{ (item.design?.items?.length || 0) }} 件</text>
							<text class="goods-qty">×{{ item.quantity }}</text>
						</view>
						<view class="goods-price">¥{{ item.totalPrice }}</view>
					</view>
				</view>
			</view>
			
			<!-- 订单信息 -->
			<view class="order-info-card">
				<view class="card-title">订单信息</view>
				<view class="info-row">
					<text class="info-label">商品件数</text>
					<text class="info-value">{{ totalQuantity }} 件</text>
				</view>
				<view class="info-row">
					<text class="info-label">商品总价</text>
					<text class="info-value">¥{{ totalPrice }}</text>
				</view>
			</view>
		</scroll-view>
		
		<!-- 底部操作条 -->
		<view class="footer">
			<view class="footer-left">
				<text class="footer-label">合计：</text>
				<text class="footer-price">¥{{ totalPrice }}</text>
			</view>
			<button
				class="submit-btn"
				:disabled="submitting || !defaultAddress"
				@click="handleSubmitOrder"
			>
				{{ submitting ? '提交中...' : '提交订单' }}
			</button>
		</view>
	</view>
</template>

<script>
import { addressAPI } from '@/utils/api.js'

export default {
	data() {
		return {
			orderItems: [],
			totalPrice: 0,
			defaultAddress: null,
			loadingAddress: true,
			submitting: false
		}
	},
	computed: {
		totalQuantity() {
			return this.orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
		}
	},
	onLoad(options) {
		if (options && options.data) {
			try {
				const payload = JSON.parse(decodeURIComponent(options.data))
				this.orderItems = payload.items || []
				this.totalPrice = payload.totalPrice || 0
				// 绘制商品预览图
				this.$nextTick(() => {
					this.drawAllPreviews()
				})
			} catch (e) {
				console.error('解析订单数据失败', e)
				uni.showToast({
					title: '订单数据错误',
					icon: 'none'
				})
			}
		}
		this.fetchDefaultAddress()
	},
	methods: {
		async fetchDefaultAddress() {
			this.loadingAddress = true
			try {
				const res = await addressAPI.getAddresses()
				const addresses = res.addresses || []
				// 查找默认地址
				this.defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null
			} catch (err) {
				console.error('获取地址失败：', err)
				uni.showToast({
					title: '获取地址失败',
					icon: 'none'
				})
			} finally {
				this.loadingAddress = false
			}
		},
		
		drawAllPreviews() {
			this.orderItems.forEach((item) => {
				const designItems = item.design?.items || []
				if (Array.isArray(designItems) && designItems.length > 0) {
					this.drawPreview(item.id, designItems)
				}
			})
		},
		
		// 绘制预览图（与购物车/作品集相同的算法）
		drawPreview(itemId, items) {
			const canvasId = 'checkout-preview-' + itemId
			const ctx = uni.createCanvasContext(canvasId, this)
			
			const systemInfo = uni.getSystemInfoSync()
			const screenWidth = systemInfo.screenWidth
			const size = (180 / 750) * screenWidth // 180rpx
			const centerX = size / 2
			const centerY = size / 2
			
			ctx.clearRect(0, 0, size, size)
			
			const baseBeadRadius = 8
			const margin = 6
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
		
		goToAddresses() {
			uni.navigateTo({
				url: '/pages/address/address'
			})
		},
		
		// 提交订单（预留，暂不实现）
		handleSubmitOrder() {
			if (!this.defaultAddress) {
				uni.showToast({
					title: '请先选择收货地址',
					icon: 'none'
				})
				return
			}
			if (this.submitting) return
			
			// 预留：提交订单逻辑待实现
			uni.showToast({
				title: '提交订单功能开发中',
				icon: 'none'
			})
		}
	}
}
</script>

<style scoped>
.checkout-container {
	min-height: 100vh;
	background: #f3f4f6;
	display: flex;
	flex-direction: column;
}

.content {
	flex: 1;
	padding: 24rpx 24rpx 140rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.address-card,
.goods-card,
.order-info-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx;
}

.card-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #111827;
	margin-bottom: 20rpx;
}

.loading-text {
	font-size: 26rpx;
	color: #6b7280;
	text-align: center;
	padding: 40rpx 0;
}

.empty-address {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx 0;
	border-top: 1rpx solid #f3f4f6;
}

.empty-text {
	font-size: 28rpx;
	color: #6b7280;
}

.empty-arrow {
	font-size: 40rpx;
	color: #d1d5db;
}

.address-info {
	position: relative;
	padding: 24rpx 0;
	border-top: 1rpx solid #f3f4f6;
}

.address-top {
	display: flex;
	align-items: center;
	gap: 24rpx;
	margin-bottom: 12rpx;
}

.address-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #111827;
}

.address-phone {
	font-size: 28rpx;
	color: #6b7280;
}

.address-bottom {
	margin-top: 8rpx;
}

.address-full {
	font-size: 26rpx;
	color: #6b7280;
	line-height: 1.6;
}

.address-arrow {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	font-size: 40rpx;
	color: #d1d5db;
}

.goods-item {
	display: flex;
	flex-direction: row;
	gap: 20rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f3f4f6;
}

.goods-item:last-child {
	border-bottom: none;
}

.goods-preview {
	width: 180rpx;
	height: 180rpx;
	background: #f9fafb;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	flex-shrink: 0;
}

.preview-canvas {
	width: 180rpx;
	height: 180rpx;
}

.goods-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.goods-name {
	font-size: 28rpx;
	font-weight: 500;
	color: #111827;
	margin-bottom: 12rpx;
}

.goods-meta {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 12rpx;
}

.goods-count {
	font-size: 24rpx;
	color: #6b7280;
}

.goods-qty {
	font-size: 24rpx;
	color: #6b7280;
}

.goods-price {
	font-size: 30rpx;
	font-weight: 600;
	color: #ef4444;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f3f4f6;
}

.info-row:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 26rpx;
	color: #6b7280;
}

.info-value {
	font-size: 26rpx;
	color: #111827;
	font-weight: 500;
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
	align-items: baseline;
	gap: 8rpx;
}

.footer-label {
	font-size: 24rpx;
	color: #6b7280;
}

.footer-price {
	font-size: 36rpx;
	font-weight: 700;
	color: #ef4444;
}

.submit-btn {
	flex: 0 0 200rpx;
	height: 80rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #10b981, #059669);
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
	border: none;
}

.submit-btn[disabled] {
	opacity: 0.6;
}
</style>
