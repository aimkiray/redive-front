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

                <el-menu-item @click="dialogFormVisible = true">
                    <span slot="title">Login</span>
                </el-menu-item>
                <el-menu-item @click="handleUrl('https://github.com/aimkiray/reosu')">
                    <span slot="title">Github</span>
                </el-menu-item>

            </el-menu>
        </el-header>

        <router-view></router-view>

        <el-dialog title="登录" :visible.sync="dialogFormVisible">
            <el-form :model="userForm" class="login-container">
                <el-form-item label="用户名" :label-width="formLabelWidth">
                    <el-input v-model="userForm.name" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="密码" :label-width="formLabelWidth">
                    <el-input v-model="userForm.name" autocomplete="off"></el-input>
                </el-form-item>
                <div>test</div>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="dialogFormVisible = false">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    export default {
        name: 'app',
        data() {
            return {
                userForm: {
                    username: "",
                    password: "",
                },
                adminVisible: false,
                loginVisible: false,
                dialogFormVisible: false,
                formLabelWidth: '80px'
            };
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
            Login() {
                this.$axios.get(this.baseUrl + "/login", {
                    params: this.userForm
                }).then(res => {
                    if (res.data.code === 1) {
                        localStorage.setItem("token", res.data.token);
                        this.loginVisible = false;
                        this.adminVisible = true;
                        this.$message({
                            showClose: true,
                            message: "权限提升",
                            type: "success"
                        })
                    } else {
                        this.message = "登录失败，请检查用户名或密码";
                        this.showAlert = true;
                    }
                })
            }
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

<style lang="scss" scoped>
    .login-container {
        max-width: 480px;
    }

</style>
