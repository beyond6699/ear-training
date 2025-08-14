class PitchTrainer {
    constructor() {
        this.audioContext = null;
        this.currentNote = null;
        this.selectedNote = null;
        this.score = {
            correct: 0,
            total: 0
        };
        
        // 音符统计 - 包含4个八度的所有半音
        this.noteStats = {};
        
        // 半音阶音符名称 (12个半音)
        this.chromaticNotes = [
            { name: 'C', isBlack: false },
            { name: 'C#', isBlack: true },
            { name: 'D', isBlack: false },
            { name: 'D#', isBlack: true },
            { name: 'E', isBlack: false },
            { name: 'F', isBlack: false },
            { name: 'F#', isBlack: true },
            { name: 'G', isBlack: false },
            { name: 'G#', isBlack: true },
            { name: 'A', isBlack: false },
            { name: 'A#', isBlack: true },
            { name: 'B', isBlack: false }
        ];
        
        // C大调音阶在半音阶中的位置
        this.majorScalePositions = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
        
        this.initializeElements();
        this.initializeNoteStats();
        this.loadStats();
        this.bindEvents();
        this.generatePianoKeyboard();
        
        // 监听窗口大小变化，重新生成键盘
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                if (this.currentInstrument === 'piano') {
                    this.generatePianoKeyboard();
                } else if (this.currentInstrument === 'guitar') {
                    this.generateGuitarFretboard();
                }
            }, 300);
        });
        
        // 页面加载后直接生成第一题
        setTimeout(() => {
            this.generateNewQuestion();
        }, 100);
    }
    
    initializeElements() {
        this.playScaleBtn = document.getElementById('playScale');
        this.playReferenceBtn = document.getElementById('playReference');
        this.playTargetBtn = document.getElementById('playTarget');
        this.instrumentSelect = document.getElementById('instrumentSelect');
        this.pianoContainer = document.getElementById('pianoContainer');
        this.guitarContainer = document.getElementById('guitarContainer');
        this.pianoKeyboard = document.getElementById('pianoKeyboard');
        this.guitarFretboard = document.getElementById('guitarFretboard');
        this.instructionText = document.getElementById('instructionText');
        this.rangeInfo = document.getElementById('rangeInfo');
        this.selectedNoteSpan = document.getElementById('selectedNote');
        this.clearSelectionBtn = document.getElementById('clearSelection');
        this.submitAnswerBtn = document.getElementById('submitAnswer');
        this.newQuestionBtn = document.getElementById('newQuestion');
        this.resultDiv = document.getElementById('result');
        this.correctSpan = document.getElementById('correct');
        this.totalSpan = document.getElementById('total');
        this.accuracySpan = document.getElementById('accuracy');
        this.resetStatsBtn = document.getElementById('resetStats');
        this.statsOctaveSelect = document.getElementById('statsOctave');
        this.statsGrid = document.getElementById('statsGrid');
        
        this.currentInstrument = 'piano';
        
        console.log('Elements initialized');
    }
    
    bindEvents() {
        if (this.playScaleBtn) {
            this.playScaleBtn.addEventListener('click', () => this.playScale());
        }
        
        if (this.playReferenceBtn) {
            this.playReferenceBtn.addEventListener('click', () => this.playReference());
        }
        
        if (this.playTargetBtn) {
            this.playTargetBtn.addEventListener('click', () => this.playTarget());
        }
        
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
        
        if (this.statsOctaveSelect) {
            this.statsOctaveSelect.addEventListener('change', () => this.updateStatsDisplay());
        }
        
        if (this.instrumentSelect) {
            this.instrumentSelect.addEventListener('change', (e) => {
                this.switchInstrument(e.target.value);
            });
        }
        
        this.updateStatsDisplay();
        console.log('Events bound successfully');
    }
    
    initializeNoteStats() {
        // 初始化2个八度的所有音符统计 (C3-B4)
        for (let octave = 3; octave <= 4; octave++) {
            for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
                const noteKey = `${this.chromaticNotes[noteIndex].name}${octave}`;
                if (!this.noteStats[noteKey]) {
                    this.noteStats[noteKey] = {
                        name: noteKey,
                        correct: 0,
                        total: 0,
                        errorRate: 0
                    };
                }
            }
        }
    }
    
    generatePianoKeyboard() {
        if (!this.pianoKeyboard) return;
        
        this.pianoKeyboard.innerHTML = '';
        
        // 计算键盘尺寸 - 需要容纳两个八度（14个白键）
        const containerWidth = this.pianoKeyboard.offsetWidth || 800;
        const whiteKeyWidth = Math.max(30, Math.min(45, containerWidth / 16)); // 14个白键 + 边距
        const blackKeyWidth = whiteKeyWidth * 0.6;
        const keyboardHeight = Math.max(120, Math.min(200, containerWidth / 5));
        const blackKeyHeight = keyboardHeight * 0.65;
        
        // 更新键盘容器高度和最小宽度
        this.pianoKeyboard.style.height = `${keyboardHeight}px`;
        this.pianoKeyboard.style.minWidth = `${whiteKeyWidth * 14 + 40}px`;
        
        // 白键位置映射 - 两个八度
        const whiteKeyIndices = [0, 2, 4, 5, 7, 9, 11]; // 一个八度内的白键
        
        // 黑键位置映射 (相对于白键的偏移)
        const blackKeyOffsets = [0.7, 1.7, 3.3, 4.3, 5.3]; // C# D# F# G# A#
        const blackKeyIndices = [1, 3, 6, 8, 10]; // 一个八度内的黑键
        
        let whiteKeyCounter = 0;
        
        // 生成两个八度的键盘 (C3-B4)
        for (let octave = 3; octave <= 4; octave++) {
            // 先生成当前八度的白键
            whiteKeyIndices.forEach((noteIndex) => {
                const note = this.chromaticNotes[noteIndex];
                const key = document.createElement('div');
                key.className = 'piano-key white';
                key.dataset.note = noteIndex;
                key.dataset.octave = octave;
                key.textContent = `${note.name}${octave}`;
                key.style.left = `${whiteKeyCounter * whiteKeyWidth}px`;
                key.style.width = `${whiteKeyWidth}px`;
                key.style.height = `${keyboardHeight}px`;
                
                key.addEventListener('click', () => {
                    this.selectNote(noteIndex, octave);
                    this.playNotePreview(noteIndex, octave);
                });
                
                this.pianoKeyboard.appendChild(key);
                whiteKeyCounter++;
            });
            
            // 再生成当前八度的黑键
            blackKeyIndices.forEach((noteIndex, blackIndex) => {
                const note = this.chromaticNotes[noteIndex];
                const key = document.createElement('div');
                key.className = 'piano-key black';
                key.dataset.note = noteIndex;
                key.dataset.octave = octave;
                key.textContent = `${note.name}${octave}`;
                
                // 计算黑键位置：基于当前八度的起始位置 + 黑键偏移
                const octaveOffset = (octave - 3) * 7; // 每个八度7个白键
                const leftPosition = (octaveOffset + blackKeyOffsets[blackIndex]) * whiteKeyWidth - blackKeyWidth / 2;
                key.style.left = `${leftPosition}px`;
                key.style.width = `${blackKeyWidth}px`;
                key.style.height = `${blackKeyHeight}px`;
                
                key.addEventListener('click', () => {
                    this.selectNote(noteIndex, octave);
                    this.playNotePreview(noteIndex, octave);
                });
                
                this.pianoKeyboard.appendChild(key);
            });
        }
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
    getNoteFrequency(noteIndex, octave) {
        // A4 = 440Hz, A4在第4八度的第9个位置 (A)
        const A4_INDEX = 9;
        const A4_OCTAVE = 4;
        const A4_FREQUENCY = 440;
        
        // 计算相对于A4的半音数差异
        const semitoneDifference = (octave - A4_OCTAVE) * 12 + (noteIndex - A4_INDEX);
        
        // 使用等程律公式计算频率
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
                    
                    const volume = 0.3;
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
    
    async playScale() {
        this.playScaleBtn.disabled = true;
        this.playScaleBtn.textContent = '播放中...';
        
        try {
            // 确保音频上下文已初始化
            const audioReady = await this.initAudioContext();
            if (!audioReady) {
                throw new Error('音频上下文初始化失败');
            }
            
            // C大调音阶：C D E F G A B C
            const cMajorScale = [0, 2, 4, 5, 7, 9, 11, 12]; // 半音阶位置
            
            for (let i = 0; i < cMajorScale.length; i++) {
                const noteIndex = cMajorScale[i] % 12; // 处理高八度的C
                const octave = cMajorScale[i] === 12 ? 5 : 4; // 最后一个C是C5
                const frequency = this.getNoteFrequency(noteIndex, octave);
                await this.playTone(frequency, 0.6);
                
                // 音符间稍作停顿
                if (i < cMajorScale.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
        } catch (error) {
            console.error('播放音阶时出错:', error);
            alert('音频播放失败，请点击页面任意位置后重试');
        } finally {
            this.playScaleBtn.disabled = false;
            this.playScaleBtn.textContent = '播放C大调音阶';
        }
    }
    
    async playReference() {
        this.playReferenceBtn.disabled = true;
        this.playReferenceBtn.textContent = '播放中...';
        
        try {
            // 确保音频上下文已初始化
            const audioReady = await this.initAudioContext();
            if (!audioReady) {
                throw new Error('音频上下文初始化失败');
            }
            
            // 播放C4作为参考音
            const frequency = this.getNoteFrequency(0, 4); // C4
            await this.playTone(frequency, 2.0);
            
        } catch (error) {
            console.error('播放参考音时出错:', error);
            alert('音频播放失败，请点击页面任意位置后重试');
        } finally {
            this.playReferenceBtn.disabled = false;
            this.playReferenceBtn.textContent = '播放参考音 (C4)';
        }
    }

    async playTarget() {
        if (!this.currentNote) {
            console.log('No current note to play');
            return;
        }
        
        this.playTargetBtn.disabled = true;
        this.playTargetBtn.textContent = '播放中...';
        
        try {
            const frequency = this.getNoteFrequency(this.currentNote.noteIndex, this.currentNote.octave);
            await this.playTone(frequency, 2.0);
        } catch (error) {
            console.error('播放目标音时出错:', error);
        } finally {
            this.playTargetBtn.disabled = false;
            this.playTargetBtn.textContent = '播放目标音';
        }
    }
    
    async playNotePreview(noteIndex, octave) {
        try {
            const frequency = this.getNoteFrequency(noteIndex, octave);
            await this.playTone(frequency, 0.5);
        } catch (error) {
            console.error('播放音符预览时出错:', error);
        }
    }
    
    generateNewQuestion() {
        // 智能选择音符
        const selectedNote = this.selectNoteByErrorRate();
        this.currentNote = {
            noteIndex: selectedNote.noteIndex,
            octave: selectedNote.octave,
            name: selectedNote.name
        };
        
        console.log('Generated new question:', this.currentNote);
        
        this.clearSelection();
        this.resetInstrumentStates();
        
        if (this.resultDiv) {
            this.resultDiv.textContent = '';
            this.resultDiv.className = 'result-message';
        }
        
        if (this.newQuestionBtn) {
            this.newQuestionBtn.disabled = true;
        }
        
        // 自动播放目标音
        setTimeout(() => {
            this.playTarget();
        }, 500);
    }
    
    selectNoteByErrorRate() {
        // 获取所有音符的统计数据 (C3-B4)
        const allNotes = [];
        for (let octave = 3; octave <= 4; octave++) {
            for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
                const noteKey = `${this.chromaticNotes[noteIndex].name}${octave}`;
                allNotes.push({
                    noteIndex,
                    octave,
                    name: noteKey,
                    stat: this.noteStats[noteKey]
                });
            }
        }
        
        // 如果总题数少于音符数量，随机选择
        if (this.score.total < 12) {
            return allNotes[Math.floor(Math.random() * allNotes.length)];
        }
        
        // 计算权重：错误率越高，权重越大
        const weights = allNotes.map(note => {
            const stat = note.stat;
            if (stat.total === 0) return 1;
            return Math.max(0.1, stat.errorRate + 0.1);
        });
        
        // 加权随机选择
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return allNotes[i];
            }
        }
        
        return allNotes[Math.floor(Math.random() * allNotes.length)];
    }
    
    selectNote(noteIndex, octave) {
        console.log('Selecting note:', noteIndex, 'octave:', octave);
        
        // 检查是否已经选择了这个音符
        if (this.selectedNote && 
            this.selectedNote.noteIndex === noteIndex && 
            this.selectedNote.octave === octave) {
            // 如果已选择，则取消选择
            this.clearSelection();
            return;
        }
        
        this.selectedNote = {
            noteIndex,
            octave,
            name: `${this.chromaticNotes[noteIndex].name}${octave}`
        };
        
        this.updateSelectedNoteDisplay();
        this.updateInstrumentStates();
        
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = false;
        }
    }
    
    clearSelection() {
        console.log('Clearing selection');
        this.selectedNote = null;
        this.updateSelectedNoteDisplay();
        this.updateInstrumentStates();
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = true;
        }
    }
    
    updateSelectedNoteDisplay() {
        if (!this.selectedNoteSpan) return;
        
        if (this.selectedNote) {
            this.selectedNoteSpan.textContent = this.selectedNote.name;
        } else {
            this.selectedNoteSpan.textContent = '请选择一个音符';
        }
    }
    
    updateInstrumentStates() {
        if (this.currentInstrument === 'piano') {
            this.updateKeyboardStates();
        } else if (this.currentInstrument === 'guitar') {
            this.updateGuitarStates();
        }
    }
    
    updateKeyboardStates() {
        if (this.currentInstrument === 'piano') {
            const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
            keys.forEach((key) => {
                key.classList.remove('selected');
                if (this.selectedNote && 
                    parseInt(key.dataset.note) === this.selectedNote.noteIndex &&
                    parseInt(key.dataset.octave) === this.selectedNote.octave) {
                    key.classList.add('selected');
                }
            });
        } else if (this.currentInstrument === 'guitar') {
            this.updateGuitarStates();
        }
    }
    
    resetInstrumentStates() {
        if (this.currentInstrument === 'piano') {
            this.resetKeyboardStates();
        } else if (this.currentInstrument === 'guitar') {
            this.resetGuitarStates();
        }
    }
    
    resetKeyboardStates() {
        if (this.currentInstrument === 'piano') {
            const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
            keys.forEach(key => {
                key.classList.remove('selected', 'correct', 'incorrect');
            });
        } else if (this.currentInstrument === 'guitar') {
            this.resetGuitarStates();
        }
    }
    
    checkAnswer() {
        console.log('Checking answer. Selected:', this.selectedNote, 'Correct:', this.currentNote);
        
        if (!this.currentNote || !this.selectedNote) {
            console.log('Invalid answer state');
            return;
        }
        
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = true;
        }
        
        // 更新统计
        this.score.total++;
        const noteKey = this.currentNote.name;
        this.noteStats[noteKey].total++;
        
        // 检查答案
        const isCorrect = (this.selectedNote.noteIndex === this.currentNote.noteIndex && 
                          this.selectedNote.octave === this.currentNote.octave);
        
        console.log('Answer check:', { isCorrect });
        
        if (isCorrect) {
            // 正确答案
            this.score.correct++;
            this.noteStats[noteKey].correct++;
            
            if (this.currentInstrument === 'piano') {
                const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
                keys.forEach(key => {
                    if (parseInt(key.dataset.note) === this.selectedNote.noteIndex &&
                        parseInt(key.dataset.octave) === this.selectedNote.octave) {
                        key.classList.add('correct');
                    }
                });
            } else if (this.currentInstrument === 'guitar') {
                const notes = this.guitarFretboard.querySelectorAll('.guitar-note');
                notes.forEach(note => {
                    if (parseInt(note.dataset.note) === this.selectedNote.noteIndex &&
                        parseInt(note.dataset.octave) === this.selectedNote.octave) {
                        note.classList.add('correct');
                    }
                });
            }
            
            if (this.resultDiv) {
                this.resultDiv.textContent = `正确！这是 ${this.currentNote.name}`;
                this.resultDiv.className = 'result-message correct';
            }
        } else {
            // 错误答案
            if (this.currentInstrument === 'piano') {
                const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
                keys.forEach(key => {
                    const keyNote = parseInt(key.dataset.note);
                    const keyOctave = parseInt(key.dataset.octave);
                    if (keyNote === this.selectedNote.noteIndex && keyOctave === this.selectedNote.octave) {
                        key.classList.add('incorrect');
                    } else if (keyNote === this.currentNote.noteIndex && keyOctave === this.currentNote.octave) {
                        key.classList.add('correct');
                    }
                });
            } else if (this.currentInstrument === 'guitar') {
                const notes = this.guitarFretboard.querySelectorAll('.guitar-note');
                notes.forEach(note => {
                    const noteIndex = parseInt(note.dataset.note);
                    const noteOctave = parseInt(note.dataset.octave);
                    if (noteIndex === this.selectedNote.noteIndex && noteOctave === this.selectedNote.octave) {
                        note.classList.add('incorrect');
                    } else if (noteIndex === this.currentNote.noteIndex && noteOctave === this.currentNote.octave) {
                        note.classList.add('correct');
                    }
                });
            }
            
            if (this.resultDiv) {
                this.resultDiv.textContent = `错误！正确答案是：${this.currentNote.name}`;
                this.resultDiv.className = 'result-message incorrect';
            }
        }
        
        // 更新错误率
        this.updateNoteErrorRate(noteKey);
        
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
    
    updateNoteErrorRate(noteKey) {
        const stat = this.noteStats[noteKey];
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
        
        const selectedOctave = this.statsOctaveSelect ? this.statsOctaveSelect.value : 'all';
        
        // 获取要显示的音符统计 (C3-B4)
        const notesToShow = [];
        if (selectedOctave === 'all') {
            for (let octave = 3; octave <= 4; octave++) {
                for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
                    const noteKey = `${this.chromaticNotes[noteIndex].name}${octave}`;
                    notesToShow.push(this.noteStats[noteKey]);
                }
            }
        } else {
            const octave = parseInt(selectedOctave);
            for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
                const noteKey = `${this.chromaticNotes[noteIndex].name}${octave}`;
                notesToShow.push(this.noteStats[noteKey]);
            }
        }
        
        // 计算播放概率
        const playProbabilities = this.calculatePlayProbabilities();
        
        notesToShow.forEach((stat, index) => {
            if (!stat) return;
            
            const errorRate = stat.total > 0 ? ((stat.total - stat.correct) / stat.total * 100) : 0;
            const probability = playProbabilities[stat.name] || 0;
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            let rateClass = 'low';
            if (errorRate > 50) rateClass = 'high';
            else if (errorRate > 25) rateClass = 'medium';
            
            statItem.innerHTML = `
                <div class="stat-note">${stat.name}</div>
                <div class="stat-rate ${rateClass}">错误率: ${errorRate.toFixed(1)}%</div>
                <div class="stat-count">答题: ${stat.correct}/${stat.total}</div>
                <div class="stat-probability">概率: ${probability.toFixed(1)}%</div>
            `;
            
            this.statsGrid.appendChild(statItem);
        });
    }
    
    calculatePlayProbabilities() {
        const allNotes = [];
        const probabilities = {};
        
        for (let octave = 3; octave <= 4; octave++) {
            for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
                const noteKey = `${this.chromaticNotes[noteIndex].name}${octave}`;
                allNotes.push({
                    name: noteKey,
                    stat: this.noteStats[noteKey]
                });
            }
        }
        
        // 如果总题数少于12，每个音符概率相等
        if (this.score.total < 12) {
            const equalProb = 100 / allNotes.length;
            allNotes.forEach(note => {
                probabilities[note.name] = equalProb;
            });
            return probabilities;
        }
        
        // 计算权重：错误率越高，权重越大
        const weights = allNotes.map(note => {
            const stat = note.stat;
            if (stat.total === 0) return 1;
            return Math.max(0.1, stat.errorRate + 0.1);
        });
        
        // 转换为概率百分比
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        allNotes.forEach((note, index) => {
            probabilities[note.name] = (weights[index] / totalWeight) * 100;
        });
        
        return probabilities;
    }
    
    resetStats() {
        if (confirm('确定要重置所有统计数据吗？')) {
            this.noteStats = {};
            this.initializeNoteStats();
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
            localStorage.setItem('pitchTrainerStats', JSON.stringify({
                noteStats: this.noteStats,
                totalScore: this.score
            }));
        } catch (error) {
            console.warn('无法保存统计数据:', error);
        }
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('pitchTrainerStats');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.noteStats) {
                    this.noteStats = { ...this.noteStats, ...data.noteStats };
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
    
    switchInstrument(instrument) {
        console.log('Switching to instrument:', instrument);
        this.currentInstrument = instrument;
        
        if (instrument === 'piano') {
            this.pianoContainer.style.display = 'block';
            this.guitarContainer.style.display = 'none';
            this.generatePianoKeyboard();
        } else if (instrument === 'guitar') {
            this.pianoContainer.style.display = 'none';
            this.guitarContainer.style.display = 'block';
            this.generateGuitarFretboard();
        }
        
        this.clearSelection();
        this.resetInstrumentStates();
    }
    
    generateGuitarFretboard() {
        if (!this.guitarFretboard) return;
        
        this.guitarFretboard.innerHTML = '';
        
        // 吉他标准调弦 (从低到高): E A D G B E
        const tuning = [4, 9, 2, 7, 11, 4]; // 对应的半音阶位置
        const tuningNames = ['E', 'A', 'D', 'G', 'B', 'E'];
        const stringOctaves = [2, 2, 3, 3, 3, 4]; // 每根弦的基础八度
        
        // 创建弦
        for (let string = 0; string < 6; string++) {
            const stringElement = document.createElement('div');
            stringElement.className = 'guitar-string';
            this.guitarFretboard.appendChild(stringElement);
            
            // 添加弦标签
            const label = document.createElement('div');
            label.className = 'string-label';
            label.textContent = tuningNames[string];
            label.style.top = `${25 + string * 45 - 10}px`;
            this.guitarFretboard.appendChild(label);
        }
        
        // 创建品丝
        for (let fret = 0; fret <= 12; fret++) {
            const fretElement = document.createElement('div');
            fretElement.className = 'guitar-fret';
            fretElement.style.left = `${50 + fret * 90}px`;
            this.guitarFretboard.appendChild(fretElement);
        }
        
        // 添加品位标记
        const markerFrets = [3, 5, 7, 9, 12];
        const doubleMarkerFrets = [12];
        
        markerFrets.forEach(fret => {
            if (doubleMarkerFrets.includes(fret)) {
                // 双点标记
                const marker1 = document.createElement('div');
                marker1.className = 'fret-marker double';
                marker1.style.left = `${50 + fret * 90 - 45}px`;
                marker1.style.top = '35%';
                this.guitarFretboard.appendChild(marker1);
                
                const marker2 = document.createElement('div');
                marker2.className = 'fret-marker double';
                marker2.style.left = `${50 + fret * 90 - 45}px`;
                marker2.style.top = '65%';
                this.guitarFretboard.appendChild(marker2);
            } else {
                // 单点标记
                const marker = document.createElement('div');
                marker.className = 'fret-marker';
                marker.style.left = `${50 + fret * 90 - 45}px`;
                this.guitarFretboard.appendChild(marker);
            }
        });
        
        // 创建音符按钮 (只显示C3-B4范围内的音符)
        for (let string = 0; string < 6; string++) {
            for (let fret = 0; fret <= 12; fret++) {
                const noteIndex = (tuning[string] + fret) % 12;
                const octave = stringOctaves[string] + Math.floor((tuning[string] + fret) / 12);
                
                // 只显示C3-B4范围内的音符
                if (octave >= 3 && octave <= 4) {
                    const noteButton = document.createElement('div');
                    noteButton.className = 'guitar-note';
                    noteButton.dataset.note = noteIndex;
                    noteButton.dataset.octave = octave;
                    noteButton.textContent = this.chromaticNotes[noteIndex].name;
                    
                    // 计算位置
                    const x = fret === 0 ? 25 : 50 + fret * 90 - 45;
                    const y = 25 + string * 45;
                    
                    noteButton.style.left = `${x}px`;
                    noteButton.style.top = `${y}px`;
                    
                    noteButton.addEventListener('click', () => {
                        this.selectNote(noteIndex, octave);
                        this.playNotePreview(noteIndex, octave);
                    });
                    
                    this.guitarFretboard.appendChild(noteButton);
                }
            }
        }
    }
    
    updateGuitarStates() {
        const notes = this.guitarFretboard.querySelectorAll('.guitar-note');
        notes.forEach((note) => {
            note.classList.remove('selected');
            if (this.selectedNote && 
                parseInt(note.dataset.note) === this.selectedNote.noteIndex &&
                parseInt(note.dataset.octave) === this.selectedNote.octave) {
                note.classList.add('selected');
            }
        });
    }
    
    resetGuitarStates() {
        const notes = this.guitarFretboard.querySelectorAll('.guitar-note');
        notes.forEach(note => {
            note.classList.remove('selected', 'correct', 'incorrect');
        });
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PitchTrainer');
    new PitchTrainer();
});
