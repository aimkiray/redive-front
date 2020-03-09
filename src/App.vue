<template>
    <div id="app">
        <el-header>
            <el-menu
                    :default-active="activeMenu"
                    mode="horizontal"
                    router
                    @select="handleSelect">
                <el-menu-item index="audio-player">
                    <span slot="title">复读</span>
                </el-menu-item>
                <el-menu-item index="equipment">
                    <span slot="title">磁带</span>
                </el-menu-item>

                <el-menu-item @click="logOut" v-if="showLogOut">
                    <span slot="title">注销</span>
                </el-menu-item>

                <el-menu-item @click="handleUrl('https://github.com/aimkiray/reosu')">
                    <span slot="title">Github</span>
                </el-menu-item>

            </el-menu>
        </el-header>

        <router-view></router-view>

    </div>
</template>

<script>
    export default {
        name: 'app',
        data() {
            return {
                showLogOut: false,
            };
        },
        created() {
            // Check login status
            this.checkStatus();
        },
        watch: {
            '$route': 'checkStatus'
        },
        methods: {
            handleSelect(key) {
                this.$router.push({
                    name: key
                })
            },
            handleUrl(url) {
                window.open(url, '_blank')
            },
            checkStatus() {
                if (localStorage.getItem('token')) {
                    this.showLogOut = true
                }
            },
            // checkToken() {
            //     this.$axios.get("/check?token=" + localStorage.getItem("token"))
            //         .then(res => {
            //             if (res.data.code === 1) {
            //                 this.showLogOut = true
            //             }
            //         }).catch(error => {
            //             this.logOut();
            //     })
            // },
            logOut() {
                localStorage.removeItem("token");
                this.$message({
                    showClose: true,
                    message: "level down!",
                    type: "warning"
                });
                this.$router.push({name: 'audio-player'});
                this.showLogOut = false;
            },
        },
        computed: {
            baseUrl() {
                return this.$store.state.baseUrl
            },
            activeMenu: {
                get() {
                    return this.$store.state.activeMenu;
                },
                set(value) {
                    this.$store.commit("setActiveMenu", value);
                }
            }
        },
    }
</script>

<style lang="scss">

</style>
