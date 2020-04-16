<template>
    <el-row class="admin-container" :gutter="20">
        <el-col :xs="24" :sm="4">
            <el-menu
                    :default-active="activeAdminMenu"
                    mode="vertical"
                    router
                    @select="handleSelect">
                <el-menu-item index="audio-table">
                    <i class="el-icon-document"></i>
                    <span slot="title">磁带盒子</span>
                </el-menu-item>
                <el-menu-item index="playlist-editor">
                    <i class="el-icon-edit"></i>
                    <span slot="title">管理磁带</span>
                </el-menu-item>
                <el-menu-item index="audio-editor">
                    <i class="el-icon-document-add"></i>
                    <span slot="title">录制磁带</span>
                </el-menu-item>
                <el-menu-item index="batch-import">
                    <i class="el-icon-magic-stick"></i>
                    <span slot="title">批发磁带</span>
                </el-menu-item>
                <el-menu-item index="data-manage">
                    <i class="el-icon-setting"></i>
                    <span slot="title">数据管理</span>
                </el-menu-item>
            </el-menu>
        </el-col>
        <el-col :xs="24" :sm="20">
            <router-view></router-view>
        </el-col>
    </el-row>

</template>

<script>
    export default {
        name: "Equipment",
        data() {
            return {};
        },
        methods: {
            handleSelect(key) {
                this.$router.push({
                    name: key
                })
            }
        },
        computed: {
            activeAdminMenu: {
                get() {
                    return this.$store.state.activeAdminMenu;
                },
                set(value) {
                    this.$store.commit("setActiveAdminMenu", value);
                }
            }
        },
    }
</script>

<style lang="scss" scoped>

    .el-menu {
        border: none;
    }

</style>
