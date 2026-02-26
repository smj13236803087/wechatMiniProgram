<template>
	<view class="container">
		<view v-if="loading" class="loading">
			<text>正在加载作品集...</text>
		</view>
		
		<view v-else-if="designs.length === 0" class="empty">
			<view class="empty-card">
				<text class="empty-text">你还没有保存任何作品。</text>
				<button class="empty-btn" @click="goToWorkspace">
					<text class="btn-icon">➕</text>
					<text>前往工作台开始设计</text>
				</button>
			</view>
		</view>
		
		<scroll-view v-else class="designs-scroll" scroll-y>
			<view class="designs-list">
				<view 
					v-for="design in designs" 
					:key="design.id"
					class="design-card"
					@click="editDesign(design.id)"
				>
					<view class="preview-section">
						<canvas 
							:canvas-id="'preview-' + design.id"
							class="preview-canvas"
						></canvas>
					</view>
					<view class="info-section">
						<view class="design-name">{{ design.name }}</view>
						<view class="design-meta">
							<text class="design-count">{{ design.items?.length || 0 }} 件</text>
							<text class="design-price">¥{{ design.totalPrice }}</text>
						</view>
					</view>
					<view class="actions-bar">
						<button 
							class="action-btn edit-btn" 
							@click.stop="editDesign(design.id)"
						>
							<text>✏️</text>
							<text>编辑</text>
						</button>
						<button 
							class="action-btn delete-btn" 
							@click.stop="deleteDesign(design.id)"
							:disabled="deletingId === design.id"
						>
							<text>🗑️</text>
							<text>{{ deletingId === design.id ? '删除中' : '删除' }}</text>
						</button>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { designAPI } from '@/utils/api.js'
	
	export default {
		data() {
			return {
				designs: [],
				loading: true,
				deletingId: null
			}
		},
		onLoad() {
			this.fetchDesigns()
		},
		onShow() {
			this.fetchDesigns()
		},
		watch: {
			designs: {
				handler() {
					this.$nextTick(() => {
						this.drawAllPreviews()
					})
				},
				deep: true
			}
		},
		methods: {
			async fetchDesigns() {
				this.loading = true
				try {
					const res = await designAPI.getDesigns()
					this.designs = res.designs || []
					this.$nextTick(() => {
						this.drawAllPreviews()
					})
				} catch (err) {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
					console.error(err)
				} finally {
					this.loading = false
				}
			},
			
			// 绘制所有预览图
			drawAllPreviews() {
				this.designs.forEach(design => {
					if (design.items && design.items.length > 0) {
						this.drawPreview(design)
					}
				})
			},
			
			// 绘制单个预览图（确保所有珠子完整展示）
			drawPreview(design) {
				const canvasId = 'preview-' + design.id
				const ctx = uni.createCanvasContext(canvasId, this)
				
				// 获取系统信息，计算实际像素值（预览区域 rpx 对应的像素）
				const systemInfo = uni.getSystemInfoSync()
				const screenWidth = systemInfo.screenWidth
				// 将预览整体缩小为 260rpx，减小卡片高度
				const size = (260 / 750) * screenWidth
				const centerX = size / 2
				const centerY = size / 2
				
				// 清空画布
				ctx.clearRect(0, 0, size, size)
				
				// 计算珠子位置
				const items = design.items || []
				if (items.length === 0) {
					ctx.draw()
					return
				}
				
				// 基础珠子半径
				const baseBeadRadius = 10
				const margin = 4
				// 允许的最大圆半径（保证珠子不会被裁剪）
				const maxRadius = size / 2 - baseBeadRadius - margin
				if (maxRadius <= 0) {
					ctx.draw()
					return
				}
				
				// 根据珠子数量计算最小需要的圆半径（周长 = 珠子数量 * 珠子直径）
				const minCircumference = items.length * baseBeadRadius * 2
				const minRadius = minCircumference / (2 * Math.PI)
				
				let beadRadius = baseBeadRadius
				let radius
				
				if (minRadius <= maxRadius) {
					// 正常情况：优先保证不重叠，同时不超过最大半径
					radius = Math.max(minRadius + beadRadius * 0.5, size * 0.25)
					radius = Math.min(radius, maxRadius)
				} else {
					// 珠子太多，按比例缩小珠子和圆半径，保证全部在画布内
					const scale = maxRadius / minRadius
					beadRadius = baseBeadRadius * scale
					radius = maxRadius
				}
				
				// 绘制圆形路径（虚线）
				ctx.beginPath()
				ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
				ctx.setStrokeStyle('#e5e7eb')
				ctx.setLineWidth(2)
				ctx.setLineDash([5, 5], 0)
				ctx.stroke()
				ctx.setLineDash([], 0)
				
				// 计算每个珠子的角度（均匀分布）
				const totalAngle = 2 * Math.PI
				const angleStep = totalAngle / items.length
				
				// 绘制每个珠子
				items.forEach((item, index) => {
					const angle = index * angleStep
					const x = centerX + radius * Math.cos(angle)
					const y = centerY + radius * Math.sin(angle)
					const color = item.color || '#8b4513'
					
					// 绘制珠子
					ctx.beginPath()
					ctx.arc(x, y, beadRadius, 0, 2 * Math.PI)
					ctx.setFillStyle(color)
					ctx.fill()
					
					// 绘制白色边框
					ctx.setStrokeStyle('#ffffff')
					ctx.setLineWidth(1.5)
					ctx.stroke()
				})
				
				ctx.draw()
			},
			
			editDesign(id) {
				uni.navigateTo({
					url: `/pages/workspace/workspace?designId=${id}`
				})
			},
			
			async deleteDesign(id) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个作品吗？此操作不可恢复。',
					success: async (res) => {
						if (res.confirm) {
							this.deletingId = id
							try {
								await designAPI.deleteDesign(id)
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								this.designs = this.designs.filter(d => d.id !== id)
							} catch (err) {
								uni.showToast({
									title: err.message || '删除失败',
									icon: 'none'
								})
							} finally {
								this.deletingId = null
							}
						}
					}
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
		background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%);
		padding: 40rpx;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 40rpx;
		flex-wrap: wrap;
		gap: 24rpx;
	}
	
	.title-section {
		flex: 1;
		min-width: 300rpx;
	}
	
	.title {
		font-size: 56rpx;
		font-weight: bold;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-bottom: 12rpx;
	}
	
	.subtitle {
		font-size: 26rpx;
		color: #6b7280;
	}
	
	.new-btn {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: #ffffff;
		padding: 20rpx 32rpx;
		border-radius: 16rpx;
		font-size: 28rpx;
		font-weight: 600;
		border: none;
		display: flex;
		align-items: center;
		gap: 8rpx;
		box-shadow: 0 8rpx 20rpx rgba(59, 130, 246, 0.3);
	}
	
	.btn-icon {
		font-size: 32rpx;
	}
	
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 40vh;
		font-size: 28rpx;
		color: #6b7280;
	}
	
	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 40vh;
	}
	
	.empty-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 24rpx;
		padding: 80rpx 60rpx;
		text-align: center;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #6b7280;
		margin-bottom: 40rpx;
		display: block;
	}
	
	.empty-btn {
		background: #3b82f6;
		color: #ffffff;
		padding: 24rpx 48rpx;
		border-radius: 16rpx;
		font-size: 28rpx;
		font-weight: 600;
		border: none;
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.designs-scroll {
		height: calc(100vh - 200rpx);
	}
	
	.designs-list {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
		padding-bottom: 40rpx;
	}
	
	.design-card {
		background: rgba(255, 255, 255, 0.9);
		/* 微小圆角，让卡片更轻盈克制 */
		border-radius: 14rpx;
		overflow: hidden;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.design-card:active {
		transform: scale(0.98);
		box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
	}
	
	.preview-section {
		position: relative;
		width: 100%;
		height: 280rpx; /* 调低卡片高度，让整体更紧凑 */
		background: #f9fafb;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding: 16rpx;
	}
	
	.preview-canvas {
		width: 260rpx;
		height: 260rpx;
		max-width: 100%;
		max-height: 100%;
	}
	
	.info-section {
		padding: 24rpx 30rpx;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		border-bottom: 2rpx solid #e5e7eb;
	}
	
	.design-name {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.design-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.design-count {
		font-size: 24rpx;
		color: #6b7280;
	}
	
	.design-price {
		font-size: 32rpx;
		font-weight: bold;
		color: #3b82f6;
	}
	
	.actions-bar {
		padding: 16rpx 30rpx;
		display: flex;
		justify-content: flex-end;
		gap: 12rpx;
	}
	
	.action-btn {
		padding: 12rpx 24rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: 500;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
	}
	
	.edit-btn {
		background: #3b82f6;
		color: #ffffff;
	}
	
	.delete-btn {
		background: #fef2f2;
		color: #dc2626;
	}
	
	.delete-btn[disabled] {
		opacity: 0.5;
	}
</style>
