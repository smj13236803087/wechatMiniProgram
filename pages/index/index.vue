<template>
	<view class="container">
		<!-- 顶部Header -->
		<view class="header">
			<view class="header-left">
				<view class="logo-icon-wrapper">
					<image 
						class="logo-icon" 
						src="/assets/lightning.svg" 
						mode="aspectFit"
					/>
				</view>
				<view class="logo-text">
					<text class="logo-title">衡月珠宝</text>
					<text class="logo-subtitle">测算你的专属能量场</text>
				</view>
			</view>
			<view class="header-right">
				<view class="energy-wrapper">
					<view class="energy-icon-wrapper">
						<view class="energy-icon-person"></view>
					</view>
					<text class="energy-text">能量</text>
				</view>
			</view>
		</view>
		
		<scroll-view class="content" scroll-y>
			<!-- AI能量测算区域 -->
			<view class="hero-section">
				<view class="hero-content">
					<view class="hero-title-group">
						<view class="hero-icon" aria-hidden="true">
							<image class="hero-icon-img" src="/assets/sparkles.svg" mode="aspectFit" />
						</view>
						<text class="hero-title">开启AI专属能量深度测算</text>
					</view>
					<text class="hero-desc">只需3个问题,洞悉你当前的潜意识与能量匮乏点</text>
					<button class="hero-btn">免费生成我的能量雷达报告</button>
					<text class="hero-stats">已有<text class="hero-stats-number">18,742</text>人完成测算</text>
				</view>
			</view>
			
			<!-- 四个功能导航按钮 -->
			<view class="quick-nav">
				<view class="nav-item">
					<view class="nav-icon yellow">⭐</view>
					<text class="nav-text">经典六维</text>
				</view>
				<view class="nav-item">
					<view class="nav-icon purple">💎</view>
					<text class="nav-text">星座守护</text>
				</view>
				<view class="nav-item">
					<view class="nav-icon blue">📅</view>
					<text class="nav-text">生肖流年</text>
				</view>
				<view class="nav-item">
					<view class="nav-icon green">📖</view>
					<text class="nav-text">能量图鉴</text>
				</view>
			</view>
			
			<!-- 高阶定制区域 -->
			<view class="diy-section">
				<view class="diy-card">
					<view class="diy-header">
						<text class="diy-icon">⚡</text>
						<text class="diy-title">高阶定制・随心拼搭</text>
					</view>
					<text class="diy-subtitle">18颗天然矿石,拼出属于你的独家磁场</text>
					
					<!-- 预览区域 -->
					<view class="diy-preview-area">
						<view class="preview-wrapper">
							<canvas 
								canvas-id="diy-preview"
								class="preview-canvas"
							></canvas>
							<!-- 装饰图片（模拟） -->
							<view class="preview-decoration tree">🌳</view>
							<view class="preview-decoration crystal-pink">💎</view>
							<view class="preview-decoration crystal-green">💚</view>
						</view>
					</view>
					
					<button class="diy-btn" @click="goToWorkspace">进入2D可视化工作台</button>
					<view class="diy-hint">
						<text class="hint-icon">➕</text>
						<text class="hint-text">支持18种入矿石自由组合</text>
					</view>
				</view>
			</view>
			
			<!-- Tab内容区域（预留） -->
			<view class="tab-content-placeholder">
				<text class="placeholder-text">内容区域</text>
			</view>
		</scroll-view>
		
		<!-- 底部Tab导航 -->
		<view class="bottom-tabs">
			<view 
				class="bottom-tab-item"
				:class="{ active: activeTab === 'ai' }"
				@click="activeTab = 'ai'"
			>
				<text class="bottom-tab-icon">@</text>
				<text class="bottom-tab-text">AI测算精选案例</text>
			</view>
			<view 
				class="bottom-tab-item"
				:class="{ active: activeTab === 'classic' }"
				@click="activeTab = 'classic'"
			>
				<text class="bottom-tab-icon">☑️</text>
				<text class="bottom-tab-text">经典主题现货</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				activeTab: 'ai'
			}
		},
		onLoad() {
			this.$nextTick(() => {
				setTimeout(() => {
					this.drawPreview()
				}, 300)
			})
		},
		methods: {
			goToWorkspace() {
				uni.navigateTo({
					url: '/pages/workspace/workspace'
				})
			},
			
			// 绘制预览图（虚线圆形 + 两个加号）
			drawPreview() {
				const ctx = uni.createCanvasContext('diy-preview', this)
				
				const systemInfo = uni.getSystemInfoSync()
				const screenWidth = systemInfo.screenWidth
				const size = (500 / 750) * screenWidth // 500rpx
				const centerX = size / 2
				const centerY = size / 2
				
				ctx.clearRect(0, 0, size, size)
				
				// 绘制大虚线圆形
				const radius = size * 0.35
				ctx.beginPath()
				ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
				ctx.setStrokeStyle('rgba(168, 85, 247, 0.3)')
				ctx.setLineWidth(3)
				ctx.setLineDash([8, 8], 0)
				ctx.stroke()
				ctx.setLineDash([], 0)
				
				// 绘制两个紫色加号（在圆形上）
				const plusPositions = [
					{ angle: 45 }, // 右上
					{ angle: 225 } // 左下
				]
				
				plusPositions.forEach(pos => {
					const rad = (pos.angle * Math.PI) / 180
					const x = centerX + radius * Math.cos(rad)
					const y = centerY + radius * Math.sin(rad)
					const plusSize = 20
					
					// 绘制加号圆圈（虚线）
					ctx.beginPath()
					ctx.arc(x, y, plusSize, 0, 2 * Math.PI)
					ctx.setStrokeStyle('rgba(168, 85, 247, 0.5)')
					ctx.setLineWidth(2)
					ctx.setLineDash([4, 4], 0)
					ctx.stroke()
					ctx.setLineDash([], 0)
					
					// 绘制加号
					ctx.setStrokeStyle('#8b5cf6')
					ctx.setLineWidth(3)
					ctx.beginPath()
					ctx.moveTo(x - 8, y)
					ctx.lineTo(x + 8, y)
					ctx.moveTo(x, y - 8)
					ctx.lineTo(x, y + 8)
					ctx.stroke()
				})
				
				ctx.draw()
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: #ffffff;
		display: flex;
		flex-direction: column;
	}
	
	/* 顶部Header */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 32rpx;
		background: #ffffff;
		border-bottom: 1rpx solid #f3f4f6;
	}
	
	.header-left {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}
	
	.logo-icon-wrapper {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #a855f7 0%, #d946ef 30%, #3b82f6 65%, #06b6d4 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		animation: logoPulse 1.5s ease-out infinite;
	}
	
	@keyframes logoPulse {
		0% {
			box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.5);
		}
		100% {
			box-shadow: 0 0 0 28rpx rgba(168, 85, 247, 0);
		}
	}
	
	.logo-icon {
		width: 40rpx;
		height: 40rpx;
		color: #ffffff;
		font-weight: bold;
		line-height: 1;
	}
	
	.logo-text {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}
	
	.logo-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #111827;
	}
	
	.logo-subtitle {
		font-size: 22rpx;
		color: #6b7280;
	}
	
	.header-right {
		display: flex;
		align-items: center;
	}
	
	.energy-wrapper {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 12rpx 24rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, rgba(243, 232, 255, 0.8), rgba(219, 234, 254, 0.8));
		border: 1rpx solid rgba(196, 181, 253, 0.5);
	}
	
	.energy-icon-wrapper {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #a78bfa, #60a5fa);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.energy-icon-person {
		width: 20rpx;
		height: 20rpx;
		position: relative;
	}
	
	.energy-icon-person::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: #ffffff;
	}
	
	.energy-icon-person::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 16rpx;
		height: 12rpx;
		border-radius: 8rpx 8rpx 0 0;
		background: #ffffff;
	}
	
	.energy-text {
		font-size: 24rpx;
		color: #374151;
		font-weight: 500;
	}
	
	/* 内容区域 */
	.content {
		flex: 1;
		padding-bottom: 120rpx;
	}
	
	/* AI能量测算区域 */
	.hero-section {
		padding: 40rpx 32rpx;
		background: linear-gradient(to bottom, rgba(249, 250, 251, 0.5), #ffffff);
	}
	
	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24rpx;
		text-align: center;
	}
	
	.hero-title-group {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
	}
	
	.hero-icon {
		width: 44rpx;
		height: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transform-origin: center center;
		animation: heroIconWiggle 2s linear infinite;
	}

	@keyframes heroIconWiggle {
		0% { transform: rotate(0deg); }
		25% { transform: rotate(10deg); }
		50% { transform: rotate(-10deg); }
		100% { transform: rotate(0deg); }
	}

	.hero-icon-img {
		width: 44rpx;
		height: 44rpx;
	}
	.hero-title {
		font-size: 44rpx;
		font-weight: 700;
		background: linear-gradient(90deg, #9333ea, #2563eb, #9333ea);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	
	.hero-desc {
		font-size: 26rpx;
		color: #6b7280;
		line-height: 1.6;
		padding: 0 20rpx;
	}
	
	.hero-btn {
		width: 100%;
		max-width: 600rpx;
		height: 96rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #a855f7 0%, #d946ef 28%, #3b82f6 62%, #06b6d4 100%);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		border: none;
		box-shadow: 0 12rpx 32rpx rgba(139, 92, 246, 0.3);
		margin-top: 16rpx;
		animation: logoPulse 1.5s ease-out infinite;
	}
	
	.hero-btn:active {
		transform: scale(0.98);
	}
	
	.hero-stats {
		font-size: 24rpx;
		color: #9ca3af;
		margin-top: 8rpx;
	}
	
	.hero-stats-number {
		font-size: 24rpx;
		color: #8b5cf6;
		font-weight: 700;
	}
	
	/* 四个功能导航 */
	.quick-nav {
		display: flex;
		justify-content: space-around;
		padding: 32rpx;
		gap: 16rpx;
	}
	
	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		flex: 1;
		padding: 24rpx 16rpx 20rpx;
		border: 2rpx solid #e5e7eb;
		border-top: none;
		border-radius: 0 0 24rpx 24rpx;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
	}
	
	.nav-icon {
		width: 100rpx;
		height: 100rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
	}
	
	.nav-icon.yellow {
		background: #fef3c7;
		border-color: #fbbf24;
	}
	
	.nav-icon.purple {
		background: #f3e8ff;
		border-color: #8b5cf6;
	}
	
	.nav-icon.blue {
		background: #dbeafe;
		border-color: #3b82f6;
	}
	
	.nav-icon.green {
		background: #d1fae5;
		border-color: #10b981;
	}
	
	.nav-text {
		font-size: 24rpx;
		color: #374151;
		font-weight: 500;
	}
	
	/* 高阶定制区域 */
	.diy-section {
		padding: 0 32rpx 32rpx;
	}
	
	.diy-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 0 0 32rpx 32rpx;
		padding: 40rpx 32rpx;
		display: flex;
		flex-direction: column;
		gap: 24rpx;
		backdrop-filter: blur(20rpx);
		-webkit-backdrop-filter: blur(20rpx);
		border: 1rpx solid rgba(229, 231, 235, 0.5);
		border-top: none;
		/* 三边阴影：左、右、下 */
		box-shadow: 
			-8rpx 8rpx 24rpx rgba(0, 0, 0, 0.08),
			8rpx 8rpx 24rpx rgba(0, 0, 0, 0.08),
			0 8rpx 24rpx rgba(0, 0, 0, 0.08);
	}
	
	.diy-header {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.diy-icon {
		font-size: 32rpx;
		color: #8b5cf6;
	}
	
	.diy-title {
		font-size: 36rpx;
		font-weight: 700;
		color: #8b5cf6;
	}
	
	.diy-subtitle {
		font-size: 26rpx;
		color: #6b7280;
		margin-top: -8rpx;
	}
	
	.diy-preview-area {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 32rpx 0;
	}
	
	.preview-wrapper {
		position: relative;
		width: 500rpx;
		height: 500rpx;
		background: #e5e7eb;
		border-radius: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}
	
	.preview-canvas {
		width: 500rpx;
		height: 500rpx;
	}
	
	.preview-decoration {
		position: absolute;
		font-size: 48rpx;
	}
	
	.preview-decoration.tree {
		top: 20rpx;
		right: 40rpx;
	}
	
	.preview-decoration.crystal-pink {
		right: 20rpx;
		top: 50%;
		transform: translateY(-50%);
	}
	
	.preview-decoration.crystal-green {
		bottom: 20rpx;
		right: 40rpx;
	}
	
	.diy-btn {
		width: 100%;
		height: 96rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #8b5cf6, #3b82f6);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		border: none;
		box-shadow: 0 12rpx 32rpx rgba(139, 92, 246, 0.3);
	}
	
	.diy-btn:active {
		transform: scale(0.98);
	}
	
	.diy-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
	}
	
	.hint-icon {
		font-size: 24rpx;
		color: #8b5cf6;
	}
	
	.hint-text {
		font-size: 24rpx;
		color: #9ca3af;
	}
	
	.tab-content-placeholder {
		padding: 80rpx 32rpx;
		text-align: center;
	}
	
	.placeholder-text {
		font-size: 28rpx;
		color: #9ca3af;
	}
	
	/* 底部Tab导航 */
	.bottom-tabs {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		background: #ffffff;
		border-top: 1rpx solid #f3f4f6;
		padding: 16rpx 0;
		box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	
	.bottom-tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 12rpx 0;
	}
	
	.bottom-tab-item.active {
		color: #8b5cf6;
	}
	
	.bottom-tab-icon {
		font-size: 40rpx;
	}
	
	.bottom-tab-item.active .bottom-tab-icon {
		color: #8b5cf6;
	}
	
	.bottom-tab-item:not(.active) .bottom-tab-icon {
		color: #9ca3af;
	}
	
	.bottom-tab-text {
		font-size: 22rpx;
	}
	
	.bottom-tab-item.active .bottom-tab-text {
		color: #8b5cf6;
		font-weight: 600;
	}
	
	.bottom-tab-item:not(.active) .bottom-tab-text {
		color: #9ca3af;
	}
</style>
