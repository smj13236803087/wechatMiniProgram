"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_chinaRegions = require("../../utils/china-regions.js");
const _sfc_main = {
  data() {
    return {
      addresses: [],
      loading: true,
      error: "",
      showForm: false,
      editingId: null,
      submitting: false,
      formData: {
        recipient: "",
        phone: "",
        country: "中国",
        province: "",
        city: "",
        district: "",
        detail: "",
        postalCode: "",
        tag: "",
        isDefault: false
      },
      tagOptions: [
        { value: "家", icon: "🏠" },
        { value: "公司", icon: "🏢" },
        { value: "学校", icon: "🏫" }
      ],
      CHINA_REGIONS: utils_chinaRegions.CHINA_REGIONS
    };
  },
  computed: {
    provinceOptions() {
      return this.CHINA_REGIONS;
    },
    provinceIndex() {
      const index = this.CHINA_REGIONS.findIndex((p) => p.name === this.formData.province);
      return index >= 0 ? index : 0;
    },
    selectedProvince() {
      return this.CHINA_REGIONS.find((p) => p.name === this.formData.province);
    },
    cityOptions() {
      if (!this.selectedProvince || !this.selectedProvince.children) {
        return [];
      }
      return this.selectedProvince.children;
    },
    cityIndex() {
      if (!this.selectedProvince)
        return 0;
      const index = this.cityOptions.findIndex((c) => c.name === this.formData.city);
      return index >= 0 ? index : 0;
    },
    selectedCity() {
      return this.cityOptions.find((c) => c.name === this.formData.city);
    },
    districtOptions() {
      if (!this.selectedCity || !this.selectedCity.children) {
        return [];
      }
      return this.selectedCity.children;
    },
    districtIndex() {
      if (!this.selectedCity)
        return 0;
      const index = this.districtOptions.findIndex((d) => d.name === this.formData.district);
      return index >= 0 ? index : 0;
    }
  },
  onLoad() {
    this.fetchAddresses();
  },
  onShow() {
    if (!this.showForm) {
      this.fetchAddresses();
    }
  },
  methods: {
    async fetchAddresses() {
      this.loading = true;
      this.error = "";
      try {
        const res = await utils_api.addressAPI.getAddresses();
        this.addresses = res.addresses || [];
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/address/address.vue:323", "获取地址列表失败:", err);
        if (err.message && err.message.includes("401")) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.navigateTo({
              url: "/pages/login/login"
            });
          }, 1500);
        } else {
          this.error = err.message || "获取地址列表失败";
        }
      } finally {
        this.loading = false;
      }
    },
    showAddForm() {
      this.editingId = null;
      this.formData = {
        recipient: "",
        phone: "",
        country: "中国",
        province: "",
        city: "",
        district: "",
        detail: "",
        postalCode: "",
        tag: "",
        isDefault: false
      };
      this.showForm = true;
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
        postalCode: address.postalCode || "",
        tag: address.tag || "",
        isDefault: address.isDefault
      };
      this.editingId = address.id;
      this.showForm = true;
    },
    handleCancel() {
      this.showForm = false;
      this.editingId = null;
      this.formData = {
        recipient: "",
        phone: "",
        country: "中国",
        province: "",
        city: "",
        district: "",
        detail: "",
        postalCode: "",
        tag: "",
        isDefault: false
      };
    },
    onProvinceChange(e) {
      const index = parseInt(e.detail.value);
      const province = this.CHINA_REGIONS[index];
      this.formData.province = province.name;
      this.formData.city = "";
      this.formData.district = "";
    },
    onCityChange(e) {
      const index = parseInt(e.detail.value);
      const city = this.cityOptions[index];
      this.formData.city = city.name;
      this.formData.district = "";
    },
    onDistrictChange(e) {
      const index = parseInt(e.detail.value);
      const district = this.districtOptions[index];
      this.formData.district = district.name;
    },
    toggleTag(tagValue) {
      this.formData.tag = this.formData.tag === tagValue ? "" : tagValue;
    },
    onDefaultChange(e) {
      this.formData.isDefault = e.detail.value.length > 0;
    },
    async handleSubmit() {
      if (!this.formData.recipient.trim()) {
        common_vendor.index.showToast({
          title: "请输入收件人姓名",
          icon: "none"
        });
        return;
      }
      if (!this.formData.phone.trim()) {
        common_vendor.index.showToast({
          title: "请输入手机号码",
          icon: "none"
        });
        return;
      }
      if (!this.formData.province || !this.formData.city || !this.formData.district) {
        common_vendor.index.showToast({
          title: "请选择完整的省市区信息",
          icon: "none"
        });
        return;
      }
      if (!this.formData.detail.trim()) {
        common_vendor.index.showToast({
          title: "请输入详细地址",
          icon: "none"
        });
        return;
      }
      this.submitting = true;
      try {
        if (this.editingId) {
          await utils_api.addressAPI.updateAddress(this.editingId, this.formData);
          common_vendor.index.showToast({
            title: "更新成功",
            icon: "success"
          });
        } else {
          await utils_api.addressAPI.createAddress(this.formData);
          common_vendor.index.showToast({
            title: "添加成功",
            icon: "success"
          });
        }
        await this.fetchAddresses();
        this.handleCancel();
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/address/address.vue:472", "保存地址失败:", err);
        common_vendor.index.showToast({
          title: err.message || "保存失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.submitting = false;
      }
    },
    async handleSetDefault(id) {
      try {
        await utils_api.addressAPI.updateAddress(id, { isDefault: true });
        common_vendor.index.showToast({
          title: "设置成功",
          icon: "success"
        });
        await this.fetchAddresses();
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/address/address.vue:492", "设置默认地址失败:", err);
        common_vendor.index.showToast({
          title: err.message || "设置失败",
          icon: "none"
        });
      }
    },
    async handleDelete(id) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个地址吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_api.addressAPI.deleteAddress(id);
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
              await this.fetchAddresses();
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/address/address.vue:514", "删除地址失败:", err);
              common_vendor.index.showToast({
                title: err.message || "删除失败",
                icon: "none"
              });
            }
          }
        }
      });
    },
    getTagIcon(tag) {
      const tagOption = this.tagOptions.find((t) => t.value === tag);
      return tagOption ? tagOption.icon : "📍";
    },
    getTagClass(tag) {
      const tagMap = {
        "家": "tag-home",
        "公司": "tag-company",
        "学校": "tag-school"
      };
      return tagMap[tag] || "";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.showForm
  }, !$data.showForm ? {
    b: common_vendor.o((...args) => $options.showAddForm && $options.showAddForm(...args))
  } : {}, {
    c: $data.loading
  }, $data.loading ? {} : $data.error ? {
    e: common_vendor.t($data.error),
    f: common_vendor.o((...args) => $options.fetchAddresses && $options.fetchAddresses(...args))
  } : $data.showForm ? {
    h: common_vendor.t($data.editingId ? "编辑地址" : "新增地址"),
    i: $data.formData.recipient,
    j: common_vendor.o(($event) => $data.formData.recipient = $event.detail.value),
    k: $data.formData.phone,
    l: common_vendor.o(($event) => $data.formData.phone = $event.detail.value),
    m: common_vendor.t($data.formData.province || "请选择省份"),
    n: common_vendor.n($data.formData.province ? "" : "picker-placeholder"),
    o: $options.provinceOptions,
    p: $options.provinceIndex,
    q: common_vendor.o((...args) => $options.onProvinceChange && $options.onProvinceChange(...args)),
    r: common_vendor.t($data.formData.city || "请选择城市"),
    s: common_vendor.n($data.formData.city ? "" : "picker-placeholder"),
    t: !$options.selectedProvince ? 1 : "",
    v: $options.cityOptions,
    w: $options.cityIndex,
    x: !$options.selectedProvince,
    y: common_vendor.o((...args) => $options.onCityChange && $options.onCityChange(...args)),
    z: common_vendor.t($data.formData.district || "请选择区/县"),
    A: common_vendor.n($data.formData.district ? "" : "picker-placeholder"),
    B: !$options.selectedCity ? 1 : "",
    C: $options.districtOptions,
    D: $options.districtIndex,
    E: !$options.selectedCity,
    F: common_vendor.o((...args) => $options.onDistrictChange && $options.onDistrictChange(...args)),
    G: $data.formData.detail,
    H: common_vendor.o(($event) => $data.formData.detail = $event.detail.value),
    I: $data.formData.postalCode,
    J: common_vendor.o(($event) => $data.formData.postalCode = $event.detail.value),
    K: common_vendor.f($data.tagOptions, (tag, k0, i0) => {
      return {
        a: common_vendor.t(tag.icon),
        b: common_vendor.t(tag.value),
        c: tag.value,
        d: $data.formData.tag === tag.value ? 1 : "",
        e: common_vendor.o(($event) => $options.toggleTag(tag.value), tag.value)
      };
    }),
    L: $data.formData.isDefault,
    M: common_vendor.o((...args) => $options.onDefaultChange && $options.onDefaultChange(...args)),
    N: common_vendor.o((...args) => $options.handleCancel && $options.handleCancel(...args)),
    O: common_vendor.t($data.submitting ? "保存中..." : "保存地址"),
    P: $data.submitting,
    Q: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args))
  } : common_vendor.e({
    R: $data.addresses.length === 0
  }, $data.addresses.length === 0 ? {
    S: common_vendor.o((...args) => $options.showAddForm && $options.showAddForm(...args))
  } : {
    T: common_vendor.f($data.addresses, (address, k0, i0) => {
      return common_vendor.e({
        a: address.isDefault
      }, address.isDefault ? {} : {}, {
        b: address.tag
      }, address.tag ? {
        c: common_vendor.t($options.getTagIcon(address.tag)),
        d: common_vendor.t(address.tag),
        e: common_vendor.n($options.getTagClass(address.tag))
      } : {}, {
        f: common_vendor.t(address.recipient),
        g: common_vendor.t(address.phone),
        h: common_vendor.t(address.country),
        i: common_vendor.t(address.province),
        j: common_vendor.t(address.city),
        k: common_vendor.t(address.district),
        l: common_vendor.t(address.detail),
        m: address.postalCode
      }, address.postalCode ? {
        n: common_vendor.t(address.postalCode)
      } : {}, {
        o: !address.isDefault
      }, !address.isDefault ? {
        p: common_vendor.o(($event) => $options.handleSetDefault(address.id), address.id)
      } : {}, {
        q: common_vendor.o(($event) => $options.handleEdit(address), address.id),
        r: common_vendor.o(($event) => $options.handleDelete(address.id), address.id),
        s: address.id,
        t: address.isDefault ? 1 : ""
      });
    })
  }), {
    d: $data.error,
    g: $data.showForm
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-40ca010a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/address/address.js.map
