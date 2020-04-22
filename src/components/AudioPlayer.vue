<template>
    <div>

        <el-row class="audio-title-container">
            <el-select class="playlist-select" v-model="playlistID" @change="getAudio">
                <el-option
                        v-for="item in this.playlistData"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id">
                </el-option>
            </el-select>
            <span class="audio-title">{{ currentName }}</span>
        </el-row>

        <div class="waveform-container">

            <div class="wave-timeline" id="wave-timeline"></div>
            <div class="waveform" id="waveform"></div>

        </div>

        <el-row class="audio-player-control">

            <el-col :xs="24" :sm="12">

                <el-row>
                    <el-col :sm="24" :md="10">
                        <el-button v-if="!isPlayed" round @click="audioControl">播放</el-button>
                        <el-button v-if="isPlayed" round @click="audioControl">暂停</el-button>
                        <el-button round v-if="isLoop" @click="loopControl">单次</el-button>
                        <el-button round v-if="!isLoop" @click="loopControl">循环</el-button>
                        <div style="display: inline-block;margin-left: 10px" v-if="regionForm.end">
                            <el-popover
                                    placement="bottom"
                                    width="260"
                                    trigger="click"
                                    @after-leave="resetRegionPopover"
                                    ref="regionPopover">
                                <el-form :model="regionForm"
                                         ref="regionForm"
                                         label-width="40px"
                                         label-position="top"
                                         class="region-form-container">
                                    <el-row :gutter="10">
                                        <el-col :sm="12">
                                            <el-form-item label="Start" size="mini">
                                                <el-input-number
                                                        v-model="regionForm.start"
                                                        style="display: block"
                                                        controls-position="right"
                                                        :precision="1"
                                                        :step="0.1">
                                                </el-input-number>
                                            </el-form-item>
                                        </el-col>
                                        <el-col :sm="12">
                                            <el-form-item label="End" size="mini">
                                                <el-input-number
                                                        v-model="regionForm.end"
                                                        style="display: block"
                                                        controls-position="right"
                                                        :precision="1"
                                                        :step="0.1">
                                                </el-input-number>
                                            </el-form-item>
                                        </el-col>
                                    </el-row>
                                    <el-form-item label="Note" size="mini">
                                        <el-input
                                                type="textarea"
                                                v-model="regionForm.note"
                                                rows="4">
                                        </el-input>
                                    </el-form-item>
                                </el-form>
                                <div style="text-align: right; margin: 0">
                                    <el-button size="mini" type="error" @click="deleteRegion">删除</el-button>
                                    <el-button size="mini" type="primary" @click="editRegion">保存</el-button>
                                </div>
                                <el-button round slot="reference">修改</el-button>
                            </el-popover>
                        </div>
                    </el-col>

                    <el-col :sm="24" :md="14" class="loop-button">
                        <el-button round @click="markA">A</el-button>
                        <el-button round @click="markB">B</el-button>
                        <el-button round @click="genRegions">自动断句</el-button>
                    </el-col>
                </el-row>

                <el-row style="margin-top: 20px">
                    <el-button round @click="loadRegions">读档</el-button>
                    <el-button round @click="saveWaveData">存档</el-button>
                    <el-button round @click="clearRegions">重置</el-button>
                </el-row>

                <el-row class="region-note" v-if="currentNote !== ''">
                    <div style="font-size: 18px; margin-bottom: 2px">Note</div>
                    <el-card shadow="hover">
                        {{ currentNote }}
                    </el-card>
                </el-row>

            </el-col>

            <el-col :xs="24" :sm="12">
                <div v-if="(!isList && !isLyric) || this.audioList.length === 1" v-html="getOthers" class="others-container"></div>
            </el-col>
        </el-row>

        <aplayer
                @canplay="genPlayer"
                @listSwitch="switchAudio"
                @play="isPlayed = true"
                @pause="isPlayed = false"
                @listShow="isList = true"
                @listHide="isList = false"
                @lrcShow="isLyric = true"
                @lrcHide="isLyric = false"
                :audio="audioList"
                :lrcType="3"
                ref="aplayer"
                :autoplay="false"
                fixed
                filled/>

    </div>
</template>

<script>
    import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.js';
    import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
    import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js';

    import marked from 'marked';
    import '../styles/github-markdown.css';

    export default {
        name: 'AudioPlayer',
        data() {
            return {
                playlistID: "",
                playlistData: [],
                audioList: [],
                wavesurfer: null,
                regionForm: {
                    start: "",
                    end: "",
                    note: ""
                },
                regionStart: null,
                regionEnd: null,
                isRecord: false,
                isLoop: false,
                isPlayed: false,
                currentName: "",
                currentTime: 0,
                currentRegion: null,
                currentNote: "",
                realPlayTime: 0,
                lastPlayTime: 0,
                needGenWave: true,
                renderMd: null,
                currentOthers: "",
                marked: null,
                isList: true,
                isLyric: false,
            }
        },
        created() {
            // 获取歌单列表
            this.$axios.get("/playlist").then(res => {
                if (res.data.code === 1 && res.data.data && res.data.data.length !== 0) {
                    this.playlistData = res.data.data;
                    // 默认歌单显示
                    this.playlistID = this.playlistData[0].id;
                }
            });

            // 加载最新的歌单
            this.getAudio()
        },
        mounted() {
            // 初始化波形
            // this.initWave();

            this.renderMd = new marked.Renderer();
            this.marked = marked.setOptions({
                renderer: this.renderMd,
                gfm: true,
                tables: true,
                breaks: false,
                pedantic: false,
                sanitize: false,
                smartLists: true,
                smartypants: false,
                highlight: function (code) {
                    return require("highlight.js").highlightAuto(code).value;
                },
            });
        },
        computed: {
            baseURL() {
                return this.$axios.defaults.baseURL
            },
            audioElt() {
                return this.$refs.aplayer.media
            },
            aplayer() {
                return this.$refs.aplayer
            },
            getOthers() {
                if (this.marked) {
                    return this.marked(this.currentOthers);
                }
                return ""
            },
        },
        methods: {
            getAudio() {
                this.$axios.get("/audio?id=" + this.playlistID).then(res => {
                    if (res.data.code === 1) {
                        const audioRaw = res.data.data;
                        for (let i = 0, len = audioRaw.length; i < len; i++) {
                            const audioID = audioRaw[i].id;
                            // Generate file download link
                            audioRaw[i].url = this.getDownloadURL(audioID, "audio", audioRaw[i].audio);
                            audioRaw[i].cover = this.getDownloadURL(audioID, "cover", audioRaw[i].cover);
                            audioRaw[i].lrc = this.getDownloadURL(audioID, "lrc", audioRaw[i].lrc);
                            audioRaw[i].tlrc = this.getDownloadURL(audioID, "tlrc", audioRaw[i].tlrc);
                        }
                        this.aplayer.currentMusic.peaks = null
                        this.aplayer.currentMusic.duration = null
                        this.audioList = audioRaw
                        this.needGenWave = true;
                    } else {
                        this.$message({
                            showClose: true,
                            message: "空空如也。" + res.data.msg,
                            type: "info"
                        });
                    }
                }).catch(err => {
                    this.$message({showClose: true, message: '音频加载失败。' + err, type: 'error'});
                });
            },
            switchAudio() {
                this.currentNote = "";
                // 清空 Regions，生成波形
                this.clearRegions();
                this.needGenWave = true;
            },
            audioControl() {
                if (this.isPlayed) {
                    this.wavesurfer.pause();
                } else {
                    this.wavesurfer.play();
                }
            },
            loopControl() {
                this.isLoop = !this.isLoop
            },
            markA() {
                this.regionStart = this.audioElt.currentTime
                this.wavesurfer.play();
            },
            markB() {
                if (this.regionStart !== null) {
                    this.wavesurfer.addRegion({
                        start: this.regionStart,
                        end: this.audioElt.currentTime,
                        data: {
                            note: ""
                        }
                    });
                    this.wavesurfer.play(this.regionStart);
                    this.regionStart = null;
                }
            },
            regionLoop() {
                // Execute loop
                this.wavesurfer.play(this.currentRegion.start);
                this.currentRegion.once('out', () => {
                    // Update current play time
                    this.realPlayTime = this.audioElt.currentTime;
                    if (this.isLoop) {
                        return this.regionLoop()
                    } else if (
                        this.realPlayTime <= this.currentRegion.end &&
                        this.realPlayTime >= this.currentRegion.start
                    ) {
                        this.wavesurfer.pause();
                        // this.resetRegionPopover();
                    }
                });
            },
            genPlayer() {
                this.currentName = this.aplayer.currentMusic.name;
                this.currentOthers = this.aplayer.currentMusic.others;
                if (this.needGenWave) {
                    this.needGenWave = false;
                    this.genWave()
                }
            },
            initWave() {
                this.wavesurfer = WaveSurfer.create({
                    container: '#waveform',
                    height: 150,
                    pixelRatio: 1,
                    barWidth: 1,
                    barGap: 2,
                    cursorWidth: 2,
                    cursorColor: "#000",
                    progressColor: "#7FCCD9",
                    scrollParent: true,
                    normalize: true,
                    backend: 'MediaElement',
                    autoplay: false,
                    removeMediaElementOnDestroy: true,
                    reloadMediaElement: true,
                    loopSelection: false,
                    playbackRate: this.audioElt.playbackRate,
                    volume: this.audioElt.volume,
                    plugins: [
                        RegionsPlugin.create(),
                        MinimapPlugin.create({
                            height: 30,
                            waveColor: '#ddd',
                            progressColor: '#7FCCD9',
                            cursorColor: '#7FCCD9'
                        }),
                        TimelinePlugin.create({
                            container: '#wave-timeline'
                        })
                    ]
                });
            },
            genWave() {
                if (this.wavesurfer !== null) {
                    // 踢掉现有连接
                    this.wavesurfer.cancelAjax();

                    // 当场去世
                    this.wavesurfer.destroy();
                }

                // 开始新的...
                this.initWave();
                if (this.aplayer.currentMusic.peaks && this.aplayer.currentMusic.duration) {
                    this.wavesurfer.load(
                        this.audioElt.audio,
                        JSON.parse(this.aplayer.currentMusic.peaks),
                        null,
                        JSON.parse(this.aplayer.currentMusic.duration)
                    );
                    // this.wavesurfer.initPlugin('minimap')
                    // this.isShowWave = true;
                } else {
                    this.wavesurfer.load(this.audioElt.audio);
                }

                // this.wavesurfer.on('loading', progress => {
                //     // eslint-disable-next-line no-console
                //     console.log(progress)
                // });
                //
                // this.wavesurfer.on('waveform-ready', () => {
                //     this.isShowWave = true;
                // });

                this.wavesurfer.enableDragSelection({
                    color: this.randomColor(0.1)
                });

                // load exist regions
                this.loadRegions();

                this.wavesurfer.on('region-click', (region, e) => {
                    this.currentRegion = region;
                    this.showEditor();
                    e.stopPropagation();
                    // Play on click, loop on ctrl click
                    // e.ctrlKey ? region.playLoop(region.start) : region.play(region.start);
                    // e.ctrlKey ? this.isLoop = true : this.isLoop = false;
                    if (e.ctrlKey)
                        this.isLoop = true;
                    this.regionLoop()
                });
                this.wavesurfer.on('region-in', this.showNote);
            },
            /**
             * Save data to server
             */
            saveWaveData() {
                const regions = this.wavesurfer.regions.list;
                // 保存复读区间
                this.aplayer.currentMusic.regions = JSON.stringify(
                    Object.keys(regions).map(function (id) {
                        const region = regions[id];
                        return {
                            start: region.start,
                            end: region.end,
                            attributes: region.attributes,
                            data: region.data
                        };
                    })
                );
                // 保存波形数据
                this.aplayer.currentMusic.peaks = JSON.stringify(this.wavesurfer.backend.getPeaks(this.wavesurfer.getDuration() * 2));
                this.aplayer.currentMusic.duration = JSON.stringify(this.wavesurfer.backend.getDuration());
                this.$axios.put("/audio/data" +
                    "?token=" + localStorage.getItem("token"), {
                    id: this.aplayer.currentMusic.id,
                    regions: this.aplayer.currentMusic.regions,
                    peaks: this.aplayer.currentMusic.peaks,
                    duration: this.aplayer.currentMusic.duration,
                }).then(res => {
                    if (res.data.code === 1) {
                        this.$message({
                            showClose: true,
                            message: "保存成功。",
                            type: "success"
                        });
                    }
                }).catch(err => {
                    this.$message({
                        showClose: true,
                        message: "保存失败。" + err,
                        type: "success"
                    });
                })
            },
            /**
             * Load regions from server
             */
            loadRegions() {
                if (this.aplayer.currentMusic.regions) {
                    this.setRegions(JSON.parse(this.aplayer.currentMusic.regions));
                }
            },
            setRegions(regions) {
                regions.forEach(region => {
                    region.color = this.randomColor(0.1);
                    this.wavesurfer.addRegion(region);
                });
            },
            clearRegions() {
                this.wavesurfer.clearRegions();
            },
            deleteRegion() {
                if (this.wavesurfer.regions.list) {
                    this.wavesurfer.regions.list[this.currentRegion.id].remove();
                }
                this.resetRegionPopover()
            },
            /**
             * Edit annotation for a region
             */
            showEditor() {
                this.regionForm.start = Math.round(this.currentRegion.start * 10) / 10;
                this.regionForm.end = Math.round(this.currentRegion.end * 10) / 10;
                this.regionForm.note = this.currentRegion.data.note || '';
            },
            editRegion() {
                this.currentRegion.update({
                    start: this.regionForm.start,
                    end: this.regionForm.end,
                    data: {
                        note: this.regionForm.note
                    }
                });
                this.currentNote = this.regionForm.note;
                this.resetRegionPopover()
            },
            resetRegionPopover() {
                document.querySelector("#app").click();
                this.regionForm = {
                    start: "",
                    end: "",
                    note: ""
                };
            },
            genRegions() {
                const regions = this.extractRegions(
                    this.wavesurfer.backend.getPeaks(this.wavesurfer.getDuration() * 2),
                    this.wavesurfer.getDuration()
                );
                this.setRegions(regions)
            },
            /**
             * Extract regions separated by silence
             */
            extractRegions(peaks, duration) {
                // Silence params
                let minValue = 0.0015;
                let minSeconds = 0.5;

                let length = peaks.length;
                let coef = duration / length;
                let minLen = minSeconds / coef;

                // Gather silence indeces
                let silences = [];
                Array.prototype.forEach.call(peaks, function (val, index) {
                    if (Math.abs(val) <= minValue) {
                        silences.push(index);
                    }
                });

                // Cluster silence values
                let clusters = [];
                silences.forEach(function (val, index) {
                    if (clusters.length && val == silences[index - 1] + 1) {
                        clusters[clusters.length - 1].push(val);
                    } else {
                        clusters.push([val]);
                    }
                });

                // Filter silence clusters by minimum length
                let fClusters = clusters.filter(function (cluster) {
                    return cluster.length >= minLen;
                });

                // Create regions on the edges of silences
                let regions = fClusters.map(function (cluster, index) {
                    let next = fClusters[index + 1];
                    return {
                        start: cluster[cluster.length - 1],
                        end: next ? next[0] : length - 1
                    };
                });

                // Add an initial region if the audio doesn't start with silence
                let firstCluster = fClusters[0];
                if (firstCluster && firstCluster[0] != 0) {
                    regions.unshift({
                        start: 0,
                        end: firstCluster[firstCluster.length - 1]
                    });
                }

                // Filter regions by minimum length
                let fRegions = regions.filter(function (reg) {
                    return reg.end - reg.start >= minLen;
                });

                // Return time-based regions
                return fRegions.map(function (reg) {
                    return {
                        start: Math.round(reg.start * coef * 10) / 10,
                        end: Math.round(reg.end * coef * 10) / 10
                    };
                });
            },
            /**
             * Random RGBA color
             */
            randomColor(alpha) {
                return (
                    'rgba(' +
                    [
                        ~~(Math.random() * 255),
                        ~~(Math.random() * 255),
                        ~~(Math.random() * 255),
                        alpha || 1
                    ] +
                    ')'
                );
            },
            /**
             * Display annotation
             */
            showNote(region) {
                this.currentNote = region.data.note || '';
            },
            getDownloadURL(id, type, path) {
                if (path !== undefined && path !== "") {
                    if (path.indexOf("http") === -1) {
                        return this.baseURL + "/audio/download/" + id + "/" + type
                    } else {
                        return path
                    }
                }
                return ""
            }
        },
    };

</script>

<style lang="scss" scoped>
    .audio-player-control {
        padding: 1rem 1rem 0;

        .loop-button {
            margin-top: 20px;

            @media (min-width: 992px) {
                margin-top: 0;
            }
        }

        .region-note {
            margin: 20px 20px 0 0;
        }

        .others-container {
            /*margin-top: 20px;*/
            max-height: 18rem;
            overflow: auto;
        }
    }

    .waveform-container {
        height: 200px;

        .wave-timeline {
            height: 20px;
        }

        .waveform {
            height: 180px;
        }
    }

</style>
