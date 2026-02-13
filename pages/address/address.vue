<template>
	<view class="container">
		<!-- 头部 -->
		<view class="header">
			<view class="header-content">
				<text class="header-title">我的地址</text>
				<text class="header-desc">管理你的收货地址信息</text>
			</view>
			<view v-if="!showForm" class="add-btn" @click="showAddForm">
				<text class="add-icon">+</text>
				<text class="add-text">新增地址</text>
			</view>
		</view>

		<!-- 加载中 -->
		<view v-if="loading" class="loading-container">
			<view class="loading-content">
				<text class="loading-text">加载中...</text>
			</view>
		</view>

		<!-- 错误提示 -->
		<view v-else-if="error" class="error-container">
			<view class="error-content">
				<text class="error-text">{{ error }}</text>
				<button class="retry-btn" @click="fetchAddresses">重试</button>
			</view>
		</view>

		<!-- 地址表单 -->
		<view v-else-if="showForm" class="form-container">
			<view class="form-card">
				<view class="form-title">{{ editingId ? '编辑地址' : '新增地址' }}</view>
				
				<view class="form-item">
					<text class="form-label">收件人姓名 <text class="required">*</text></text>
					<input 
						class="form-input" 
						v-model="formData.recipient" 
						placeholder="请输入收件人姓名"
						maxlength="20"
					/>
				</view>

				<view class="form-item">
					<text class="form-label">手机号码 <text class="required">*</text></text>
					<input 
						class="form-input" 
						v-model="formData.phone" 
						placeholder="请输入手机号码"
						type="number"
						maxlength="11"
					/>
				</view>

				<view class="form-item">
					<text class="form-label">省份 <text class="required">*</text></text>
					<picker 
						mode="selector" 
						:range="provinceOptions" 
						range-key="name"
						:value="provinceIndex"
						@change="onProvinceChange"
					>
						<view class="picker-view">
							<text :class="['picker-text', formData.province ? '' : 'picker-placeholder']">
								{{ formData.province || '请选择省份' }}
							</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>

				<view class="form-item">
					<text class="form-label">城市 <text class="required">*</text></text>
					<picker 
						mode="selector" 
						:range="cityOptions" 
						range-key="name"
						:value="cityIndex"
						:disabled="!selectedProvince"
						@change="onCityChange"
					>
						<view class="picker-view" :class="{ 'picker-disabled': !selectedProvince }">
							<text :class="['picker-text', formData.city ? '' : 'picker-placeholder']">
								{{ formData.city || '请选择城市' }}
							</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>

				<view class="form-item">
					<text class="form-label">区/县 <text class="required">*</text></text>
					<picker 
						mode="selector" 
						:range="districtOptions" 
						range-key="name"
						:value="districtIndex"
						:disabled="!selectedCity"
						@change="onDistrictChange"
					>
						<view class="picker-view" :class="{ 'picker-disabled': !selectedCity }">
							<text :class="['picker-text', formData.district ? '' : 'picker-placeholder']">
								{{ formData.district || '请选择区/县' }}
							</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>

				<view class="form-item">
					<text class="form-label">详细地址 <text class="required">*</text></text>
					<input 
						class="form-input" 
						v-model="formData.detail" 
						placeholder="请输入街道、门牌号等详细地址"
						maxlength="100"
					/>
				</view>

				<view class="form-item">
					<text class="form-label">邮政编码</text>
					<input 
						class="form-input" 
						v-model="formData.postalCode" 
						placeholder="请输入邮政编码（可选）"
						type="number"
						maxlength="6"
					/>
				</view>

				<view class="form-item">
					<text class="form-label">地址标签</text>
					<view class="tag-container">
						<view 
							v-for="tag in tagOptions" 
							:key="tag.value"
							class="tag-item"
							:class="{ 'tag-selected': formData.tag === tag.value }"
							@click="toggleTag(tag.value)"
						>
							<text class="tag-icon">{{ tag.icon }}</text>
							<text class="tag-text">{{ tag.value }}</text>
						</view>
					</view>
				</view>

				<view class="form-item checkbox-item">
					<checkbox-group @change="onDefaultChange">
						<label class="checkbox-label">
							<checkbox :checked="formData.isDefault" value="default" />
							<text class="checkbox-text">设为默认地址</text>
						</label>
					</checkbox-group>
				</view>

				<view class="form-actions">
					<button class="btn-cancel" @click="handleCancel">取消</button>
					<button class="btn-submit" :disabled="submitting" @click="handleSubmit">
						{{ submitting ? '保存中...' : '保存地址' }}
					</button>
				</view>
			</view>
		</view>

		<!-- 地址列表 -->
		<view v-else class="address-list">
			<view v-if="addresses.length === 0" class="empty-container">
				<text class="empty-icon">📍</text>
				<text class="empty-title">还没有收货地址</text>
				<text class="empty-desc">添加你的第一个收货地址吧</text>
				<button class="empty-btn" @click="showAddForm">新增地址</button>
			</view>

			<view v-else class="address-items">
				<view 
					v-for="address in addresses" 
					:key="address.id"
					class="address-item"
					:class="{ 'address-default': address.isDefault }"
				>
					<view class="address-content">
						<view class="address-tags">
							<view v-if="address.isDefault" class="tag-default">
								<text class="tag-icon">⭐</text>
								<text class="tag-text">默认地址</text>
							</view>
							<view v-if="address.tag" class="tag-custom" :class="getTagClass(address.tag)">
								<text class="tag-icon">{{ getTagIcon(address.tag) }}</text>
								<text class="tag-text">{{ address.tag }}</text>
							</view>
						</view>

						<view class="address-info">
							<view class="address-name-phone">
								<text class="address-name">{{ address.recipient }}</text>
								<text class="address-phone">{{ address.phone }}</text>
							</view>
							<view class="address-location">
								<text class="address-region">
									{{ address.country }} {{ address.province }} {{ address.city }} {{ address.district }}
								</text>
								<text class="address-detail">{{ address.detail }}</text>
								<text v-if="address.postalCode" class="address-postal">
									邮编：{{ address.postalCode }}
								</text>
							</view>
						</view>
					</view>

					<view class="address-actions">
						<view 
							v-if="!address.isDefault" 
							class="action-btn action-default"
							@click="handleSetDefault(address.id)"
						>
							<text class="action-icon">⭐</text>
							<text class="action-text">设为默认</text>
						</view>
						<view class="action-btn action-edit" @click="handleEdit(address)">
							<text class="action-icon">✏️</text>
							<text class="action-text">编辑</text>
						</view>
						<view class="action-btn action-delete" @click="handleDelete(address.id)">
							<text class="action-icon">🗑️</text>
							<text class="action-text">删除</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { addressAPI } from '@/utils/api.js'
	import { CHINA_REGIONS } from '@/utils/china-regions.js'

	export default {
		data() {
			return {
				addresses: [],
				loading: true,
				error: '',
				showForm: false,
				editingId: null,
				submitting: false,
				formData: {
					recipient: '',
					phone: '',
					country: '中国',
					province: '',
					city: '',
					district: '',
					detail: '',
					postalCode: '',
					tag: '',
					isDefault: false
				},
				tagOptions: [
					{ value: '家', icon: '🏠' },
					{ value: '公司', icon: '🏢' },
					{ value: '学校', icon: '🏫' }
				],
				CHINA_REGIONS: CHINA_REGIONS
			}
		},
		computed: {
			provinceOptions() {
				return this.CHINA_REGIONS
			},
			provinceIndex() {
				const index = this.CHINA_REGIONS.findIndex(p => p.name === this.formData.province)
				return index >= 0 ? index : 0
			},
			selectedProvince() {
				return this.CHINA_REGIONS.find(p => p.name === this.formData.province)
			},
			cityOptions() {
				if (!this.selectedProvince || !this.selectedProvince.children) {
					return []
				}
				return this.selectedProvince.children
			},
			cityIndex() {
				if (!this.selectedProvince) return 0
				const index = this.cityOptions.findIndex(c => c.name === this.formData.city)
				return index >= 0 ? index : 0
			},
			selectedCity() {
				return this.cityOptions.find(c => c.name === this.formData.city)
			},
			districtOptions() {
				if (!this.selectedCity || !this.selectedCity.children) {
					return []
				}
				return this.selectedCity.children
			},
			districtIndex() {
				if (!this.selectedCity) return 0
				const index = this.districtOptions.findIndex(d => d.name === this.formData.district)
				return index >= 0 ? index : 0
			}
		},
		onLoad() {
			this.fetchAddresses()
		},
		onShow() {
			// 如果从其他页面返回，刷新地址列表
			if (!this.showForm) {
				this.fetchAddresses()
			}
		},
		methods: {
			async fetchAddresses() {
				this.loading = true
				this.error = ''
				try {
					const res = await addressAPI.getAddresses()
					this.addresses = res.addresses || []
				} catch (err) {
					console.error('获取地址列表失败:', err)
					if (err.message && err.message.includes('401')) {
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						})
						setTimeout(() => {
							uni.navigateTo({
								url: '/pages/login/login'
							})
						}, 1500)
					} else {
						this.error = err.message || '获取地址列表失败'
					}
				} finally {
					this.loading = false
				}
			},
			
			showAddForm() {
				this.editingId = null
				this.formData = {
					recipient: '',
					phone: '',
					country: '中国',
					province: '',
					city: '',
					district: '',
					detail: '',
					postalCode: '',
					tag: '',
					isDefault: false
				}
				this.showForm = true
			},
			
			handleEdit(address) {
				this.formData = {
					recipient: address.recipient,
					phone: address.phone,
					country: address.country,
					province: address.province,
					city: address.city,
					district: address.district,
					detail: address.detail,
					postalCode: address.postalCode || '',
					tag: address.tag || '',
					isDefault: address.isDefault
				}
				this.editingId = address.id
				this.showForm = true
			},
			
			handleCancel() {
				this.showForm = false
				this.editingId = null
				this.formData = {
					recipient: '',
					phone: '',
					country: '中国',
					province: '',
					city: '',
					district: '',
					detail: '',
					postalCode: '',
					tag: '',
					isDefault: false
				}
			},
			
			onProvinceChange(e) {
				const index = parseInt(e.detail.value)
				const province = this.CHINA_REGIONS[index]
				this.formData.province = province.name
				this.formData.city = ''
				this.formData.district = ''
			},
			
			onCityChange(e) {
				const index = parseInt(e.detail.value)
				const city = this.cityOptions[index]
				this.formData.city = city.name
				this.formData.district = ''
			},
			
			onDistrictChange(e) {
				const index = parseInt(e.detail.value)
				const district = this.districtOptions[index]
				this.formData.district = district.name
			},
			
			toggleTag(tagValue) {
				this.formData.tag = this.formData.tag === tagValue ? '' : tagValue
			},
			
			onDefaultChange(e) {
				this.formData.isDefault = e.detail.value.length > 0
			},
			
			async handleSubmit() {
				// 验证必填字段
				if (!this.formData.recipient.trim()) {
					uni.showToast({
						title: '请输入收件人姓名',
						icon: 'none'
					})
					return
				}
				if (!this.formData.phone.trim()) {
					uni.showToast({
						title: '请输入手机号码',
						icon: 'none'
					})
					return
				}
				if (!this.formData.province || !this.formData.city || !this.formData.district) {
					uni.showToast({
						title: '请选择完整的省市区信息',
						icon: 'none'
					})
					return
				}
				if (!this.formData.detail.trim()) {
					uni.showToast({
						title: '请输入详细地址',
						icon: 'none'
					})
					return
				}

				this.submitting = true
				try {
					if (this.editingId) {
						await addressAPI.updateAddress(this.editingId, this.formData)
						uni.showToast({
							title: '更新成功',
							icon: 'success'
						})
					} else {
						await addressAPI.createAddress(this.formData)
						uni.showToast({
							title: '添加成功',
							icon: 'success'
						})
					}
					
					await this.fetchAddresses()
					this.handleCancel()
				} catch (err) {
					console.error('保存地址失败:', err)
					uni.showToast({
						title: err.message || '保存失败，请重试',
						icon: 'none',
						duration: 2000
					})
				} finally {
					this.submitting = false
				}
			},
			
			async handleSetDefault(id) {
				try {
					await addressAPI.updateAddress(id, { isDefault: true })
					uni.showToast({
						title: '设置成功',
						icon: 'success'
					})
					await this.fetchAddresses()
				} catch (err) {
					console.error('设置默认地址失败:', err)
					uni.showToast({
						title: err.message || '设置失败',
						icon: 'none'
					})
				}
			},
			
			async handleDelete(id) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个地址吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								await addressAPI.deleteAddress(id)
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								await this.fetchAddresses()
							} catch (err) {
								console.error('删除地址失败:', err)
								uni.showToast({
									title: err.message || '删除失败',
									icon: 'none'
								})
							}
						}
					}
				})
			},
			
			getTagIcon(tag) {
				const tagOption = this.tagOptions.find(t => t.value === tag)
				return tagOption ? tagOption.icon : '📍'
			},
			
			getTagClass(tag) {
				const tagMap = {
					'家': 'tag-home',
					'公司': 'tag-company',
					'学校': 'tag-school'
				}
				return tagMap[tag] || ''
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: #f5f7fa;
		padding-bottom: 40rpx;
	}

	/* 头部 */
	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 60rpx 40rpx 40rpx;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.header-content {
		flex: 1;
	}

	.header-title {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 12rpx;
	}

	.header-desc {
		display: block;
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 24rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 40rpx;
		backdrop-filter: blur(10rpx);
	}

	.add-icon {
		font-size: 32rpx;
		color: #ffffff;
		font-weight: bold;
	}

	.add-text {
		font-size: 28rpx;
		color: #ffffff;
		font-weight: 500;
	}

	/* 加载和错误 */
	.loading-container,
	.error-container {
		padding: 100rpx 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loading-content,
	.error-content {
		text-align: center;
	}

	.loading-text,
	.error-text {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 40rpx;
	}

	.retry-btn {
		padding: 20rpx 40rpx;
		background: #667eea;
		color: #ffffff;
		border-radius: 40rpx;
		font-size: 28rpx;
	}

	/* 表单 */
	.form-container {
		padding: 30rpx;
	}

	.form-card {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 40rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	}

	.form-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 40rpx;
	}

	.form-item {
		margin-bottom: 32rpx;
	}

	.form-label {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 16rpx;
	}

	.required {
		color: #ff4757;
	}

	.form-input {
		width: 100%;
		height: 88rpx;
		padding: 0 24rpx;
		background: #f8f9fa;
		border-radius: 16rpx;
		font-size: 28rpx;
		color: #333;
		box-sizing: border-box;
	}

	.picker-view {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 88rpx;
		padding: 0 24rpx;
		background: #f8f9fa;
		border-radius: 16rpx;
	}

	.picker-disabled {
		opacity: 0.5;
	}

	.picker-text {
		font-size: 28rpx;
		color: #333;
	}

	.picker-placeholder {
		color: #999;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #999;
	}

	.tag-container {
		display: flex;
		gap: 20rpx;
		flex-wrap: wrap;
	}

	.tag-item {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 24rpx;
		background: #f8f9fa;
		border-radius: 40rpx;
		border: 2rpx solid transparent;
	}

	.tag-selected {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-color: transparent;
	}

	.tag-selected .tag-text {
		color: #ffffff;
	}

	.tag-icon {
		font-size: 28rpx;
	}

	.tag-text {
		font-size: 26rpx;
		color: #666;
	}

	.checkbox-item {
		margin-bottom: 0;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.checkbox-text {
		font-size: 28rpx;
		color: #333;
	}

	.form-actions {
		display: flex;
		gap: 24rpx;
		margin-top: 40rpx;
		padding-top: 40rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.btn-cancel,
	.btn-submit {
		flex: 1;
		height: 88rpx;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-cancel {
		background: #f8f9fa;
		color: #666;
	}

	.btn-submit {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
	}

	.btn-submit[disabled] {
		opacity: 0.6;
	}

	/* 地址列表 */
	.address-list {
		padding: 30rpx;
	}

	.empty-container {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 120rpx 40rpx;
		text-align: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	}

	.empty-icon {
		display: block;
		font-size: 120rpx;
		margin-bottom: 32rpx;
	}

	.empty-title {
		display: block;
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 16rpx;
	}

	.empty-desc {
		display: block;
		font-size: 26rpx;
		color: #999;
		margin-bottom: 40rpx;
	}

	.empty-btn {
		display: inline-block;
		padding: 20rpx 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		border-radius: 40rpx;
		font-size: 28rpx;
	}

	.address-items {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}

	.address-item {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 32rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
		border: 2rpx solid transparent;
	}

	.address-default {
		border-color: #667eea;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
	}

	.address-content {
		margin-bottom: 24rpx;
	}

	.address-tags {
		display: flex;
		gap: 16rpx;
		margin-bottom: 20rpx;
		flex-wrap: wrap;
	}

	.tag-default,
	.tag-custom {
		display: inline-flex;
		align-items: center;
		gap: 6rpx;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
	}

	.tag-default {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
	}

	.tag-custom {
		background: #f0f0f0;
		color: #666;
	}

	.tag-home {
		background: #e3f2fd;
		color: #1976d2;
	}

	.tag-company {
		background: #f3e5f5;
		color: #7b1fa2;
	}

	.tag-school {
		background: #e8f5e9;
		color: #388e3c;
	}

	.tag-icon {
		font-size: 20rpx;
	}

	.tag-text {
		font-size: 22rpx;
	}

	.address-info {
		margin-top: 16rpx;
	}

	.address-name-phone {
		display: flex;
		align-items: center;
		gap: 24rpx;
		margin-bottom: 16rpx;
	}

	.address-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.address-phone {
		font-size: 28rpx;
		color: #666;
	}

	.address-location {
		line-height: 1.6;
	}

	.address-region {
		display: block;
		font-size: 28rpx;
		color: #333;
		margin-bottom: 8rpx;
	}

	.address-detail {
		display: block;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 8rpx;
	}

	.address-postal {
		display: block;
		font-size: 24rpx;
		color: #999;
	}

	.address-actions {
		display: flex;
		gap: 16rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.action-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx;
		border-radius: 12rpx;
		background: #f8f9fa;
	}

	.action-default {
		background: #e3f2fd;
	}

	.action-edit {
		background: #f5f5f5;
	}

	.action-delete {
		background: #ffebee;
	}

	.action-icon {
		font-size: 32rpx;
	}

	.action-text {
		font-size: 24rpx;
		color: #666;
	}

	.action-default .action-text {
		color: #1976d2;
	}

	.action-delete .action-text {
		color: #d32f2f;
	}
</style>
