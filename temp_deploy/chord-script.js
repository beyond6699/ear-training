class ChordTrainer {
    constructor() {
        this.audioContext = null;
        this.currentChord = null;
        this.selectedNotes = [];
        this.score = {
            correct: 0,
            total: 0
        };
        this.chordIntervalChart = null;
        
        // 和弦类型统计
        this.chordStats = {};
        
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
        
        // 定义常用三和弦 - 使用半音阶位置，确保第一个音是根音
        this.chordList = [
            { id: 'major1', name: '大三和弦', notes: [0, 4, 7], root: 'C' }, // C E G
            { id: 'minor1', name: '小三和弦', notes: [2, 5, 9], root: 'D' }, // D F A
            { id: 'minor2', name: '小三和弦', notes: [4, 7, 11], root: 'E' }, // E G B
            { id: 'major2', name: '大三和弦', notes: [5, 9, 0], root: 'F' }, // F A C
            { id: 'major3', name: '大三和弦', notes: [7, 11, 2], root: 'G' }, // G B D
            { id: 'minor3', name: '小三和弦', notes: [9, 0, 4], root: 'A' }, // A C E
            { id: 'dim1', name: '减三和弦', notes: [11, 2, 5], root: 'B' }  // B D F
        ];
        
        // 修正和弦列表，确保根音在第一位
        this.chordList = this.chordList.map(chord => {
            // 找到根音在notes中的索引
            const rootIndex = chord.notes.findIndex(note => {
                // 根据root属性确定根音的半音位置
                const rootPosition = this.chromaticNotes.findIndex(n => n.name === chord.root);
                return note === rootPosition;
            });
            
            // 如果根音不在第一位，重新排列音符顺序
            if (rootIndex !== 0) {
                const reorderedNotes = [...chord.notes];
                // 将根音移到第一位
                const rootNote = reorderedNotes.splice(rootIndex, 1)[0];
                reorderedNotes.unshift(rootNote);
                return { ...chord, notes: reorderedNotes };
            }
            
            return chord;
        });
        
        this.initializeElements();
        this.initializeChordStats();
        this.loadStats();
        this.bindEvents();
        this.generatePianoKeyboard();
        
        // 监听窗口大小变化，重新生成键盘
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.generatePianoKeyboard();
            }, 300);
        });
        
        // 页面加载后直接生成第一题
        setTimeout(() => {
            this.generateNewQuestion();
        }, 100);
    }
    
    initializeElements() {
        this.playChordBtn = document.getElementById('playChord');
        this.playArpeggioBtn = document.getElementById('playArpeggio');
        this.pianoKeyboard = document.getElementById('pianoKeyboard');
        this.selectedNotesDiv = document.getElementById('selectedNotes');
        this.clearSelectionBtn = document.getElementById('clearSelection');
        this.submitAnswerBtn = document.getElementById('submitAnswer');
        this.newQuestionBtn = document.getElementById('newQuestion');
        this.resultDiv = document.getElementById('result');
        this.correctSpan = document.getElementById('correct');
        this.totalSpan = document.getElementById('total');
        this.accuracySpan = document.getElementById('accuracy');
        this.chordTypeSpan = document.getElementById('chordType');
        this.resetStatsBtn = document.getElementById('resetStats');
        this.statsGrid = document.getElementById('statsGrid');
        this.chordIntervalChart = document.getElementById('chordIntervalChart');
        this.intervalGrid = document.getElementById('intervalGrid');
        
        console.log('Elements initialized:', {
            playChordBtn: !!this.playChordBtn,
            submitAnswerBtn: !!this.submitAnswerBtn,
            pianoKeyboard: !!this.pianoKeyboard
        });
    }
    
    bindEvents() {
        if (this.playChordBtn) {
            this.playChordBtn.addEventListener('click', () => {
                console.log('Play chord clicked');
                this.playChord();
            });
        }
        
        if (this.playArpeggioBtn) {
            this.playArpeggioBtn.addEventListener('click', () => this.playArpeggio());
        }
        
        
        if (this.clearSelectionBtn) {
            this.clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        }
        
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.addEventListener('click', () => {
                console.log('Submit answer clicked');
                this.checkAnswer();
            });
        }
        
        if (this.newQuestionBtn) {
            this.newQuestionBtn.addEventListener('click', () => this.generateNewQuestion());
        }
        
        if (this.resetStatsBtn) {
            this.resetStatsBtn.addEventListener('click', () => this.resetStats());
        }
        
        // 初始化统计显示
        this.updateStatsDisplay();
        console.log('Events bound successfully');
    }
    
    initializeChordStats() {
        this.chordList.forEach(chord => {
            if (!this.chordStats[chord.id]) {
                this.chordStats[chord.id] = {
                    name: chord.name,
                    correct: 0,
                    total: 0,
                    errorRate: 0
                };
            }
        });
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
    
    getWhiteKeyIndex(chromaticIndex) {
        // 计算黑键相对于白键的位置
        const whiteKeyPositions = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // C C# D D# E F F# G G# A A# B
        return whiteKeyPositions[chromaticIndex];
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
                    
                    // 音量包络
                    const volume = 0.3;
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration - 0.1);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                    
                    oscillator.onended = () => {
                        console.log('Tone ended:', frequency);
                        resolve();
                    };
                    
                    console.log('Playing tone:', frequency, 'Hz for', duration, 'seconds');
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
        
        console.log('Playing chord:', this.currentChord);
        
        this.playChordBtn.disabled = true;
        this.playChordBtn.textContent = '播放中...';
        
        try {
            // 确保音频上下文已初始化
            const audioReady = await this.initAudioContext();
            if (!audioReady) {
                throw new Error('音频上下文初始化失败');
            }
            
            // 同时播放和弦的三个音（使用C4八度）
            const promises = this.currentChord.notes.map(noteIndex => {
                const frequency = this.getNoteFrequency(noteIndex, 4);
                console.log('Playing note:', noteIndex, frequency);
                return this.playTone(frequency, 3.0);
            });
            
            await Promise.all(promises);
            console.log('Chord playback completed');
            
            setTimeout(() => {
                this.playChordBtn.disabled = false;
                this.playChordBtn.textContent = '播放和弦';
                this.playArpeggioBtn.disabled = false;
            }, 100);
            
        } catch (error) {
            console.error('播放和弦时出错:', error);
            this.playChordBtn.disabled = false;
            this.playChordBtn.textContent = '播放和弦';
            alert('音频播放失败，请点击页面任意位置后重试');
        }
    }
    
    async playArpeggio() {
        if (!this.currentChord) return;
        
        this.playArpeggioBtn.disabled = true;
        this.playArpeggioBtn.textContent = '播放中...';
        
        try {
            // 确保音频上下文已初始化
            const audioReady = await this.initAudioContext();
            if (!audioReady) {
                throw new Error('音频上下文初始化失败');
            }
            
            // 依次播放和弦的三个音（琶音，使用C4八度）
            for (let i = 0; i < this.currentChord.notes.length; i++) {
                const frequency = this.getNoteFrequency(this.currentChord.notes[i], 4);
                await this.playTone(frequency, 1.0);
                await new Promise(resolve => setTimeout(resolve, 200)); // 音符间隔
            }
            
            setTimeout(() => {
                this.playArpeggioBtn.disabled = false;
                this.playArpeggioBtn.textContent = '播放琶音';
            }, 100);
            
        } catch (error) {
            console.error('播放琶音时出错:', error);
            this.playArpeggioBtn.disabled = false;
            this.playArpeggioBtn.textContent = '播放琶音';
            alert('音频播放失败，请点击页面任意位置后重试');
        }
    }
    
    async playNotePreview(noteIndex, octave = 4) {
        try {
            const frequency = this.getNoteFrequency(noteIndex, octave);
            await this.playTone(frequency, 0.5);
        } catch (error) {
            console.error('播放音符预览时出错:', error);
        }
    }
    
    generateNewQuestion() {
        // 智能选择和弦类型
        const selectedChord = this.selectChordByErrorRate();
        this.currentChord = {
            id: selectedChord.id,
            name: selectedChord.name,
            notes: [...selectedChord.notes] // 保持原始顺序，确保根音在第一位
        };
        
        console.log('Generated new question:', this.currentChord);
        
        // 更新界面 - 只显示调性，不显示具体音名
        if (this.chordTypeSpan) {
            this.chordTypeSpan.textContent = selectedChord.name;
        }
        
        this.clearSelection();
        this.resetKeyboardStates();
        
        if (this.resultDiv) {
            this.resultDiv.textContent = '';
            this.resultDiv.className = 'result-message';
        }
        
        if (this.newQuestionBtn) {
            this.newQuestionBtn.disabled = true;
        }
        
        if (this.playArpeggioBtn) {
            this.playArpeggioBtn.disabled = true;
        }
        
        // 隐藏半音关系图表
        if (this.chordIntervalChart) {
            this.chordIntervalChart.style.display = 'none';
        }
        
        // 自动播放和弦
        setTimeout(() => {
            this.playChord();
        }, 500);
        
        console.log('新题目已生成，正在自动播放和弦...');
    }
    
    selectChordByErrorRate() {
        // 如果总题数少于和弦类型数，随机选择
        if (this.score.total < this.chordList.length) {
            return this.chordList[Math.floor(Math.random() * this.chordList.length)];
        }
        
        // 计算权重：错误率越高，权重越大
        const weights = this.chordList.map(chord => {
            const stat = this.chordStats[chord.id];
            if (stat.total === 0) return 1;
            return Math.max(0.1, stat.errorRate + 0.1);
        });
        
        // 加权随机选择
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return this.chordList[i];
            }
        }
        
        return this.chordList[Math.floor(Math.random() * this.chordList.length)];
    }
    
    selectNote(noteIndex, octave = 4) {
        const noteKey = `${noteIndex}-${octave}`;
        console.log('Selecting note:', noteIndex, 'octave:', octave, 'Current selection:', this.selectedNotes);
        
        const existingIndex = this.selectedNotes.findIndex(n => n.noteKey === noteKey);
        
        if (existingIndex !== -1) {
            // 如果已选择，则取消选择
            this.selectedNotes.splice(existingIndex, 1);
            console.log('Note deselected. Current selection:', this.selectedNotes);
        } else {
            // 如果未选择且还没达到3个音符的限制，则添加选择
            if (this.selectedNotes.length >= 3) {
                console.log('Already selected 3 notes');
                return;
            }
            this.selectedNotes.push({ noteIndex, octave, noteKey });
            console.log('Note selected. Current selection:', this.selectedNotes);
        }
        
        this.updateSelectedNotesDisplay();
        this.updateKeyboardStates();
        
        // 更新提交按钮状态
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = this.selectedNotes.length !== 3;
        }
    }
    
    clearSelection() {
        console.log('Clearing selection');
        this.selectedNotes = [];
        this.updateSelectedNotesDisplay();
        this.updateKeyboardStates();
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = true;
        }
    }
    
    updateSelectedNotesDisplay() {
        if (!this.selectedNotesDiv) return;
        
        if (this.selectedNotes.length === 0) {
            this.selectedNotesDiv.textContent = '请选择3个音符';
        } else {
            const noteNames = this.selectedNotes.map(note => 
                `${this.chromaticNotes[note.noteIndex].name}${note.octave}`
            );
            this.selectedNotesDiv.textContent = noteNames.join(' - ');
        }
    }
    
    updateKeyboardStates() {
        const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
        keys.forEach(key => {
            key.classList.remove('selected');
            const noteIndex = parseInt(key.dataset.note);
            const octave = parseInt(key.dataset.octave);
            const noteKey = `${noteIndex}-${octave}`;
            
            if (this.selectedNotes.some(n => n.noteKey === noteKey)) {
                key.classList.add('selected');
            }
        });
    }
    
    resetKeyboardStates() {
        const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
        keys.forEach(key => {
            key.classList.remove('selected', 'correct', 'incorrect', 'disabled');
        });
    }
    
    checkAnswer() {
        console.log('Checking answer. Selected:', this.selectedNotes, 'Correct:', this.currentChord.notes);
        
        if (!this.currentChord || this.selectedNotes.length !== 3) {
            console.log('Invalid answer state');
            return;
        }
        
        // 禁用所有按钮
        const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
        keys.forEach(key => {
            key.classList.add('disabled');
        });
        
        if (this.submitAnswerBtn) {
            this.submitAnswerBtn.disabled = true;
        }
        
        // 更新统计
        this.score.total++;
        this.chordStats[this.currentChord.id].total++;
        
        // 检查答案（顺序重要，第一个音必须是根音）
        const correctNotes = [...this.currentChord.notes];
        const selectedNoteIndices = this.selectedNotes.map(n => n.noteIndex);
        
        // 检查是否包含相同的音符（不考虑顺序）
        const containsSameNotes = correctNotes.length === selectedNoteIndices.length && 
            correctNotes.every(note => selectedNoteIndices.includes(note));
            
        // 检查根音是否正确（第一个音必须是根音）
        const rootIsCorrect = selectedNoteIndices[0] === correctNotes[0];
        
        // 只有当包含相同的音符且根音正确时，答案才正确
        const isCorrect = containsSameNotes && rootIsCorrect;
        
        console.log('Answer check:', { correctNotes, selectedNoteIndices, isCorrect });
        
        if (isCorrect) {
            // 正确答案
            this.score.correct++;
            this.chordStats[this.currentChord.id].correct++;
            this.selectedNotes.forEach(note => {
                const key = this.pianoKeyboard.querySelector(`[data-note="${note.noteIndex}"][data-octave="${note.octave}"]`);
                if (key) key.classList.add('correct');
            });
            if (this.resultDiv) {
                this.resultDiv.textContent = `正确！这是 ${this.currentChord.name}`;
                this.resultDiv.className = 'result-message correct';
            }
        } else {
            // 错误答案
            this.selectedNotes.forEach(note => {
                const key = this.pianoKeyboard.querySelector(`[data-note="${note.noteIndex}"][data-octave="${note.octave}"]`);
                if (key) key.classList.add('incorrect');
            });
            
            // 显示正确答案（在C4八度）
            this.currentChord.notes.forEach((noteIndex, i) => {
                const key = this.pianoKeyboard.querySelector(`[data-note="${noteIndex}"][data-octave="4"]`);
                if (key) {
                    key.classList.add('correct');
                    // 特别标记根音
                    if (i === 0) {
                        key.classList.add('root');
                    }
                }
            });
            
            const correctNames = this.currentChord.notes.map((index, i) => {
                const noteName = `${this.chromaticNotes[index].name}4`;
                // 为根音添加标记
                return i === 0 ? `${noteName}(根音)` : noteName;
            });
            
            // 检查根音是否正确
            const rootIsCorrect = selectedNoteIndices[0] === correctNotes[0];
            let errorMessage = `错误！正确答案是：${correctNames.join(' - ')}`;
            
            // 如果根音不正确，特别提示
            if (!rootIsCorrect && containsSameNotes) {
                errorMessage += `\n注意：第一个音必须是根音(${this.chromaticNotes[correctNotes[0]].name})！`;
            }
            
            if (this.resultDiv) {
                this.resultDiv.textContent = errorMessage;
                this.resultDiv.className = 'result-message incorrect';
            }
        }
        
        // 显示半音关系图表
        this.renderChordIntervalChart(correctNotes);
        
        // 更新错误率
        this.updateChordErrorRate(this.currentChord.id);
        
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
    
    updateChordErrorRate(chordId) {
        const stat = this.chordStats[chordId];
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
        
        // 确保统计数据已初始化
        this.initializeChordStats();
        
        // 计算播放概率
        const playProbabilities = this.calculatePlayProbabilities();
        
        this.chordList.forEach((chord, index) => {
            const stat = this.chordStats[chord.id];
            // 添加安全检查
            if (!stat) {
                console.warn('Missing stat for chord:', chord.id);
                return;
            }
            
            const errorRate = stat.total > 0 ? ((stat.total - stat.correct) / stat.total * 100) : 0;
            const probability = playProbabilities[index] || 0;
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            let rateClass = 'low';
            if (errorRate > 50) rateClass = 'high';
            else if (errorRate > 25) rateClass = 'medium';
            
            statItem.innerHTML = `
                <div class="stat-chord">${chord.name}</div>
                <div class="stat-rate ${rateClass}">错误率: ${errorRate.toFixed(1)}%</div>
                <div class="stat-count">答题: ${stat.correct}/${stat.total}</div>
                <div class="stat-probability">概率: ${probability.toFixed(1)}%</div>
            `;
            
            this.statsGrid.appendChild(statItem);
        });
    }
    
    calculatePlayProbabilities() {
        // 如果总题数少于和弦类型数，每个和弦概率相等
        if (this.score.total < this.chordList.length) {
            const equalProb = 100 / this.chordList.length;
            return Array(this.chordList.length).fill(equalProb);
        }
        
        // 计算权重：错误率越高，权重越大
        const weights = this.chordList.map(chord => {
            const stat = this.chordStats[chord.id];
            if (stat.total === 0) return 1;
            return Math.max(0.1, stat.errorRate + 0.1);
        });
        
        // 转换为概率百分比
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        return weights.map(weight => (weight / totalWeight) * 100);
    }
    
    resetStats() {
        if (confirm('确定要重置所有统计数据吗？')) {
            this.chordStats = {};
            this.initializeChordStats();
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
            localStorage.setItem('chordTrainerStats', JSON.stringify({
                chordStats: this.chordStats,
                totalScore: this.score
            }));
        } catch (error) {
            console.warn('无法保存统计数据:', error);
        }
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('chordTrainerStats');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.chordStats) {
                    this.chordStats = data.chordStats;
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
    
    // 渲染和弦半音关系图表
    renderChordIntervalChart(chordNotes) {
        if (!this.chordIntervalChart || !this.intervalGrid) return;
        
        // 显示图表容器
        this.chordIntervalChart.style.display = 'block';
        
        // 清空现有内容
        this.intervalGrid.innerHTML = '';
        
        // 移除之前的和弦描述
        const oldDescription = this.chordIntervalChart.querySelector('.chord-description');
        if (oldDescription) {
            oldDescription.remove();
        }
        
        // 获取根音（第一个音符）
        const rootNote = chordNotes[0];
        
        // 创建12个半音格子
        for (let i = 0; i < 12; i++) {
            const cell = document.createElement('div');
            cell.className = 'interval-cell';
            
            // 标记和弦中的音符
            if (chordNotes.includes(i)) {
                cell.classList.add('active');
                
                // 添加音符角色标签（根音、3音、5音）
                const labelDiv = document.createElement('div');
                labelDiv.className = 'interval-cell-label';
                
                // 确定音符在和弦中的角色
                const noteIndex = chordNotes.indexOf(i);
                if (i === rootNote) {
                    cell.classList.add('root');
                    labelDiv.textContent = '根音';
                } else if (noteIndex === 1) {
                    labelDiv.textContent = '3音';
                } else if (noteIndex === 2) {
                    labelDiv.textContent = '5音';
                }
                
                cell.appendChild(labelDiv);
            }
            
            // 添加音符名称提示
            const noteName = this.chromaticNotes[i].name;
            cell.title = noteName;
            
            this.intervalGrid.appendChild(cell);
        }
        
        // 计算和弦内音符之间的半音间隔（相对于根音）
        const intervals = [];
        for (let i = 1; i < chordNotes.length; i++) {
            const interval = (chordNotes[i] - rootNote + 12) % 12;
            intervals.push(interval);
        }
        
        // 添加和弦类型说明
        let chordDescription = '';
        if (intervals.length >= 2) {
            if (intervals[0] === 4 && intervals[1] === 7) {
                chordDescription = '大三和弦 (根音+大三度+纯五度)';
            } else if (intervals[0] === 3 && intervals[1] === 7) {
                chordDescription = '小三和弦 (根音+小三度+纯五度)';
            } else if (intervals[0] === 3 && intervals[1] === 6) {
                chordDescription = '减三和弦 (根音+小三度+减五度)';
            } else if (intervals[0] === 4 && intervals[1] === 8) {
                chordDescription = '增三和弦 (根音+大三度+增五度)';
            } else {
                chordDescription = `自定义和弦 (根音+${intervals[0]}半音+${intervals[1]}半音)`;
            }
        }
        
        // 添加和弦描述
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'chord-description';
        descriptionDiv.textContent = chordDescription;
        this.chordIntervalChart.appendChild(descriptionDiv);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ChordTrainer');
    new ChordTrainer();
});