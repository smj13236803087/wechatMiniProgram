<template>
	<view class="orders-container">
		<view class="tabs">
			<view
				v-for="tab in tabs"
				:key="tab.key"
				class="tab-item"
				:class="{ active: activeTab === tab.key }"
				@click="activeTab = tab.key"
			>
				<text class="tab-text">{{ tab.label }}</text>
			</view>
		</view>
		
		<view class="content">
			<view class="placeholder-card">
				<text class="placeholder-title">订单功能开发中</text>
				<text class="placeholder-desc">
					当前选中：{{ currentTabLabel }}。
					后续将在这里展示对应状态的订单列表。
				</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			tabs: [
				{ key: 'all', label: '全部' },
				{ key: 'pending-ship', label: '待发货' },
				{ key: 'pending-receive', label: '待收货' },
				{ key: 'completed', label: '已完成' },
				{ key: 'after-sale', label: '退款/售后' }
			],
			activeTab: 'all'
		}
	},
	computed: {
		currentTabLabel() {
			const found = this.tabs.find(t => t.key === this.activeTab)
			return found ? found.label : ''
		}
	}
}
</script>

<style scoped>
.orders-container {
	min-height: 100vh;
	background: #f3f4f6;
	display: flex;
	flex-direction: column;
}

.tabs {
	display: flex;
	flex-direction: row;
	background: #ffffff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
	flex: 1;
	padding: 24rpx 0;
	text-align: center;
	position: relative;
}

.tab-text {
	font-size: 28rpx;
	color: #6b7280;
}

.tab-item.active .tab-text {
	color: #111827;
	font-weight: 600;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	left: 20rpx;
	right: 20rpx;
	bottom: 0;
	height: 4rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.content {
	flex: 1;
	padding: 32rpx 24rpx;
}

.placeholder-card {
	margin-top: 80rpx;
	background: #ffffff;
	border-radius: 24rpx;
	padding: 80rpx 40rpx;
	text-align: center;
	box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.08);
}

.placeholder-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #111827;
	margin-bottom: 16rpx;
	display: block;
}

.placeholder-desc {
	font-size: 26rpx;
	color: #6b7280;
	line-height: 1.6;
}
</style>

