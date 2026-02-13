<template>
	<view class="container">
		<view class="header">
			<view class="title-section">
				<view class="title">我的作品集</view>
				<view class="subtitle">管理你设计好的手串作品，继续编辑或删除</view>
			</view>
			<button class="new-btn" @click="goToWorkspace">
				<text class="btn-icon">➕</text>
				<text>新建作品</text>
			</button>
		</view>
		
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
		
		<view v-else class="designs-grid">
			<view 
				v-for="design in designs" 
				:key="design.id"
				class="design-card"
			>
				<view class="preview-section" @click="viewDesign(design.id)">
					<view class="preview-placeholder">
						<text class="preview-icon">📿</text>
						<text class="preview-text">{{ design.items?.length || 0 }} 件</text>
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
				<view class="info-section">
					<view class="design-name">{{ design.name }}</view>
					<view class="design-price">¥{{ design.totalPrice }}</view>
				</view>
			</view>
		</view>
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
		methods: {
			async fetchDesigns() {
				this.loading = true
				try {
					const res = await designAPI.getDesigns()
					this.designs = res.designs || []
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
			
			viewDesign(id) {
				// TODO: 实现查看设计详情页面
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
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
				uni.switchTab({
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
	
	.designs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300rpx, 1fr));
		gap: 30rpx;
	}
	
	.design-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
	}
	
	.preview-section {
		position: relative;
		padding: 30rpx;
		border-bottom: 2rpx solid #e5e7eb;
		background: #f9fafb;
	}
	
	.preview-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300rpx;
		gap: 16rpx;
	}
	
	.preview-icon {
		font-size: 120rpx;
	}
	
	.preview-text {
		font-size: 24rpx;
		color: #6b7280;
	}
	
	.actions-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(255, 255, 255, 0.95), transparent);
		padding: 20rpx 30rpx 30rpx;
		display: flex;
		gap: 12rpx;
	}
	
	.action-btn {
		flex: 1;
		padding: 12rpx 20rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
		font-weight: 500;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6rpx;
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
	
	.info-section {
		padding: 24rpx 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.design-name {
		font-size: 32rpx;
		font-weight: 600;
		color: #1f2937;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.design-price {
		font-size: 32rpx;
		font-weight: bold;
		color: #3b82f6;
		margin-left: 16rpx;
	}
</style>
