<template>
	<view class="container">
		<view class="login-card">
			<view class="header">
				<view class="icon-wrapper">
					<text class="icon">🔐</text>
				</view>
				<view class="title">欢迎回来</view>
				<view class="subtitle">登录以继续使用</view>
			</view>
			
			<view class="form">
				<view class="form-item">
					<view class="label">邮箱</view>
					<view class="input-wrapper">
						<text class="input-icon">📧</text>
						<input 
							type="text" 
							v-model="email" 
							placeholder="your@email.com"
							class="input"
						/>
					</view>
				</view>
				
				<view class="form-item">
					<view class="label">密码</view>
					<view class="input-wrapper">
						<text class="input-icon">🔒</text>
						<input 
							type="password" 
							v-model="password" 
							placeholder="请输入密码"
							class="input"
						/>
					</view>
				</view>
				
				<view v-if="error" class="error-message">
					<text class="error-icon">⚠️</text>
					<text>{{ error }}</text>
				</view>
				
				<view v-if="success" class="success-message">
					<text class="success-icon">✓</text>
					<text>{{ success }}</text>
				</view>
				
				<button 
					class="submit-btn" 
					:disabled="loading"
					@click="handleSubmit"
				>
					<text v-if="loading">登录中...</text>
					<text v-else>登录</text>
				</button>
			</view>
			
			<view class="footer">
				<view class="link" @click="goToForgotPassword">忘记密码？</view>
				<view class="link" @click="goToRegister">还没有账号？立即注册</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { authAPI } from '@/utils/api.js'
	
	export default {
		data() {
			return {
				email: '',
				password: '',
				loading: false,
				error: '',
				success: ''
			}
		},
		onLoad(options) {
			if (options.registered === 'true') {
				this.success = '注册成功！请登录'
			} else if (options.reset === 'true') {
				this.success = '密码重置成功！请登录'
			}
		},
		methods: {
			async handleSubmit() {
				if (!this.email || !this.password) {
					this.error = '请填写完整信息'
					return
				}
				
				this.loading = true
				this.error = ''
				this.success = ''
				
				try {
					const res = await authAPI.login(this.email, this.password)
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					setTimeout(() => {
						uni.switchTab({
							url: '/pages/profile/profile'
						})
					}, 1500)
				} catch (err) {
					this.error = err.message || '登录失败，请重试'
				} finally {
					this.loading = false
				}
			},
			
			goToForgotPassword() {
				// TODO: 实现忘记密码页面
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			},
			
			goToRegister() {
				uni.navigateTo({
					url: '/pages/register/register'
				})
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
	}
	
	.login-card {
		width: 100%;
		max-width: 600rpx;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 32rpx;
		padding: 60rpx 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
	}
	
	.header {
		text-align: center;
		margin-bottom: 60rpx;
	}
	
	.icon-wrapper {
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 30rpx;
		box-shadow: 0 10rpx 30rpx rgba(59, 130, 246, 0.3);
	}
	
	.icon {
		font-size: 60rpx;
	}
	
	.title {
		font-size: 56rpx;
		font-weight: bold;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-bottom: 20rpx;
	}
	
	.subtitle {
		font-size: 28rpx;
		color: #6b7280;
	}
	
	.form {
		margin-bottom: 40rpx;
	}
	
	.form-item {
		margin-bottom: 40rpx;
	}
	
	.label {
		font-size: 28rpx;
		font-weight: 600;
		color: #374151;
		margin-bottom: 16rpx;
	}
	
	.input-wrapper {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.5);
		border: 4rpx solid #e5e7eb;
		border-radius: 24rpx;
		padding: 0 24rpx;
		transition: all 0.3s;
	}
	
	.input-wrapper:focus-within {
		border-color: #3b82f6;
		box-shadow: 0 0 0 4rpx rgba(59, 130, 246, 0.1);
	}
	
	.input-icon {
		font-size: 40rpx;
		margin-right: 16rpx;
	}
	
	.input {
		flex: 1;
		height: 88rpx;
		font-size: 28rpx;
		color: #1f2937;
	}
	
	.error-message {
		background: #fef2f2;
		border: 2rpx solid #fecaca;
		color: #dc2626;
		padding: 24rpx;
		border-radius: 16rpx;
		font-size: 24rpx;
		margin-bottom: 30rpx;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}
	
	.error-icon {
		font-size: 32rpx;
	}
	
	.success-message {
		background: #f0fdf4;
		border: 2rpx solid #bbf7d0;
		color: #16a34a;
		padding: 24rpx;
		border-radius: 16rpx;
		font-size: 24rpx;
		margin-bottom: 30rpx;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}
	
	.success-icon {
		font-size: 32rpx;
	}
	
	.submit-btn {
		width: 100%;
		height: 96rpx;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		border-radius: 24rpx;
		border: none;
		box-shadow: 0 10rpx 30rpx rgba(59, 130, 246, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
	}
	
	.submit-btn:active {
		transform: scale(0.98);
	}
	
	.submit-btn[disabled] {
		opacity: 0.5;
	}
	
	.footer {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
		align-items: center;
	}
	
	.link {
		font-size: 26rpx;
		color: #3b82f6;
		font-weight: 500;
	}
</style>
