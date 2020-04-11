<template>

    <el-row>
        <el-col :xs="2" :sm="4"><p></p></el-col>
        <el-col :xs="20" :sm="16">
            <el-form class="login-form-container"
                     status-icon
                     ref="userForm"
                     :model="userForm"
                     :rules="userRules"
                     label-position="top"
                     label-width="80px">
                <div class="login-form-title">sudo</div>
                <el-form-item class="login-form-item" label="Username" prop="username">
                    <el-input v-model="userForm.username"></el-input>
                </el-form-item>
                <el-form-item class="login-form-item" label="Password" prop="password">
                    <el-input type="password" v-model="userForm.password"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="login('userForm')">确认</el-button>
                </el-form-item>
            </el-form>
        </el-col>
    </el-row>

</template>

<script>
    export default {
        name: "User",
        data() {
            const validateName = (rule, value, callback) => {
                if (value === '') {
                    callback(new Error('你的名字。'));
                } else {
                    callback();
                }
            };
            const validatePass = (rule, value, callback) => {
                if (value === '') {
                    callback(new Error('你的密码。'));
                } else {
                    callback();
                }
            };
            return {
                userForm: {
                    username: "",
                    password: "",
                },
                userRules: {
                    username: [
                        {validator: validateName, trigger: 'blur'}
                    ],
                    password: [
                        {validator: validatePass, trigger: 'blur'}
                    ]
                }
            }
        },
        methods: {
            login(formName) {
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        this.$axios.get("/login", {
                            params: this.userForm
                        }).then(res => {
                            if (res.data.code === 1) {
                                localStorage.setItem("token", res.data.token);
                                this.$message({
                                    showClose: true,
                                    message: "level up!",
                                    type: "success"
                                });
                                this.$router.push({name: this.$store.state.activeMenu});
                            } else {
                                this.$message({
                                    showClose: true,
                                    message: "登录失败，请检查名字或密码。",
                                    type: "error"
                                })
                            }
                        })
                    } else {
                        return false;
                    }
                });
            }
        },
    }
</script>

<style lang="scss" scoped>
    .login-form-container {
        max-width: 480px;
        padding: 4rem 0 0;
    }

    .login-form-title {
        font-size: xx-large;
        padding: 0 0 1rem;
    }
</style>
