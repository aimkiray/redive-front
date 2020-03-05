<template>
    <el-col :span="12">
        <el-menu
                default-active="2"
                class="el-menu-vertical-demo"
                @open="handleOpen"
                @close="handleClose">
            <el-menu-item index="voice-list">
                <i class="el-icon-document"></i>
                <span slot="title">复读列表</span>
            </el-menu-item>
            <el-menu-item index="add-voice">
                <i class="el-icon-document-add"></i>
                <span slot="title">新增复读</span>
            </el-menu-item>
        </el-menu>

        <router-view></router-view>
    </el-col>
    
</template>

<script>
    export default {
        name: "Admin",
        data() {
            return {

            };
        },
        methods: {
            handleSelect(key, keyPath) {
                // eslint-disable-next-line no-console
                console.log(key, keyPath);
                this.$router.push({
                    name: key
                })
            }
        },
        computed:{
            baseUrl(){
                return this.$store.state.baseUrl
            },
            activeMenu: {
                get(){
                    return this.$store.state.activeMenu;
                },
                set(value){
                    this.$store.commit("setActiveMenu", value);
                }
            }
        },
    }
</script>

<style scoped>

</style>