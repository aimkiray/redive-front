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
                <el-menu-item @click="handleUrl('https://github.com/aimkiray/reosu')">
                    <span slot="title">Github</span>
                </el-menu-item>

                <el-menu-item class="top-menu-right" @click="logOut" v-if="showLogOut">
                    <span slot="title">注销</span>
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
            this.$router.push({name: this.activeMenu});
            // Check login status
            this.checkStatus();
        },
        watch: {
            '$route': 'checkToken'
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
                    // this.showLogOut = true
                    this.$axios.get("/check?token=" + localStorage.getItem("token"))
                        .then(res => {
                            if (res.data.code === 1) {
                                this.showLogOut = true
                            }
                            // eslint-disable-next-line no-unused-vars
                        }).catch(error => {
                        this.logOut();
                    })
                }
            },
            checkToken() {
                if (localStorage.getItem('token')) {
                    this.showLogOut = true
                }
            },
            logOut() {
                localStorage.removeItem("token");
                this.$message({
                    showClose: true,
                    message: "level down!",
                    type: "info"
                });
                this.$router.push({name: "user"});
                // this.$store.commit("setActiveMenu", "value");
                this.showLogOut = false;
            },
        },
        computed: {
            baseURL() {
                return this.$axios.defaults.baseURL
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

<style lang="scss" scoped>
    .top-menu-center {
        display: inline-block;
        margin: auto 0;
    }

    .top-menu-right {
        float: right !important;
    }

</style>
