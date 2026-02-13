<template>
	<view class="container">
		<view class="content">
			<view class="title">广场</view>
			<view class="empty-card">
				<text class="empty-text">广场功能开发中...</text>
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
		background: #f5f5f5;
		padding: 30rpx;
	}
	
	.content {
		max-width: 100%;
	}
	
	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
	}
	
	.empty-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 120rpx 60rpx;
		text-align: center;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
</style>
