<template>
    <div class="lyric-view"
         ref="lyricView"
         @touchstart="onTouchStart"
         @touchmove="onTouchMove"
         @touchend="onTouchEnd">

        <div class="lyric-wrapper"
             ref="lyricWrapper"
             v-if="this.lyric"
             :style="{
                transform: `translate3d(0, ${nowTranslateY}px, 0)`,
                transition: `${isDragging? 'none':`all ease ${lyricScrollTime}ms`}`}">

            <div v-for="(item, index) in allLyric"
                 :key="index"
                 :style="{padding: `${unitDivide(lyricMargin, 2)} 0`}"
                 :class="{
                    [lyricCenterClass]: index === centerLyricIdx,
                    [lyricActiveClass]: index === activeLyricIdx
                }">

                <p :style="{lineHeight: lyricLineheight}">{{item[1]}}</p>
                <p :style="{lineHeight: lyricLineheight}" v-if="item[2]">{{item[2]}}</p>
            </div>
        </div>

        <!-- 拖拽时中间标记 -->
        <div class="center-mark" v-if="isDragging">
            <div class="triangle"
                 :style="{
                    borderColor: `transparent transparent transparent ${triangleColor}`,
                    borderWidth: `${unitDivide(triangleWidth, 1.732)} 0 ${unitDivide(triangleWidth, 1.732)} ${triangleWidth}`}"
                 @click="changeCurrentTime"></div>
            <div class="line" :style="{background: centerLineColor}"></div>
            <div class="target-time" :style="{color: centerTimeColor}">{{allLyric[centerLyricIdx] &&
                timeToStr(allLyric[centerLyricIdx][0])}}
            </div>
        </div>
    </div>
</template>
<script>
    export default {
        name: 'LyricScroll',
        props: {
            currentTime: {
                type: Number,
                required: true
            },
            // 原词，格式为{开始时间: 歌词, ...}
            lyric: {
                type: Object,
                default() {
                    return null
                }
            },
            // 译词，格式为{开始时间: 歌词, ...}
            tLyric: {
                type: Object,
                default() {
                    return null
                }
            },
            // 当前唱到的歌词类名
            lyricActiveClass: String,
            // 拖拽时中间歌词类名
            lyricCenterClass: String,
            // 滚动到目标歌词时间，单位ms
            lyricScrollTime: {
                type: Number,
                default: 400
            },
            // 拖拽结束后隔多长后恢复滚动
            dragendWaitTime: {
                type: Number,
                default: 3000
            },
            // 每句歌词及翻译与下一句歌词及翻译的间隔
            lyricMargin: {
                type: String,
                default: '20px'
            },
            // 每句歌词及翻译行高
            lyricLineheight: {
                type: String,
                default: '1.5em'
            },
            // 拖拽时左边出现的三角形颜色
            triangleColor: {
                type: String,
                default: 'orange'
            },
            // 拖拽时左边出现的等边三角形的高度
            triangleWidth: {
                type: String,
                default: '40px'
            },
            // 拖拽时中间线的颜色
            centerLineColor: {
                type: String,
                default: '#ccc'
            },
            // 拖拽时中间歌词开始时间颜色
            centerTimeColor: {
                type: String,
                default: 'orange'
            }
        },
        mounted() {
            this.nowTranslateY = this.lyricPadding
        },
        data: () => ({
            // 开始接触的clientY
            startClientY: 0,
            // 开始接触的translateY
            startTranslateY: 0,
            // 是否正在拖拽
            isDragging: false,
            // 当前歌词容器滚动的高度
            nowTranslateY: 0,
            // touchend后设置的定时器
            timer: null,
            // 找出当前视野中最接近中间的歌词，返回下标
            centerLyricIdx: -1
        }),
        computed: {
            // 生成原词和译词
            // 格式：[[开始时间, 原词, 译词],...]
            allLyric() {
                let result = [];
                if (this.lyric !== null && this.tLyric !== null) {
                    // 有翻译
                    for (let time in this.lyric) {
                        result.push([
                            Number(time),
                            this.lyric[time],
                            this.tLyric[time]
                        ])
                    }
                } else if (this.lyric !== null) {
                    // 没有翻译
                    for (let time in this.lyric) {
                        result.push([Number(time), this.lyric[time]])
                    }
                } else if (this.tLyric !== null) {
                    // 只有翻译
                    for (let time in this.tLyric) {
                        result.push([Number(time), this.tLyric[time]])
                    }
                }
                return result
            },
            // 每一句歌词的高度
            perLyricHeight() {
                return this.wrapper.querySelector('div:first-child').offsetHeight
            },
            // 每句歌词及其翻译对应的div的offsetTop
            offsetTopList() {
                let resultArr = [];
                let perLyricHeight = this.perLyricHeight;
                let lyricLen = this.wrapper.querySelectorAll('div').length;
                for (let i = 0; i < lyricLen; i++) {
                    resultArr.push(i * perLyricHeight)
                }
                return resultArr
            },
            // 当前高亮的歌词下标（也就是第几句，从0开始）
            activeLyricIdx() {
                let allLyric = this.allLyric;
                let currentTime = this.currentTime;
                for (let i = 0, len = allLyric.length; i < len; i++) {
                    if ((allLyric[i][0] < currentTime)
                        &&
                        (allLyric[i + 1] && allLyric[i + 1][0] > currentTime || !allLyric[i + 1])) {
                        return i
                    }
                }
                return -1
            },
            // 包裹全部歌词的容器
            wrapper() {
                return this.$refs.lyricWrapper
            },
            // 容器的高度
            wrapperHeight() {
                return this.wrapper.offsetHeight
            },
            // 歌词可视区高度
            viewHeight() {
                return this.$refs.lyricView.offsetHeight
            },
            // 歌词滚动到顶部/底部，距容器顶部/底部的距离，也是歌词向下滚动的最大值
            lyricPadding() {
                return this.viewHeight / 2 - this.perLyricHeight / 2
            },
            // nowTranslateY的最小值，也就是歌词向上滚动的最大值
            minTranslateY() {
                return -(
                    this.wrapperHeight -
                    this.lyricPadding -
                    this.perLyricHeight
                )
            }
        },
        methods: {
            // 带单位的字符串除以数字，如60px/2=15px
            unitDivide(unitNum, num) {
                let num1 = parseFloat(unitNum);
                let unit = unitNum.replace(num1, '');
                return `${num1 / num}${unit}`
            },
            // 把秒数转换为xx:xx的形式
            timeToStr(num) {
                num = Math.round(num);
                let second = num % 60;
                let minute = Math.floor(num / 60);
                if (second < 10) {
                    second = '0' + second
                }
                if (minute < 10) {
                    minute = '0' + minute
                }
                return minute + ':' + second
            },
            // 拖拽后点击视野中间左侧三角形更改进度
            changeCurrentTime() {
                this.$emit(
                    'change-current-time',
                    this.allLyric[this.centerLyricIdx][0]
                );
                this.$nextTick(() => {
                    this.isDragging = false
                })
            },
            // 实时获取当前元素的translateY
            getTranslateY(el) {
                let curStyle = window.getComputedStyle(el);
                let curTransform = curStyle.transform || curStyle.webkitTransform;
                return curTransform.split(',')[5].replace(')', '')
            },
            // 更新歌词位置
            updateLyricPos() {
                // 没有拖拽歌词
                if (!this.isDragging) {
                    let scrollTarget = this.offsetTopList[this.activeLyricIdx] - this.lyricPadding;
                    this.nowTranslateY = -scrollTarget
                }
            },
            // 触屏事件
            onTouchStart(e) {
                this.isDragging = true;
                clearTimeout(this.timer);
                this.startClientY = e.touches[0].clientY;
                this.startTranslateY = Number(this.getTranslateY(this.wrapper));
                this.nowTranslateY = this.startTranslateY
            },
            onTouchMove(e) {
                e.preventDefault(); // 防止屏幕跟着滚动
                let clientY = e.touches[0].clientY;
                let targetTranslateY =
                    this.startTranslateY + clientY - this.startClientY;
                if (targetTranslateY > this.lyricPadding) {
                    // 抵达上边界
                    this.nowTranslateY = this.lyricPadding
                } else if (targetTranslateY < this.minTranslateY) {
                    // 移出下边界
                    this.nowTranslateY = this.minTranslateY
                } else {
                    this.nowTranslateY = targetTranslateY;
                    this.centerLyricIdx = this.findCenterLyricIdx()
                }
            },
            onTouchEnd() {
                this.timer = setTimeout(() => {
                    this.isDragging = false;
                    this.centerLyricIdx = -1
                }, this.dragendWaitTime)
            },
            // 找出当前视野中最接近中间的歌词，返回下标
            findCenterLyricIdx() {
                const halfViewHeight = this.viewHeight / 2;
                let offsetTopList = this.offsetTopList;
                let nowTranslateY = this.nowTranslateY;
                for (let i = 0, len = offsetTopList.length; i < len; i++) {
                    let v = offsetTopList[i];
                    if (
                        (nowTranslateY + v < halfViewHeight &&
                            (offsetTopList[i + 1] &&
                                nowTranslateY + offsetTopList[i + 1] >
                                halfViewHeight)) ||
                        !offsetTopList[i + 1]
                    ) {
                        return i
                    }
                }
            }
        },
        watch: {
            currentTime() {
                this.updateLyricPos()
            }
        }
    }
</script>

<style lang="scss" scoped>
    .lyric-view {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;

        .center-mark {
            box-sizing: border-box;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 100%;
            display: flex;
            align-items: center;
            // 拖拽三角形
            .triangle {
                border-style: solid;
            }

            // 中间指示线
            .line {
                flex: 1;
                height: 1px;
                margin: 0 20px;
            }
        }
    }

    .lyric-wrapper {
        transition: ease 0.3s;
        // 每一句歌词及其翻译
        & > div p {
            padding: 0;
            margin: 0;
        }
    }
</style>
