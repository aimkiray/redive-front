<template>
    <div>
        <aplayer
                @timeupdate="timeUpdate"
                @canplay="genWave"
                @listSwitch="needGenWave = true"
                :audio="audioList"
                :lrcType="3"
                ref="aplayer"
                fixed/>

        <el-row class="audio-player">

            <div id="wave-timeline"></div>
            <div id="waveform"></div>

            <el-col :xs="0" :sm="6"><p></p></el-col>
            <el-col :xs="24" :sm="12">
                <div class="grid-content">
                    <el-button round v-on:click="playCurrent">Play</el-button>
                    <el-button round v-on:click="pauseCurrent">Pause</el-button>
                    <el-button round v-on:click="markA">A</el-button>
                    <el-button round v-on:click="markB">B</el-button>
                    <el-button round v-on:click="proceedCurrent">Proceed</el-button>
                </div>
                <div class="grid-content">
                    <el-divider v-if="!(bMark.length === 0)">Loop</el-divider>
                    <el-button v-for="(mark, index) in bMark" v-bind:key="index" v-on:click="loopAB(index)">{{mark}}
                    </el-button>
                </div>
            </el-col>
        </el-row>

    </div>
</template>

<script>
    import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.min.js';
    import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
    import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

    export default {
        name: 'AudioPlayer',
        data() {
            return {
                audioList: [],
                aMark: [],
                bMark: [],
                regions: [],
                isRecord: 0,
                isLoop: 0,
                loopIndex: 0,
                realPlayTime: 0,
                lastPlayTime: 0,
                needGenWave: true,
            }
        },
        mounted() {
            this.$axios.get("/audio").then(res => {
                if (res.data.code === 1) {
                    const audioRaw = res.data.data;
                    for (let i = 0, len = audioRaw.length; i < len; i++) {
                        const audioID = audioRaw[i].id;
                        // 生成文件下载链接
                        audioRaw[i].url = this.getDownloadURL(audioID, "audio", audioRaw[i].audio);
                        audioRaw[i].cover = this.getDownloadURL(audioID, "cover", audioRaw[i].cover);
                        audioRaw[i].lrc = this.getDownloadURL(audioID, "lrc", audioRaw[i].lrc);
                        audioRaw[i].tlrc = this.getDownloadURL(audioID, "tlrc", audioRaw[i].tlrc);
                    }
                    this.audioList = audioRaw
                } else {
                    this.$message({
                        showClose: true,
                        message: "音频加载失败，内部错误。",
                        type: "error"
                    });
                }
            }).catch(err => {
                this.$message({showClose: true, message: '音频加载失败。' + err, type: 'error'});
            });

            this.$nextTick(() => {
                this.wavesurfer = WaveSurfer.create({
                    container: '#waveform',
                    height: 100,
                    pixelRatio: 1,
                    scrollParent: true,
                    normalize: true,
                    minimap: true,
                    backend: 'MediaElement',
                    autoplay: true,
                    playbackRate: this.audioElt.playbackRate,
                    volume: this.audioElt.volume,
                    plugins: [
                        RegionsPlugin.create(),
                        MinimapPlugin.create({
                            height: 30,
                            waveColor: '#ddd',
                            progressColor: '#999',
                            cursorColor: '#999'
                        }),
                        TimelinePlugin.create({
                            container: '#wave-timeline'
                        })
                    ]
                });
            })
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
            }
        },
        methods: {
            playCurrent: function () {
                this.aplayer.play();
            },
            pauseCurrent: function () {
                this.aplayer.pause();
            },
            proceedCurrent: function () {
                if (this.isRecord) {
                    // Delete record A
                    this.aMark.pop();
                } else {
                    this.aplayer.seek(this.lastPlayTime);
                }
                this.isLoop = 0;
            },
            markA: function () {
                if (this.isLoop) {
                    this.isLoop = 0;
                    // Seek to last played time
                    this.aplayer.seek(this.lastPlayTime);
                }
                // Record loop start time
                // If user clicked too much
                if (this.isRecord) {
                    // Delete one
                    this.aMark.pop();
                }
                this.aMark.push(this.realPlayTime);
                this.isRecord = 1;
            },
            markB: function () {
                // Record loop end time
                // Already clicked start and After time A
                if (this.isRecord && this.realPlayTime > this.aMark[this.aMark.length - 1]) {
                    let nowTime = this.realPlayTime;
                    this.bMark.push(nowTime);
                    // Last played time
                    if (nowTime > this.lastPlayTime) {
                        this.lastPlayTime = nowTime
                    }
                    // Last loop index
                    this.loopIndex = this.bMark.length - 1;
                    this.isLoop = 1;
                    this.isRecord = 0;
                }
            },
            loopAB: function (index) {
                if (this.realPlayTime > this.lastPlayTime) {
                    this.lastPlayTime = this.realPlayTime;
                }
                this.aplayer.seek(this.aMark[index]);
                this.loopIndex = index;
                this.isLoop = 1;
            },
            getDownloadURL(id, type, path) {
                if (path !== "") {
                    if (path.indexOf("http") === -1) {
                        return this.baseURL + "/audio/download/" + id + "/" + type
                    } else {
                        return path
                    }
                }
                return ""
            },
            timeUpdate: function () {
                // Update current play time
                this.realPlayTime = this.audioElt.currentTime;
                // Execute loop
                if (this.isLoop && this.realPlayTime >= this.bMark[this.loopIndex]) {
                    this.aplayer.seek(this.aMark[this.loopIndex])
                }
            },
            genWave() {
                if (this.needGenWave) {
                    this.wavesurfer.load(this.audioElt.audio);
                    this.needGenWave = false;

                    /* Regions */


                    this.wavesurfer.enableDragSelection({
                        color: this.randomColor(0.1)
                    });

                    if (localStorage.regions) {
                        this.loadRegions(JSON.parse(localStorage.regions));
                    } else {
                        // loadRegions(
                        //     extractRegions(
                        //         this.wavesurfer.backend.getPeaks(512),
                        //         this.wavesurfer.getDuration()
                        //     )
                        // );
                        this.wavesurfer.util
                            .ajax({
                                responseType: 'json',
                                url: 'annotations.json'
                            })
                            .on('success', function (data) {
                                this.loadRegions(data);
                                this.saveRegions();
                            });
                    }

                    this.wavesurfer.on('region-click', function (region, e) {
                        e.stopPropagation();
                        // Play on click, loop on shift click
                        e.shiftKey ? region.playLoop() : region.play();
                    });
                    this.wavesurfer.on('region-click', this.editAnnotation);
                    this.wavesurfer.on('region-updated', this.saveRegions);
                    this.wavesurfer.on('region-removed', this.saveRegions);
                    this.wavesurfer.on('region-in', this.showNote);

                    this.wavesurfer.on('region-play', function (region) {
                        region.once('out', function () {
                            this.wavesurfer.play(region.start);
                            this.wavesurfer.pause();
                        });
                    });

                    /* Toggle play/pause buttons. */
                    const playButton = document.querySelector('#play');
                    const pauseButton = document.querySelector('#pause');
                    this.wavesurfer.on('play', function () {
                        playButton.style.display = 'none';
                        pauseButton.style.display = '';
                    });
                    this.wavesurfer.on('pause', function () {
                        playButton.style.display = '';
                        pauseButton.style.display = 'none';
                    });
                }
            },
            /**
             * Save annotations to localStorage.
             */
            saveRegions() {
                localStorage.regions = JSON.stringify(
                    Object.keys(this.wavesurfer.regions.list).map(function (id) {
                        const region = this.wavesurfer.regions.list[id];
                        return {
                            start: region.start,
                            end: region.end,
                            attributes: region.attributes,
                            data: region.data
                        };
                    })
                );
            },
            /**
             * Load regions from localStorage.
             */
            loadRegions(regions) {
                regions.forEach(function (region) {
                    region.color = this.randomColor(0.1);
                    this.wavesurfer.addRegion(region);
                });
            },
            /**
             * Extract regions separated by silence.
             */
            extractRegions(peaks, duration) {
                // Silence params
                let minValue = 0.0015;
                let minSeconds = 0.25;

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
             * Random RGBA color.
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
             * Edit annotation for a region.
             */
            editAnnotation(region) {
                const form = document.forms.edit;
                form.style.opacity = 1;
                (form.elements.start.value = Math.round(region.start * 10) / 10),
                    (form.elements.end.value = Math.round(region.end * 10) / 10);
                form.elements.note.value = region.data.note || '';
                form.onsubmit = function (e) {
                    e.preventDefault();
                    region.update({
                        start: form.elements.start.value,
                        end: form.elements.end.value,
                        data: {
                            note: form.elements.note.value
                        }
                    });
                    form.style.opacity = 0;
                };
                form.onreset = function () {
                    form.style.opacity = 0;
                    form.dataset.region = null;
                };
                form.dataset.region = region.id;
            },
            /**
             * Display annotation.
             */
            showNote(region) {
                if (!this.showNote.el) {
                    this.showNote.el = document.querySelector('#subtitle');
                }
                this.showNote.el.textContent = region.data.note || '–';
            },
        },
    };

</script>

<style lang="scss" scoped>
    .audio-player {
        margin-top: 60px;
    }

    .grid-content {
        margin: 0 0 1rem;
    }

</style>
