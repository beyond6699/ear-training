class ChordTypeTrainer {
    constructor() {
        this.audioContext = null;
        this.currentChord = null;
        this.selectedType = null;
        this.currentDifficulty = 'easy';
        this.score = {
            correct: 0,
            total: 0
        };
        this.chordIntervalChart = null;
        
        // 和弦类型统计
        this.chordTypeStats = {};
        
        // 半音阶音符名称
        this.chromaticNotes = [
            'C', 'C#', 'D', 'D#', 'E', 'F', 
            'F#', 'G', 'G#', 'A', 'A#', 'B'
        ];
        
        // 和弦类型定义（音程关系）
        this.chordTypes = {
            major: {
                name: '大三和弦',
                intervals: [0, 4, 7], // 根音 + 大三度 + 纯五度
                description: '根音 + 大三度 + 纯五度'
            },
            minor: {
                name: '小三和弦',
                intervals: [0, 3, 7], // 根音 + 小三度 + 纯五度
                description: '根音 + 小三度 + 纯五度'
            },
            diminished: {
                name: '减三和弦',
                intervals: [0, 3, 6], // 根音 + 小三度 + 减五度
                description: '根音 + 小三度 + 减五度'
            },
            augmented: {
                name: '增三和弦',
                intervals: [0, 4, 8], // 根音 + 大三度 + 增五度
                description: '根音 + 大三度 + 增五度'
            },
            major7: {
                name: '大七和弦',
                intervals: [0, 4, 7, 11], // 根音 + 大三度 + 纯五度 + 大七度
                description: '根音 + 大三度 + 纯五度 + 大七度'
            },
            minor7: {
                name: '小七和弦',
                intervals: [0, 3, 7, 10], // 根音 + 小三度 + 纯五度 + 小七度
                description: '根音 + 小三度 + 纯五度 + 小七度'
            },
            dominant7: {
                name: '属七和弦',
                intervals: [0, 4, 7, 10], // 根音 + 大三度 + 纯五度 + 小七度
                description: '根音 + 大三度 + 纯五度 + 小七度'
            },
            halfdiminished7: {
                name: '半减七和弦',
                intervals: [0, 3, 6, 10], // 根音 + 小三度 + 减五度 + 小七度
                description: '根音 + 小三度 + 减五度 + 小七度'
            },
            diminished7: {
                name: '减七和弦',
                intervals: [0, 3, 6, 9], // 根音 + 小三度 + 减五度 + 减七度
                description: '根音 + 小三度 + 减五度 + 减七度'
            }
        };
        
        // 根音选择（简单模式固定C，困难模式随机）
        this.rootNotes = {
            easy: [0], // 只有C
            hard: [0, 2, 4, 5, 7, 9, 11] // C D E F G A B
        };
        
        this.initializeElements();
        this.initializeChordTypeStats();
        this.loadStats();
        this.bindEvents();
        
        // 页面加载后直接生成第一题
        setTimeout(() => {
            this.generateNewQuestion();
        }, 100);
    }
    
    initializeElements() {
        this.playChordBtn = document.getElementById('playChord');
        this.playArpeggioBtn = document.getElementById('playArpeggio');
        this.playReferenceBtn = document.getElementById('playReference');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.rootNoteSpan = document.getElementById('rootNote');
        this.chordHintDiv = document.getElementById('chordHint');
        this.chordTypeButtons = document.querySelectorAll('.chord-type-btn');
        this.selectedTypeSpan = document.getElementById('selectedType');
        this.clearSelectionBtn = document.getElementById('clearSelection');
        this.submitAnswerBtn = document.getElementById('submitAnswer');
        this.newQuestionBtn = document.getElementById('newQuestion');
        this.resultDiv = document.getElementById('result');
        this.correctSpan = document.getElementById('correct');
        this.totalSpan = document.getElementById('total');
        this.accuracySpan = document.getElementById('accuracy');
        this.resetStatsBtn = document.getElementById('resetStats');
        this.statsDifficultySelect = document.getElementById('statsDifficulty');
        this.statsGrid = document.getElementById('statsGrid');
        this.chordIntervalChart = document.getElementById('chordIntervalChart');
        this.intervalGrid = document.getElementById('intervalGrid');
        
        console.log('Elements initialized');
    }
    
    bindEvents() {
        if (this.playChordBtn) {
            this.playChordBtn.addEventListener('click', () => this.playChord());
        }
        
        if (this.playArpeggioBtn) {
            this.playArpeggioBtn.addEventListener('click', () => this.playArpeggio());
        }
        
        if (this.playReferenceBtn) {
            this.playReferenceBtn.addEventListener('click', () => this.playReference());
        }
        
        if (this.difficultySelect) {
            this.difficultySelect.addEventListener('change', (e) => {
                this.currentDifficulty = e.target.value;
                this.generateNewQuestion();
            });
        }
        
        this.chordTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.selectChordType(type);
            });
        });
        
        if (this.clearSelectionBtn) {
            this.clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        }
        
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.addEventListener('click', () => this.checkAnswer());
        }
        
        if (this.newQuestionBtn) {
            this.newQuestionBtn.addEventListener('click', () => this.generateNewQuestion());
        }
        
        if (this.resetStatsBtn) {
            this.resetStatsBtn.addEventListener('click', () => this.resetStats());
        }
        
        if (this.statsDifficultySelect) {
            this.statsDifficultySelect.addEventListener('change', () => this.updateStatsDisplay());
        }
        
        this.updateStatsDisplay();
        console.log('Events bound successfully');
    }
    
    initializeChordTypeStats() {
        Object.keys(this.chordTypes).forEach(type => {
            ['easy', 'hard'].forEach(difficulty => {
                const key = `${type}_${difficulty}`;
                if (!this.chordTypeStats[key]) {
                    this.chordTypeStats[key] = {
                        type: type,
                        difficulty: difficulty,
                        name: this.chordTypes[type].name,
                        correct: 0,
                        total: 0,
                        errorRate: 0
                    };
                }
            });
        });
    }
    
    async initAudioContext() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context created');
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            return false;
        }
    }
    
    // 计算音符频率 (基于A4 = 440Hz)
    getNoteFrequency(noteIndex, octave = 4) {
        const A4_INDEX = 9;
        const A4_OCTAVE = 4;
        const A4_FREQUENCY = 440;
        
        const semitoneDifference = (octave - A4_OCTAVE) * 12 + (noteIndex - A4_INDEX);
        return A4_FREQUENCY * Math.pow(2, semitoneDifference / 12);
    }
    
    async playTone(frequency, duration = 1.0, delay = 0) {
        const success = await this.initAudioContext();
        if (!success) return;
        
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    const volume = 0.25;
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration - 0.1);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                    
                    oscillator.onended = () => resolve();
                    
                    console.log('Playing tone:', frequency, 'Hz');
                } catch (error) {
                    console.error('Error playing tone:', error);
                    resolve();
                }
            }, delay);
        });
    }
    
    async playChord() {
        if (!this.currentChord) {
            console.log('No current chord to play');
            return;
        }
        
        this.playChordBtn.disabled = true;
        this.playChordBtn.textContent = '播放中...';
        
        try {
            const audioReady = await this.initAudioContext();
            if (!audioReady) {
                throw new Error('音频上下文初始化失败');
            }
            
            // 构建正确的和弦音符，确保根音在最低位置
            const rootNote = this.currentChord.rootNote;
            const chordType = this.chordTypes[this.currentChord.type];
            
            // 构建和弦音符，确保根音在C4，其他音符适当分布
            const chordNotes = [];
            let baseOctave = 4;
            
            // 添加根音（C4）
            chordNotes.push({
                noteIndex: rootNote,
                octave: baseOctave
            });
            
            // 添加其他音符，确保都在根音之上
            for (let i = 1; i < chordType.intervals.length; i++) {
                const noteIndex = (rootNote + chordType.intervals[i]) % 12;
                let octave = baseOctave;
                
                // 如果音符索引小于根音，说明跨越了八度，需要提高八度
                if (noteIndex < rootNote) {
                    octave = baseOctave + 1;
                }
                
                chordNotes.push({
                    noteIndex: noteIndex,
                    octave: octave
                });
            }
            
            console.log('Playing chord notes:', chordNotes);
            
            // 同时播放和弦的所有音
            const promises = chordNotes.map(note => {
                const frequency = this.getNoteFrequency(note.noteIndex, note.octave);
                return this.playTone(frequency, 3.0);
            });
            
            await Promise.all(promises);
            
        } catch (error) {
            console.error('播放和弦时出错:', error);
            alert('音频播放失败，请点击页面任意位置后重试');
        } finally {
            this.playChordBtn.disabled = false;
            this.playChordBtn.textContent = '播放和弦';
        }
    }
    
    async playArpeggio() {
        if (!this.currentChord) return;
        
        this.playArpeggioBtn.disabled = true;
        this.playArpeggioBtn.textContent = '播放中...';
        
        try {
            const audioReady = await this.initAudioContext();
            if (!audioReady) {
                throw new Error('音频上下文初始化失败');
            }
            
            // 构建正确的琶音序列：根音开始，按音高从低到高排列
            const rootNote = this.currentChord.rootNote;
            const chordType = this.chordTypes[this.currentChord.type];
            
            // 构建从根音开始的音符序列，确保按音高排序
            const arpeggioNotes = [];
            let currentOctave = 4;
            
            // 添加根音（最低音）
            arpeggioNotes.push({
                noteIndex: rootNote,
                octave: currentOctave
            });
            
            // 添加其他音符，确保都在根音之上
            for (let i = 1; i < chordType.intervals.length; i++) {
                const noteIndex = (rootNote + chordType.intervals[i]) % 12;
                let octave = currentOctave;
                
                // 如果音符索引小于根音，说明跨越了八度，需要提高八度
                if (noteIndex < rootNote) {
                    octave = currentOctave + 1;
                }
                
                arpeggioNotes.push({
                    noteIndex: noteIndex,
                    octave: octave
                });
            }
            
            // 按实际频率排序，确保从低到高
            arpeggioNotes.sort((a, b) => {
                const freqA = this.getNoteFrequency(a.noteIndex, a.octave);
                const freqB = this.getNoteFrequency(b.noteIndex, b.octave);
                return freqA - freqB;
            });
            
            console.log('Playing arpeggio notes:', arpeggioNotes);
            
            // 依次播放琶音（从低到高）
            for (let i = 0; i < arpeggioNotes.length; i++) {
                const note = arpeggioNotes[i];
                const frequency = this.getNoteFrequency(note.noteIndex, note.octave);
                await this.playTone(frequency, 1.0);
                if (i < arpeggioNotes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
        } catch (error) {
            console.error('播放琶音时出错:', error);
            alert('音频播放失败，请点击页面任意位置后重试');
        } finally {
            this.playArpeggioBtn.disabled = false;
            this.playArpeggioBtn.textContent = '播放琶音';
        }
    }
    
    async playReference() {
        this.playReferenceBtn.disabled = true;
        this.playReferenceBtn.textContent = '播放中...';
        
        try {
            const audioReady = await this.initAudioContext();
            if (!audioReady) {
                throw new Error('音频上下文初始化失败');
            }
            
            // 播放当前根音作为参考
            const frequency = this.getNoteFrequency(this.currentChord.rootNote, 4);
            await this.playTone(frequency, 2.0);
            
        } catch (error) {
            console.error('播放参考音时出错:', error);
            alert('音频播放失败，请点击页面任意位置后重试');
        } finally {
            this.playReferenceBtn.disabled = false;
            this.playReferenceBtn.textContent = '播放参考音';
        }
    }
    
    generateNewQuestion() {
        // 选择根音
        const rootNotes = this.rootNotes[this.currentDifficulty];
        const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
        
        // 智能选择和弦类型
        const selectedChordType = this.selectChordTypeByErrorRate();
        
        // 构建和弦
        const chordType = this.chordTypes[selectedChordType];
        const notes = chordType.intervals.map(interval => (rootNote + interval) % 12);
        
        this.currentChord = {
            rootNote: rootNote,
            type: selectedChordType,
            name: chordType.name,
            notes: notes,
            description: chordType.description
        };
        
        console.log('Generated new question:', this.currentChord);
        
        // 更新界面
        if (this.rootNoteSpan) {
            this.rootNoteSpan.textContent = this.chromaticNotes[rootNote];
        }
        
        if (this.chordHintDiv) {
            this.chordHintDiv.textContent = "请听辨和弦的调性特征";
        }
        
        this.clearSelection();
        this.resetButtonStates();
        
        if (this.resultDiv) {
            this.resultDiv.textContent = '';
            this.resultDiv.className = 'result-message';
        }
        
        if (this.newQuestionBtn) {
            this.newQuestionBtn.disabled = true;
        }
        
        // 显示空白的半音关系图表
        this.renderEmptyIntervalChart();
        
        // 自动播放和弦
        setTimeout(() => {
            this.playChord();
        }, 500);
        
        console.log('新题目已生成，正在自动播放和弦...');
    }
    
    selectChordTypeByErrorRate() {
        const chordTypeKeys = Object.keys(this.chordTypes);
        
        // 如果总题数少于和弦类型数，随机选择
        if (this.score.total < chordTypeKeys.length) {
            return chordTypeKeys[Math.floor(Math.random() * chordTypeKeys.length)];
        }
        
        // 计算权重：错误率越高，权重越大
        const weights = chordTypeKeys.map(type => {
            const key = `${type}_${this.currentDifficulty}`;
            const stat = this.chordTypeStats[key];
            if (stat.total === 0) return 1;
            return Math.max(0.1, stat.errorRate + 0.1);
        });
        
        // 加权随机选择
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return chordTypeKeys[i];
            }
        }
        
        return chordTypeKeys[Math.floor(Math.random() * chordTypeKeys.length)];
    }
    
    selectChordType(type) {
        console.log('Selecting chord type:', type);
        
        // 检查是否已经选择了这个类型
        if (this.selectedType === type) {
            // 如果已选择，则取消选择
            this.clearSelection();
            return;
        }
        
        this.selectedType = type;
        this.updateSelectedTypeDisplay();
        this.updateButtonStates();
        
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = false;
        }
        
        // 显示所选和弦类型的半音关系图
        this.renderSelectedChordIntervalChart(type);
    }
    
    clearSelection() {
        console.log('Clearing selection');
        this.selectedType = null;
        this.updateSelectedTypeDisplay();
        this.updateButtonStates();
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = true;
        }
    }
    
    updateSelectedTypeDisplay() {
        if (!this.selectedTypeSpan) return;
        
        if (this.selectedType) {
            this.selectedTypeSpan.textContent = this.chordTypes[this.selectedType].name;
        } else {
            this.selectedTypeSpan.textContent = '请选择和弦调性';
        }
    }
    
    updateButtonStates() {
        this.chordTypeButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (this.selectedType && btn.dataset.type === this.selectedType) {
                btn.classList.add('selected');
            }
        });
    }
    
    resetButtonStates() {
        this.chordTypeButtons.forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect', 'disabled');
        });
    }
    
    checkAnswer() {
        console.log('Checking answer. Selected:', this.selectedType, 'Correct:', this.currentChord.type);
        
        if (!this.currentChord || !this.selectedType) {
            console.log('Invalid answer state');
            return;
        }
        
        // 禁用所有按钮
        this.chordTypeButtons.forEach(btn => {
            btn.classList.add('disabled');
        });
        
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = true;
        }
        
        // 更新统计
        this.score.total++;
        const statKey = `${this.currentChord.type}_${this.currentDifficulty}`;
        this.chordTypeStats[statKey].total++;
        
        // 检查答案
        const isCorrect = this.selectedType === this.currentChord.type;
        
        console.log('Answer check:', { isCorrect });
        
        if (isCorrect) {
            // 正确答案
            this.score.correct++;
            this.chordTypeStats[statKey].correct++;
            
            this.chordTypeButtons.forEach(btn => {
                if (btn.dataset.type === this.selectedType) {
                    btn.classList.add('correct');
                }
            });
            
            if (this.resultDiv) {
                const rootName = this.chromaticNotes[this.currentChord.rootNote];
                this.resultDiv.textContent = `正确！这是 ${rootName}${this.currentChord.name}`;
                this.resultDiv.className = 'result-message correct';
            }
        } else {
            // 错误答案
            this.chordTypeButtons.forEach(btn => {
                if (btn.dataset.type === this.selectedType) {
                    btn.classList.add('incorrect');
                } else if (btn.dataset.type === this.currentChord.type) {
                    btn.classList.add('correct');
                }
            });
            
            if (this.resultDiv) {
                const rootName = this.chromaticNotes[this.currentChord.rootNote];
                this.resultDiv.textContent = `错误！正确答案是：${rootName}${this.currentChord.name}`;
                this.resultDiv.className = 'result-message incorrect';
            }
        }
        
        // 显示半音关系图表
        this.renderChordIntervalChart();
        
        // 更新错误率
        this.updateChordTypeErrorRate(statKey);
        
        // 更新显示
        this.updateScore();
        this.updateStatsDisplay();
        this.saveStats();
        
        // 启用新题目按钮
        if (this.newQuestionBtn) {
            this.newQuestionBtn.disabled = false;
        }
        
        console.log('Answer processed. Score:', this.score);
    }
    
    updateChordTypeErrorRate(statKey) {
        const stat = this.chordTypeStats[statKey];
        stat.errorRate = stat.total > 0 ? (stat.total - stat.correct) / stat.total : 0;
    }
    
    updateScore() {
        if (this.correctSpan) this.correctSpan.textContent = this.score.correct;
        if (this.totalSpan) this.totalSpan.textContent = this.score.total;
        
        const accuracy = this.score.total > 0 ? 
            Math.round((this.score.correct / this.score.total) * 100) : 0;
        if (this.accuracySpan) this.accuracySpan.textContent = accuracy + '%';
    }
    
    updateStatsDisplay() {
        if (!this.statsGrid) return;
        
        this.statsGrid.innerHTML = '';
        
        const selectedDifficulty = this.statsDifficultySelect ? this.statsDifficultySelect.value : 'all';
        
        // 获取要显示的统计数据
        const statsToShow = [];
        Object.keys(this.chordTypes).forEach(type => {
            if (selectedDifficulty === 'all') {
                ['easy', 'hard'].forEach(difficulty => {
                    const key = `${type}_${difficulty}`;
                    const stat = this.chordTypeStats[key];
                    if (stat) {
                        statsToShow.push({
                            ...stat,
                            displayName: `${stat.name} (${difficulty === 'easy' ? '简单' : '困难'})`
                        });
                    }
                });
            } else {
                const key = `${type}_${selectedDifficulty}`;
                const stat = this.chordTypeStats[key];
                if (stat) {
                    statsToShow.push({
                        ...stat,
                        displayName: stat.name
                    });
                }
            }
        });
        
        // 计算播放概率
        const playProbabilities = this.calculatePlayProbabilities();
        
        statsToShow.forEach((stat, index) => {
            const errorRate = stat.total > 0 ? ((stat.total - stat.correct) / stat.total * 100) : 0;
            const probability = playProbabilities[stat.type] || 0;
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            let rateClass = 'low';
            if (errorRate > 50) rateClass = 'high';
            else if (errorRate > 25) rateClass = 'medium';
            
            statItem.innerHTML = `
                <div class="stat-chord">${stat.displayName}</div>
                <div class="stat-rate ${rateClass}">错误率: ${errorRate.toFixed(1)}%</div>
                <div class="stat-count">答题: ${stat.correct}/${stat.total}</div>
                <div class="stat-probability">概率: ${probability.toFixed(1)}%</div>
            `;
            
            this.statsGrid.appendChild(statItem);
        });
    }
    
    calculatePlayProbabilities() {
        const chordTypeKeys = Object.keys(this.chordTypes);
        const probabilities = {};
        
        // 如果总题数少于和弦类型数，每个类型概率相等
        if (this.score.total < chordTypeKeys.length) {
            const equalProb = 100 / chordTypeKeys.length;
            chordTypeKeys.forEach(type => {
                probabilities[type] = equalProb;
            });
            return probabilities;
        }
        
        // 计算权重：错误率越高，权重越大
        const weights = chordTypeKeys.map(type => {
            const key = `${type}_${this.currentDifficulty}`;
            const stat = this.chordTypeStats[key];
            if (stat.total === 0) return 1;
            return Math.max(0.1, stat.errorRate + 0.1);
        });
        
        // 转换为概率百分比
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        chordTypeKeys.forEach((type, index) => {
            probabilities[type] = (weights[index] / totalWeight) * 100;
        });
        
        return probabilities;
    }
    
    resetStats() {
        if (confirm('确定要重置所有统计数据吗？')) {
            this.chordTypeStats = {};
            this.initializeChordTypeStats();
            this.score = {
                correct: 0,
                total: 0
            };
            this.updateScore();
            this.updateStatsDisplay();
            this.saveStats();
        }
    }
    
    saveStats() {
        try {
            localStorage.setItem('chordTypeTrainerStats', JSON.stringify({
                chordTypeStats: this.chordTypeStats,
                totalScore: this.score
            }));
        } catch (error) {
            console.warn('无法保存统计数据:', error);
        }
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('chordTypeTrainerStats');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.chordTypeStats) {
                    this.chordTypeStats = { ...this.chordTypeStats, ...data.chordTypeStats };
                }
                if (data.totalScore) {
                    this.score = data.totalScore;
                    this.updateScore();
                }
            }
        } catch (error) {
            console.warn('无法加载统计数据:', error);
        }
    }
    
    // 渲染空白的半音关系图表
    renderEmptyIntervalChart() {
        if (!this.chordIntervalChart || !this.intervalGrid) return;
        
        // 清空现有内容
        this.intervalGrid.innerHTML = '';
        
        // 移除之前的和弦描述
        const oldDescription = this.chordIntervalChart.querySelector('.chord-description');
        if (oldDescription) {
            oldDescription.remove();
        }
        
        // 创建12个空白半音格子
        for (let i = 0; i < 12; i++) {
            const cell = document.createElement('div');
            cell.className = 'interval-cell';
            
            // 添加音符名称提示
            const noteName = this.chromaticNotes[i];
            cell.title = noteName;
            
            this.intervalGrid.appendChild(cell);
        }
        
        // 添加提示信息
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'chord-description';
        descriptionDiv.textContent = '请选择一个和弦类型查看其半音关系';
        this.chordIntervalChart.appendChild(descriptionDiv);
    }
    
    // 渲染用户选择的和弦类型的半音关系图表
    renderSelectedChordIntervalChart(chordType) {
        if (!this.chordIntervalChart || !this.intervalGrid || !this.currentChord) return;
        
        // 清空现有内容
        this.intervalGrid.innerHTML = '';
        
        // 移除之前的和弦描述
        const oldDescription = this.chordIntervalChart.querySelector('.chord-description');
        if (oldDescription) {
            oldDescription.remove();
        }
        
        // 获取所选和弦类型的音程关系
        const selectedChordType = this.chordTypes[chordType];
        if (!selectedChordType) return;
        
        // 创建12个半音格子，固定位置显示
        for (let i = 0; i < 12; i++) {
            const cell = document.createElement('div');
            cell.className = 'interval-cell';
            
            // 检查这个位置是否在和弦中
            if (selectedChordType.intervals.includes(i)) {
                cell.classList.add('active');
                
                // 添加音符角色标签
                const labelDiv = document.createElement('div');
                labelDiv.className = 'interval-cell-label';
                
                // 确定音符在和弦中的角色
                if (i === 0) {
                    cell.classList.add('root');
                    labelDiv.textContent = '根音';
                } else {
                    // 根据半音距离确定音符角色
                    switch (i) {
                        case 3:
                            labelDiv.textContent = '小3度';
                            break;
                        case 4:
                            labelDiv.textContent = '大3度';
                            break;
                        case 6:
                            labelDiv.textContent = '减5度';
                            break;
                        case 7:
                            labelDiv.textContent = '5度';
                            break;
                        case 8:
                            labelDiv.textContent = '增5度';
                            break;
                        case 9:
                            labelDiv.textContent = '6度';
                            break;
                        case 10:
                            labelDiv.textContent = '小7度';
                            break;
                        case 11:
                            labelDiv.textContent = '大7度';
                            break;
                        default:
                            labelDiv.textContent = `${i}半音`;
                    }
                }
                
                cell.appendChild(labelDiv);
            }
            
            // 添加音符名称提示（固定显示C为根音的相对位置）
            const noteName = this.chromaticNotes[i];
            cell.title = noteName;
            
            this.intervalGrid.appendChild(cell);
        }
        
        // 添加和弦类型描述
        const rootName = this.chromaticNotes[0]; // 固定显示C为根音
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'chord-description';
        descriptionDiv.textContent = `${rootName}${selectedChordType.name}`;
        this.chordIntervalChart.appendChild(descriptionDiv);
    }
    
    // 渲染正确答案的半音关系图表
    renderChordIntervalChart() {
        if (!this.chordIntervalChart || !this.intervalGrid || !this.currentChord) return;
        
        // 清空现有内容
        this.intervalGrid.innerHTML = '';
        
        // 移除之前的和弦描述
        const oldDescription = this.chordIntervalChart.querySelector('.chord-description');
        if (oldDescription) {
            oldDescription.remove();
        }
        
        // 获取和弦类型
        const chordType = this.chordTypes[this.currentChord.type];
        
        // 创建12个半音格子，固定位置显示
        for (let i = 0; i < 12; i++) {
            const cell = document.createElement('div');
            cell.className = 'interval-cell';
            
            // 检查这个位置是否在和弦中
            if (chordType.intervals.includes(i)) {
                cell.classList.add('active');
                
                // 添加音符角色标签
                const labelDiv = document.createElement('div');
                labelDiv.className = 'interval-cell-label';
                
                // 确定音符在和弦中的角色
                if (i === 0) {
                    cell.classList.add('root');
                    labelDiv.textContent = '根音';
                } else {
                    // 根据半音距离确定音符角色
                    switch (i) {
                        case 3:
                            labelDiv.textContent = '小3度';
                            break;
                        case 4:
                            labelDiv.textContent = '大3度';
                            break;
                        case 6:
                            labelDiv.textContent = '减5度';
                            break;
                        case 7:
                            labelDiv.textContent = '5度';
                            break;
                        case 8:
                            labelDiv.textContent = '增5度';
                            break;
                        case 9:
                            labelDiv.textContent = '6度';
                            break;
                        case 10:
                            labelDiv.textContent = '小7度';
                            break;
                        case 11:
                            labelDiv.textContent = '大7度';
                            break;
                        default:
                            labelDiv.textContent = `${i}半音`;
                    }
                }
                
                cell.appendChild(labelDiv);
            }
            
            // 添加音符名称提示（固定显示C为根音的相对位置）
            const noteName = this.chromaticNotes[i];
            cell.title = noteName;
            
            this.intervalGrid.appendChild(cell);
        }
        
        // 添加和弦类型描述
        const actualRootName = this.chromaticNotes[this.currentChord.rootNote]; // 实际根音名称
        const displayRootName = this.chromaticNotes[0]; // 显示固定的C作为根音
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'chord-description';
        descriptionDiv.textContent = `正确答案：${actualRootName}${chordType.name}`;
        this.chordIntervalChart.appendChild(descriptionDiv);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ChordTypeTrainer');
    new ChordTypeTrainer();
});
