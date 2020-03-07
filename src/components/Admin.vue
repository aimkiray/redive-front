<template>
    <el-row :gutter="10" class="admin-container">
        <el-col :xs="24" :sm="4">
            <el-menu
                    :default-active="activeAdminMenu"
                    mode="vertical"
                    router
                    @select="handleSelect">
                <el-menu-item index="audio-list">
                    <i class="el-icon-document"></i>
                    <span slot="title">磁带盒子</span>
                </el-menu-item>
                <el-menu-item index="audio-editor">
                    <i class="el-icon-document-add"></i>
                    <span slot="title">添加磁带</span>
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
        name: "Admin",
        data() {
            return {

            };
        },
        methods: {
            handleSelect(key) {
                this.$router.push({
                    name: key
                })
            }
        },
        computed:{
            baseUrl(){
                return this.$store.state.baseUrl
            },
            activeAdminMenu: {
                get(){
                    return this.$store.state.activeAdminMenu;
                },
                set(value){
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