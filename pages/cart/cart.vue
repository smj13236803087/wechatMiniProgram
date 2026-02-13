<template>
	<view class="container">
		<view class="content">
			<view class="title">购物车</view>
			<view class="empty-card">
				<text class="empty-text">购物车功能开发中...</text>
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
			
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%);
		padding: 40rpx;
	}
	
	.content {
		max-width: 800rpx;
		margin: 0 auto;
	}
	
	.title {
		font-size: 56rpx;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 40rpx;
	}
	
	.empty-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 24rpx;
		padding: 120rpx 60rpx;
		text-align: center;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #6b7280;
	}
</style>
