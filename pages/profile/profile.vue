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
					open-type="getUserInfo"
					@getuserinfo="onGetUserInfo"
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
					<view class="user-name">{{ userInfo.nickName || '微信用户' }}</view>
					<view class="user-email" v-if="user.email && !userInfo.nickName">{{ user.email }}</view>
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
				
				<view class="menu-item" @click="goToOrders">
					<view class="menu-icon">📦</view>
					<view class="menu-content">
						<view class="menu-title">我的订单</view>
						<view class="menu-desc">查看订单与物流状态</view>
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
				const name = this.userInfo.nickName || this.user.name || '微'
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
			// 通过button的open-type获取用户信息（小程序推荐方式）
			onGetUserInfo(e) {
				console.log('通过button获取用户信息:', e)
				let userInfo = {}
				if (e.detail && e.detail.userInfo) {
					// 用户同意授权
					userInfo = {
						nickName: e.detail.userInfo.nickName,
						avatarUrl: e.detail.userInfo.avatarUrl,
						gender: e.detail.userInfo.gender,
						country: e.detail.userInfo.country,
						province: e.detail.userInfo.province,
						city: e.detail.userInfo.city
					}
					console.log('解析后的用户信息:', userInfo)
					console.log('昵称:', userInfo.nickName, '头像:', userInfo.avatarUrl)
					// 保存用户信息到本地
					uni.setStorageSync('wechatUserInfo', userInfo)
					// 立即更新userInfo，确保UI能显示
					this.userInfo = userInfo
					console.log('设置后的this.userInfo:', this.userInfo)
				} else {
					// 用户拒绝授权
					console.log('用户拒绝授权')
					uni.showToast({
						title: '需要授权才能获取昵称和头像',
						icon: 'none',
						duration: 2000
					})
				}
				// 无论是否授权，都继续登录流程
				this.handleWechatLoginWithInfo(userInfo)
			},
			
			async handleWechatLoginWithInfo(userInfo) {
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
					
					console.log('获取登录code成功，开始调用登录API...')
					console.log('使用的用户信息:', userInfo)
					
					// 2. 调用后端API进行登录
					const res = await authAPI.wechatLogin(loginRes.code, userInfo)
					
					console.log('登录API返回:', res)
					
					// 登录成功后，直接使用返回的用户信息
					if (res && res.user) {
						this.user = res.user
						// 优先使用微信用户信息（即使昵称是"微信用户"也是有效的，这是模拟器的默认值）
						// 在真机上会显示真实的微信昵称
						if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
							this.userInfo = userInfo
							console.log('使用微信用户信息，设置userInfo:', this.userInfo)
						} else if (res.user.name) {
							// 否则使用后端返回的用户名
							this.userInfo = {
								nickName: res.user.name
							}
							console.log('使用后端用户名，设置userInfo:', this.userInfo)
						} else {
							this.userInfo = {
								nickName: '微信用户'
							}
							console.log('使用默认用户名，设置userInfo:', this.userInfo)
						}
						console.log('登录后最终userInfo:', this.userInfo)
						console.log('登录后最终user:', this.user)
					} else {
						// 如果没有返回用户信息，则重新获取
						await this.checkLogin()
					}
					
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
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
			
			async checkLogin() {
				try {
					const res = await authAPI.getMe()
					console.log('getMe响应:', res)
					if (res && res.user) {
						this.user = res.user
						// 优先从本地存储获取微信用户信息（包含昵称和头像）
						const storedUserInfo = uni.getStorageSync('wechatUserInfo')
						if (storedUserInfo && (storedUserInfo.nickName || storedUserInfo.avatarUrl)) {
							this.userInfo = storedUserInfo
						} else {
							// 如果没有本地存储的信息，使用后端返回的用户名
							this.userInfo = {
								nickName: this.user.name || '微信用户'
							}
						}
					} else {
						this.user = null
						this.userInfo = {}
					}
				} catch (err) {
					console.error('检查登录状态失败:', err)
					this.user = null
					this.userInfo = {}
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
								// 即使API调用失败，也清除本地状态
								this.user = null
								this.userInfo = {}
								uni.showToast({
									title: '已退出登录',
									icon: 'success'
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
			
			goToOrders() {
				uni.navigateTo({
					url: '/pages/orders/orders'
				})
			},
			
			goToAddresses() {
				uni.navigateTo({
					url: '/pages/address/address'
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

