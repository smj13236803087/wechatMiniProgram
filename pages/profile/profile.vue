<template>
	<view class="container">
		<!-- 未登录状态 -->
		<view v-if="!user" class="login-section">
			<view class="login-card">
				<view class="login-icon">👤</view>
				<view class="login-title">欢迎使用手串定制</view>
				<view class="login-desc">请使用微信登录以继续</view>
				<button 
					class="wechat-login-btn" 
					:disabled="logging"
					@click="handleWechatLogin"
				>
					<text v-if="logging">登录中...</text>
					<text v-else>微信快速登录</text>
				</button>
			</view>
		</view>
		
		<!-- 已登录状态 -->
		<view v-else class="user-section">
			<!-- 用户信息卡片 -->
			<view class="user-header">
				<view class="avatar-wrapper">
					<image 
						v-if="userInfo.avatarUrl" 
						:src="userInfo.avatarUrl" 
						class="avatar"
						mode="aspectFill"
					/>
					<view v-else class="avatar-placeholder">
						<text class="avatar-text">{{ userInitial }}</text>
					</view>
				</view>
				<view class="user-info">
					<view class="user-name">{{ userInfo.nickName || user.name || '微信用户' }}</view>
					<view class="user-email" v-if="user.email">{{ user.email }}</view>
				</view>
			</view>
			
			<!-- 功能菜单 -->
			<view class="menu-section">
				<view class="menu-item" @click="goToWorkspace">
					<view class="menu-icon">🎨</view>
					<view class="menu-content">
						<view class="menu-title">工作台</view>
						<view class="menu-desc">设计你的专属手串</view>
					</view>
					<text class="menu-arrow">›</text>
				</view>
				
				<view class="menu-item" @click="goToPortfolio">
					<view class="menu-icon">✨</view>
					<view class="menu-content">
						<view class="menu-title">我的作品集</view>
						<view class="menu-desc">查看保存的设计</view>
					</view>
					<text class="menu-arrow">›</text>
				</view>
				
				<view class="menu-item" @click="goToAddresses">
					<view class="menu-icon">📍</view>
					<view class="menu-content">
						<view class="menu-title">收货地址</view>
						<view class="menu-desc">管理收货地址</view>
					</view>
					<text class="menu-arrow">›</text>
				</view>
			</view>
			
			<!-- 退出登录 -->
			<view class="logout-section">
				<button class="logout-btn" @click="handleLogout">退出登录</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { authAPI } from '@/utils/api.js'
	
	export default {
		data() {
			return {
				user: null,
				userInfo: {},
				logging: false
			}
		},
		computed: {
			userInitial() {
				if (!this.user) return 'U'
				const name = this.userInfo.nickName || this.user.name || this.user.email || 'U'
				return name[0].toUpperCase()
			}
		},
		onLoad() {
			this.checkLogin()
		},
		onShow() {
			this.checkLogin()
		},
		methods: {
			async checkLogin() {
				try {
					const res = await authAPI.getMe()
					if (res.user) {
						this.user = res.user
						// 尝试从本地存储获取微信用户信息
						const userInfo = uni.getStorageSync('wechatUserInfo')
						if (userInfo) {
							this.userInfo = userInfo
						}
					}
				} catch (err) {
					console.log('未登录')
					this.user = null
				}
			},
			
			async handleWechatLogin() {
				this.logging = true
				try {
					// 1. 获取微信登录code
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({
							provider: 'weixin',
							success: resolve,
							fail: reject
						})
					})
					
					if (!loginRes.code) {
						throw new Error('获取微信登录code失败')
					}
					
					// 2. 获取用户信息（需要用户授权）
					let userInfo = {}
					try {
						const userInfoRes = await new Promise((resolve, reject) => {
							uni.getUserProfile({
								desc: '用于完善用户资料',
								success: resolve,
								fail: reject
							})
						})
						userInfo = {
							nickName: userInfoRes.userInfo.nickName,
							avatarUrl: userInfoRes.userInfo.avatarUrl,
							gender: userInfoRes.userInfo.gender,
							country: userInfoRes.userInfo.country,
							province: userInfoRes.userInfo.province,
							city: userInfoRes.userInfo.city
						}
						// 保存用户信息到本地
						uni.setStorageSync('wechatUserInfo', userInfo)
						this.userInfo = userInfo
					} catch (err) {
						console.log('用户取消授权，使用基础信息')
						// 用户取消授权，仍然可以使用code登录
					}
					
					// 3. 调用后端API进行登录
					const res = await authAPI.wechatLogin(loginRes.code, userInfo)
					
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					// 刷新用户信息
					await this.checkLogin()
				} catch (err) {
					console.error('微信登录失败：', err)
					uni.showToast({
						title: err.message || '登录失败，请重试',
						icon: 'none',
						duration: 2000
					})
				} finally {
					this.logging = false
				}
			},
			
			async handleLogout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								await authAPI.logout()
								// 清除本地存储
								uni.removeStorageSync('wechatUserInfo')
								this.user = null
								this.userInfo = {}
								uni.showToast({
									title: '已退出登录',
									icon: 'success'
								})
							} catch (err) {
								uni.showToast({
									title: '退出失败',
									icon: 'none'
								})
							}
						}
					}
				})
			},
			
			goToWorkspace() {
				uni.navigateTo({
					url: '/pages/workspace/workspace'
				})
			},
			
			goToPortfolio() {
				uni.navigateTo({
					url: '/pages/portfolio/portfolio'
				})
			},
			
			goToAddresses() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%);
	}
	
	/* 未登录状态 */
	.login-section {
		padding: 100rpx 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 200rpx);
	}
	
	.login-card {
		width: 100%;
		max-width: 600rpx;
		background: #ffffff;
		border-radius: 32rpx;
		padding: 80rpx 60rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
		text-align: center;
	}
	
	.login-icon {
		font-size: 120rpx;
		margin-bottom: 40rpx;
	}
	
	.login-title {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	.login-desc {
		font-size: 28rpx;
		color: #999;
		margin-bottom: 60rpx;
	}
	
	.wechat-login-btn {
		width: 100%;
		height: 96rpx;
		background: linear-gradient(135deg, #07c160, #06ad56);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		border-radius: 48rpx;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
	}
	
	.wechat-login-btn:active {
		transform: scale(0.98);
	}
	
	.wechat-login-btn[disabled] {
		opacity: 0.6;
	}
	
	/* 已登录状态 */
	.user-section {
		padding-bottom: 40rpx;
	}
	
	.user-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 60rpx 40rpx 80rpx;
		display: flex;
		align-items: center;
		gap: 30rpx;
	}
	
	.avatar-wrapper {
		position: relative;
	}
	
	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}
	
	.avatar-placeholder {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		border: 4rpx solid rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.avatar-text {
		font-size: 48rpx;
		font-weight: bold;
		color: #ffffff;
	}
	
	.user-info {
		flex: 1;
	}
	
	.user-name {
		font-size: 40rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 12rpx;
	}
	
	.user-email {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
	}
	
	/* 功能菜单 */
	.menu-section {
		margin: -40rpx 30rpx 30rpx;
		background: #ffffff;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}
	
	.menu-item {
		display: flex;
		align-items: center;
		padding: 32rpx 30rpx;
		border-bottom: 1rpx solid #f5f5f5;
		transition: background 0.2s;
	}
	
	.menu-item:last-child {
		border-bottom: none;
	}
	
	.menu-item:active {
		background: #f8f8f8;
	}
	
	.menu-icon {
		font-size: 48rpx;
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f7fa;
		border-radius: 16rpx;
		margin-right: 24rpx;
	}
	
	.menu-content {
		flex: 1;
	}
	
	.menu-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 8rpx;
	}
	
	.menu-desc {
		font-size: 24rpx;
		color: #999;
	}
	
	.menu-arrow {
		font-size: 40rpx;
		color: #ccc;
		margin-left: 20rpx;
	}
	
	/* 退出登录 */
	.logout-section {
		padding: 0 30rpx;
		margin-top: 30rpx;
	}
	
	.logout-btn {
		width: 100%;
		height: 88rpx;
		background: #ffffff;
		color: #ff4757;
		font-size: 32rpx;
		font-weight: 500;
		border-radius: 24rpx;
		border: 1rpx solid #ffebee;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.logout-btn:active {
		background: #ffebee;
	}
</style>

