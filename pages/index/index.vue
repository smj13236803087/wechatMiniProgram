<template>
	<view class="container">
		<view class="content">
			<view class="design-entry" @click="goToWorkspace">
				<view class="icon-wrapper">
					<text class="icon">🎨</text>
				</view>
				<view class="title">设计</view>
				<view class="subtitle">定制你的专属手串</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		onLoad() {
			
		},
		methods: {
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
		background: linear-gradient(to bottom, #f9fafb, #ffffff);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
	}
	
	.content {
		width: 100%;
		max-width: 600rpx;
	}
	
	.design-entry {
		background: #ffffff;
		border-radius: 32rpx;
		padding: 80rpx 60rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 4rpx solid transparent;
		transition: all 0.3s;
	}
	
	.design-entry:active {
		transform: scale(0.98);
		border-color: #3b82f6;
		box-shadow: 0 20rpx 80rpx rgba(59, 130, 246, 0.2);
	}
	
	.icon-wrapper {
		width: 160rpx;
		height: 160rpx;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 40rpx;
		box-shadow: 0 10rpx 30rpx rgba(59, 130, 246, 0.3);
	}
	
	.icon {
		font-size: 80rpx;
	}
	
	.title {
		font-size: 60rpx;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 20rpx;
	}
	
	.subtitle {
		font-size: 32rpx;
		color: #6b7280;
	}
</style>
