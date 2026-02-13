<template>
	<view class="container">
		<view class="register-card">
			<!-- 第一步：填写信息 -->
			<template v-if="step === 'form'">
				<view class="header">
					<view class="icon-wrapper">
						<text class="icon">👤</text>
					</view>
					<view class="title">创建账号</view>
					<view class="subtitle">开始你的专属手串定制之旅</view>
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
						<view class="label">姓名</view>
						<view class="input-wrapper">
							<text class="input-icon">👤</text>
							<input 
								type="text" 
								v-model="name" 
								placeholder="请输入您的姓名"
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
								placeholder="至少8位字符"
								class="input"
							/>
						</view>
						<view v-if="password" class="password-strength">
							<view class="strength-bar" :class="passwordStrengthClass"></view>
							<text class="strength-text">{{ passwordStrengthText }}</text>
						</view>
					</view>
					
					<view v-if="error" class="error-message">
						<text class="error-icon">⚠️</text>
						<text>{{ error }}</text>
					</view>
					
					<button 
						class="submit-btn" 
						:disabled="loading"
						@click="handleRequestCode"
					>
						<text v-if="loading">发送验证码中...</text>
						<text v-else>发送验证码</text>
					</button>
				</view>
				
				<view class="footer">
					<view class="link" @click="goToLogin">已有账号？立即登录</view>
				</view>
			</template>
			
			<!-- 第二步：验证码 -->
			<template v-else>
				<view class="header">
					<view class="icon-wrapper">
						<text class="icon">📧</text>
					</view>
					<view class="title">验证邮箱</view>
					<view class="subtitle">
						我们已向 <text class="email-text">{{ email }}</text> 发送了验证码
					</view>
				</view>
				
				<view class="form">
					<view class="form-item">
						<view class="label">验证码</view>
						<view class="input-wrapper">
							<text class="input-icon">🛡️</text>
							<input 
								type="number" 
								v-model="code" 
								placeholder="请输入6位验证码"
								maxlength="6"
								class="input"
							/>
						</view>
						<view class="code-dots">
							<view 
								v-for="(item, index) in 6" 
								:key="index"
								class="dot"
								:class="{ active: code.length > index }"
							></view>
						</view>
					</view>
					
					<view v-if="error" class="error-message">
						<text class="error-icon">⚠️</text>
						<text>{{ error }}</text>
					</view>
					
					<button 
						class="submit-btn" 
						:disabled="loading || code.length !== 6"
						@click="handleVerify"
					>
						<text v-if="loading">验证中...</text>
						<text v-else>验证并注册</text>
					</button>
				</view>
				
				<view class="footer">
					<view class="link" @click="handleResendCode" :class="{ disabled: countdown > 0 }">
						{{ countdown > 0 ? `重新发送 (${countdown}秒)` : '重新发送验证码' }}
					</view>
					<view class="link" @click="step = 'form'">返回修改信息</view>
				</view>
			</template>
		</view>
	</view>
</template>

<script>
	import { authAPI } from '@/utils/api.js'
	
	export default {
		data() {
			return {
				step: 'form', // 'form' | 'verify'
				email: '',
				name: '',
				password: '',
				code: '',
				countdown: 0,
				loading: false,
				error: '',
				timer: null
			}
		},
		computed: {
			passwordStrengthClass() {
				if (this.password.length >= 8) return 'strong'
				if (this.password.length >= 4) return 'medium'
				return 'weak'
			},
			passwordStrengthText() {
				if (this.password.length >= 8) return '✓'
				return `${this.password.length}/8`
			}
		},
		onUnload() {
			if (this.timer) {
				clearInterval(this.timer)
			}
		},
		methods: {
			startCountdown() {
				this.countdown = 60
				if (this.timer) {
					clearInterval(this.timer)
				}
				this.timer = setInterval(() => {
					if (this.countdown <= 1) {
						clearInterval(this.timer)
						this.countdown = 0
					} else {
						this.countdown--
					}
				}, 1000)
			},
			
			async handleRequestCode() {
				if (!this.email || !this.name || !this.password) {
					this.error = '请填写完整信息'
					return
				}
				
				if (this.password.length < 8) {
					this.error = '密码至少需要8位字符'
					return
				}
				
				this.loading = true
				this.error = ''
				
				try {
					await authAPI.requestCode(this.email, this.name, this.password)
					this.step = 'verify'
					this.startCountdown()
				} catch (err) {
					this.error = err.message || '发送验证码失败'
				} finally {
					this.loading = false
				}
			},
			
			async handleResendCode() {
				if (this.countdown > 0 || this.loading) return
				
				this.loading = true
				this.error = ''
				
				try {
					await authAPI.requestCode(this.email, this.name, this.password)
					this.startCountdown()
				} catch (err) {
					this.error = err.message || '重新发送验证码失败'
				} finally {
					this.loading = false
				}
			},
			
			async handleVerify() {
				if (this.code.length !== 6) {
					this.error = '请输入6位验证码'
					return
				}
				
				this.loading = true
				this.error = ''
				
				try {
					await authAPI.verifyCode(this.email, this.code)
					uni.showToast({
						title: '注册成功',
						icon: 'success'
					})
					setTimeout(() => {
						uni.redirectTo({
							url: '/pages/login/login?registered=true'
						})
					}, 1500)
				} catch (err) {
					this.error = err.message || '验证失败'
				} finally {
					this.loading = false
				}
			},
			
			goToLogin() {
				uni.navigateBack()
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
	
	.register-card {
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
	
	.email-text {
		font-weight: 600;
		color: #1f2937;
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
	
	.password-strength {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-top: 16rpx;
	}
	
	.strength-bar {
		flex: 1;
		height: 8rpx;
		border-radius: 4rpx;
		transition: all 0.3s;
	}
	
	.strength-bar.weak {
		background: #d1d5db;
	}
	
	.strength-bar.medium {
		background: #fbbf24;
	}
	
	.strength-bar.strong {
		background: #10b981;
	}
	
	.strength-text {
		font-size: 24rpx;
		color: #6b7280;
	}
	
	.code-dots {
		display: flex;
		justify-content: center;
		gap: 16rpx;
		margin-top: 24rpx;
	}
	
	.dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #d1d5db;
		transition: all 0.2s;
	}
	
	.dot.active {
		background: #3b82f6;
		transform: scale(1.25);
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
	
	.link.disabled {
		color: #9ca3af;
	}
</style>
