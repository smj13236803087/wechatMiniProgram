<template>
	<view class="container">
		<view v-if="loading" class="state-card">
			<text class="state-text">正在加载购物车...</text>
		</view>
		
		<view v-else-if="error" class="state-card">
			<text class="state-text error">加载失败：{{ error }}</text>
			<button class="retry-btn" @click="fetchCart">重试</button>
		</view>
		
		<view v-else-if="items.length === 0" class="state-card">
			<text class="state-text">购物车是空的</text>
			<button class="retry-btn" @click="goToWorkspace">去工作台挑选</button>
		</view>
		
		<scroll-view v-else class="list-scroll" scroll-y>
			<view class="list">
				<view v-for="item in items" :key="item.id" class="card">
					<view class="card-top">
						<view class="check-area" @click="toggleItemChecked(item)">
							<view class="check-box" :class="{ checked: item.checked }">
								<text v-if="item.checked" class="check-icon">✔</text>
							</view>
						</view>
						<view class="preview">
							<canvas :canvas-id="'cart-preview-' + item.id" class="preview-canvas"></canvas>
						</view>
						<view class="info">
							<view class="name">{{ item.name || item.design?.name || '未命名作品' }}</view>
							<view class="meta">
								<text class="meta-text">{{ (item.design?.items?.length || 0) }} 件</text>
								<text class="meta-price">¥{{ item.totalPrice || 0 }}</text>
							</view>
							<view class="meta2">
								<text class="meta-text" v-if="item.design?.wristSize">手围 {{ item.design.wristSize }}cm</text>
								<text class="meta-text" v-if="item.design?.wearingStyle">
									{{ item.design.wearingStyle === 'double' ? '双圈' : '单圈' }}
								</text>
								<view class="quantity-wrapper">
									<text class="meta-text">数量</text>
									<view class="qty-control">
										<view class="qty-btn" @click.stop="decreaseQuantity(item)">-</view>
										<text class="qty-value">{{ item.quantity }}</text>
										<view class="qty-btn" @click.stop="increaseQuantity(item)">+</view>
									</view>
								</view>
							</view>
						</view>
					</view>
					
					<view class="actions">
						<button class="action-btn delete" :disabled="deletingId === item.id" @click="deleteItem(item.id)">
							{{ deletingId === item.id ? '删除中...' : '删除' }}
						</button>
					</view>
				</view>
			</view>
		</scroll-view>
		
		<view v-if="items.length" class="footer">
			<view class="footer-left" @click="toggleSelectAll">
				<view class="check-box small" :class="{ checked: allSelected }">
					<text v-if="allSelected" class="check-icon">✔</text>
				</view>
				<text class="footer-select-all">全选</text>
				<text class="footer-count">已选 {{ selectedCount }} 件</text>
			</view>
			
			<view class="footer-middle">
				<text class="footer-label">合计：</text>
				<text class="footer-price">¥{{ selectedTotalPrice }}</text>
			</view>
			
			<view class="footer-right">
				<button class="footer-btn secondary" @click="clearCart">清空</button>
				<button class="footer-btn secondary" @click="deleteSelected" :disabled="selectedIds.length === 0">删除</button>
				<button class="footer-btn primary" @click="goToCheckout" :disabled="selectedIds.length === 0">去结算</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { cartAPI } from '@/utils/api.js'
	
	export default {
		data() {
			return {
				loading: true,
				error: null,
				items: [],
				deletingId: null
			}
		},
		computed: {
			// 是否全选
			allSelected() {
				return this.items.length > 0 && this.items.every(i => i.checked)
			},
			// 已选条数
			selectedCount() {
				return this.items.filter(i => i.checked).length
			},
			// 已选条目的 id 列表
			selectedIds() {
				return this.items.filter(i => i.checked).map(i => i.id)
			},
			// 已选合计金额（数量 * 单价）
			selectedTotalPrice() {
				return this.items
					.filter(i => i.checked)
					.reduce((sum, item) => {
						const qty = item.quantity || 1
						const price = item.totalPrice || 0
						return sum + qty * price
					}, 0)
			}
		},
		onShow() {
			// tabBar 页面推荐用 onShow，每次进入都刷新
			this.fetchCart()
		},
		watch: {
			items: {
				handler() {
					this.$nextTick(() => {
						this.drawAllPreviews()
					})
				},
				deep: true
			}
		},
		methods: {
			async fetchCart() {
				this.loading = true
				this.error = null
				try {
					const res = await cartAPI.getCart()
					const rawItems = res.items || []
					// 为每个条目增加本地 UI 状态：是否选中、数量
					this.items = rawItems.map(item => ({
						...item,
						checked: false,
						quantity: 1
					}))
				} catch (err) {
					this.items = []
					this.error = err.message || '拉取购物车失败'
				} finally {
					this.loading = false
				}
			},
			
			drawAllPreviews() {
				this.items.forEach((cartItem) => {
					const designItems = cartItem.design?.items || []
					if (Array.isArray(designItems) && designItems.length > 0) {
						this.drawPreview(cartItem.id, designItems)
					}
				})
			},
			
			// 使用与作品集一致的 canvas 预览风格（保证珠子不被裁剪）
			drawPreview(cartItemId, items) {
				const canvasId = 'cart-preview-' + cartItemId
				const ctx = uni.createCanvasContext(canvasId, this)
				
				const systemInfo = uni.getSystemInfoSync()
				const screenWidth = systemInfo.screenWidth
				const size = (220 / 750) * screenWidth // 220rpx
				const centerX = size / 2
				const centerY = size / 2
				
				ctx.clearRect(0, 0, size, size)
				
				const baseBeadRadius = 8
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
					radius = Math.max(minRadius + beadRadius * 0.5, size * 0.28)
					radius = Math.min(radius, maxRadius)
				} else {
					const scale = maxRadius / minRadius
					beadRadius = baseBeadRadius * scale
					radius = maxRadius
				}
				
				ctx.beginPath()
				ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
				ctx.setStrokeStyle('#e5e7eb')
				ctx.setLineWidth(2)
				ctx.setLineDash([5, 5], 0)
				ctx.stroke()
				ctx.setLineDash([], 0)
				
				const angleStep = (2 * Math.PI) / items.length
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
			
			// 单条选中/取消
			toggleItemChecked(item) {
				item.checked = !item.checked
			},
			
			// 全选/反选
			toggleSelectAll() {
				const target = !this.allSelected
				this.items = this.items.map(i => ({
					...i,
					checked: target
				}))
			},
			
			// 数量增加
			increaseQuantity(item) {
				item.quantity = (item.quantity || 1) + 1
			},
			
			// 数量减少（最少为 1）
			decreaseQuantity(item) {
				const current = item.quantity || 1
				if (current <= 1) return
				item.quantity = current - 1
			},
			
			deleteItem(id) {
				uni.showModal({
					title: '确认删除',
					content: '确定要从购物车删除该作品吗？',
					success: async (res) => {
						if (!res.confirm) return
						this.deletingId = id
						try {
							await cartAPI.deleteItems([id])
							uni.showToast({
								title: '已删除',
								icon: 'success'
							})
							this.items = this.items.filter(i => i.id !== id)
						} catch (err) {
							uni.showToast({
								title: err.message || '删除失败',
								icon: 'none'
							})
						} finally {
							this.deletingId = null
						}
					}
				})
			},
			
			// 删除选中条目
			deleteSelected() {
				if (this.selectedIds.length === 0) return
				uni.showModal({
					title: '确认删除',
					content: `确定要删除选中的 ${this.selectedIds.length} 个作品吗？`,
					success: async (res) => {
						if (!res.confirm) return
						this.deletingId = 'batch'
						try {
							await cartAPI.deleteItems(this.selectedIds)
							uni.showToast({
								title: '已删除选中',
								icon: 'success'
							})
							this.items = this.items.filter(i => !this.selectedIds.includes(i.id))
						} catch (err) {
							uni.showToast({
								title: err.message || '删除失败',
								icon: 'none'
							})
						} finally {
							this.deletingId = null
						}
					}
				})
			},
			
			// 清空购物车
			clearCart() {
				if (!this.items.length) return
				uni.showModal({
					title: '清空购物车',
					content: '确定要清空购物车中所有作品吗？',
					success: async (res) => {
						if (!res.confirm) return
						this.deletingId = 'clear'
						try {
							// 不传 ids，后端会清空当前用户购物车
							await cartAPI.deleteItems()
							uni.showToast({
								title: '已清空',
								icon: 'success'
							})
							this.items = []
						} catch (err) {
							uni.showToast({
								title: err.message || '清空失败',
								icon: 'none'
							})
						} finally {
							this.deletingId = null
						}
					}
				})
			},
			
			// 去结算（占位，暂不实现具体逻辑）
			goToCheckout() {
				if (this.selectedIds.length === 0) {
					uni.showToast({
						title: '请先选择要结算的作品',
						icon: 'none'
					})
					return
				}
				// 先预留：当前只是给出提示，后续再接入真正的结算流程
				uni.showToast({
					title: '结算流程待实现',
					icon: 'none'
				})
			},
			
			goToWorkspace() {
				uni.navigateTo({
					url: '/pages/workspace/workspace'
				})
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: #f3f4f6;
		padding: 32rpx 24rpx 140rpx;
	}
	
	.header {
		margin-bottom: 24rpx;
	}
	
	.title {
		font-size: 48rpx;
		font-weight: 700;
		color: #111827;
	}
	
	.subtitle {
		margin-top: 8rpx;
		font-size: 26rpx;
		color: #6b7280;
	}
	
	.state-card {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 48rpx 32rpx;
		text-align: center;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.06);
	}
	
	.state-text {
		font-size: 28rpx;
		color: #6b7280;
		display: block;
	}
	
	.state-text.error {
		color: #dc2626;
	}
	
	.retry-btn {
		margin-top: 24rpx;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: #ffffff;
		font-size: 28rpx;
		font-weight: 600;
		border: none;
	}
	
	.list-scroll {
		height: calc(100vh - 220rpx);
	}
	
	.list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		padding-bottom: 24rpx;
	}
	
	.card {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.06);
	}
	
	.card-top {
		display: flex;
		flex-direction: row;
		gap: 16rpx;
	}

.check-area {
	width: 60rpx;
	align-items: center;
	justify-content: center;
	display: flex;
}

.check-box {
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	border: 2rpx solid #d1d5db;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #ffffff;
}

.check-box.checked {
	background: #3b82f6;
	border-color: #3b82f6;
}

.check-box.small {
	width: 32rpx;
	height: 32rpx;
}

.check-icon {
	font-size: 22rpx;
	color: #ffffff;
}
	
	.preview {
		width: 240rpx;
		height: 240rpx;
		background: #f9fafb;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	
	.preview-canvas {
		width: 220rpx;
		height: 220rpx;
	}
	
	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	
	.name {
		font-size: 30rpx;
		font-weight: 600;
		color: #111827;
	}
	
	.meta {
		margin-top: 12rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	
	.meta2 {
		margin-top: 10rpx;
		display: flex;
		flex-direction: row;
	gap: 12rpx;
	flex-wrap: wrap;
	align-items: center;
	}
	
	.meta-text {
		font-size: 24rpx;
		color: #6b7280;
	}
	
	.meta-price {
		font-size: 32rpx;
		font-weight: 700;
		color: #ef4444;
	}

.quantity-wrapper {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8rpx;
	margin-left: auto;
}

.qty-control {
	display: flex;
	flex-direction: row;
	align-items: center;
	background: #f3f4f6;
	border-radius: 999rpx;
	overflow: hidden;
}

.qty-btn {
	width: 40rpx;
	height: 40rpx;
	text-align: center;
	line-height: 40rpx;
	font-size: 26rpx;
	color: #4b5563;
}

.qty-value {
	min-width: 40rpx;
	text-align: center;
	font-size: 24rpx;
	color: #111827;
}
	
	.actions {
		margin-top: 16rpx;
		display: flex;
		justify-content: flex-end;
	}
	
	.action-btn {
		height: 72rpx;
		line-height: 72rpx;
		padding: 0 28rpx;
		border-radius: 999rpx;
		font-size: 26rpx;
		font-weight: 600;
		border: none;
	}
	
	.action-btn.delete {
		background: #fef2f2;
		color: #dc2626;
	}
	
	.action-btn[disabled] {
		opacity: 0.6;
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
	}
	
	.footer-left {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}
	
	.footer-select-all {
		font-size: 24rpx;
		color: #111827;
	}
	
	.footer-count {
		font-size: 22rpx;
		color: #6b7280;
	}
	
	.footer-middle {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		gap: 4rpx;
	}
	
	.footer-label {
		font-size: 24rpx;
		color: #6b7280;
	}
	
	.footer-price {
		font-size: 32rpx;
		font-weight: 700;
		color: #ef4444;
	}
	
	.footer-right {
		display: flex;
		flex-direction: row;
		gap: 8rpx;
	}
	
	.footer-btn {
		height: 64rpx;
		line-height: 64rpx;
		padding: 0 20rpx;
		border-radius: 999rpx;
		font-size: 24rpx;
		font-weight: 600;
		border: none;
	}
	
	.footer-btn.secondary {
		background: #f3f4f6;
		color: #374151;
	}
	
	.footer-btn.primary {
		background: linear-gradient(135deg, #10b981, #059669);
		color: #ffffff;
	}
	
	.footer-btn[disabled] {
		opacity: 0.6;
	}
</style>
