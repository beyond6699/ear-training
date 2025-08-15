// chord-practice.js
const audioContext = wx.createInnerAudioContext();

// 和弦类型定义
const chordTypes = [
  { name: '大三和弦', intervals: [0, 4, 7], symbol: 'maj' },
  { name: '小三和弦', intervals: [0, 3, 7], symbol: 'min' },
  { name: '增三和弦', intervals: [0, 4, 8], symbol: 'aug' },
  { name: '减三和弦', intervals: [0, 3, 6], symbol: 'dim' },
  { name: '大七和弦', intervals: [0, 4, 7, 11], symbol: 'maj7' },
  { name: '属七和弦', intervals: [0, 4, 7, 10], symbol: '7' },
  { name: '小七和弦', intervals: [0, 3, 7, 10], symbol: 'min7' },
  { name: '半减七和弦', intervals: [0, 3, 6, 10], symbol: 'm7b5' },
  { name: '减七和弦', intervals: [0, 3, 6, 9], symbol: 'dim7' }
];

// 音符名称
const noteNames = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

// 音符频率映射（基于A4 = 440Hz的标准音高）
const noteFrequencies = {
  'C': 261.63, // C4
  'C♯/D♭': 277.18,
  'D': 293.66,
  'D♯/E♭': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F♯/G♭': 369.99,
  'G': 392.00,
  'G♯/A♭': 415.30,
  'A': 440.00, // A4
  'A♯/B♭': 466.16,
  'B': 493.88
};

Page({
  data: {
    pianoKeys: [],
    chordType: '',
    selectedNotes: [],
    selectedNotesText: '请选择3个音符',
    canSubmit: false,
    canPlayArpeggio: false,
    showNewQuestion: false,
    resultMessage: '',
    resultClass: '',
    correctCount: 0,
    totalCount: 0,
    accuracy: 0,
    showIntervalChart: false,
    intervalCells: [],
    chordDescription: ''
  },

  // 页面加载时执行
  onLoad: function() {
    this.createPianoKeyboard();
    this.generateNewChord();
  },

  // 页面卸载时执行
  onUnload: function() {
    audioContext.destroy();
  },

  // 创建钢琴键盘
  createPianoKeyboard: function() {
    const whiteKeyWidth = 40; // 白键宽度
    const blackKeyWidth = 24; // 黑键宽度
    const whiteKeyHeight = 160; // 白键高度
    const blackKeyHeight = 100; // 黑键高度
    
    const keys = [];
    let whiteKeyCount = 0;
    
    // 创建两个八度的键盘（C3-B4）
    for (let octave = 3; octave <= 4; octave++) {
      for (let i = 0; i < 12; i++) {
        const isBlack = [1, 3, 6, 8, 10].includes(i);
        const note = noteNames[i];
        const midi = (octave + 1) * 12 + i; // MIDI编号
        
        if (isBlack) {
          // 黑键
          const prevWhiteKeyLeft = whiteKeyCount * whiteKeyWidth;
          const offset = (i === 1 || i === 6) ? blackKeyWidth * 0.7 : blackKeyWidth * 0.5;
          
          keys.push({
            id: `${note}-${octave}`,
            type: 'black',
            note: `${note.split('/')[0]}${octave}`, // 使用升号表示
            label: `${note.split('/')[0]}${octave}`,
            midi: midi,
            left: prevWhiteKeyLeft - offset,
            width: blackKeyWidth,
            height: blackKeyHeight,
            selected: false,
            state: ''
          });
        } else {
          // 白键
          keys.push({
            id: `${note}-${octave}`,
            type: 'white',
            note: `${note}${octave}`,
            label: `${note}${octave}`,
            midi: midi,
            left: whiteKeyCount * whiteKeyWidth,
            width: whiteKeyWidth,
            height: whiteKeyHeight,
            selected: false,
            state: ''
          });
          
          whiteKeyCount++;
        }
      }
    }
    
    // 按照从左到右的顺序排序
    keys.sort((a, b) => a.left - b.left);
    
    this.setData({
      pianoKeys: keys
    });
  },

  // 生成新的和弦问题
  generateNewChord: function() {
    // 随机选择一个和弦类型（暂时只使用三和弦）
    const chordTypeIndex = Math.floor(Math.random() * 4); // 只使用前4种和弦类型
    const selectedChordType = chordTypes[chordTypeIndex];
    
    // 随机选择一个根音（C3-B3范围内）
    const rootNoteIndex = Math.floor(Math.random() * 12);
    const rootNote = noteNames[rootNoteIndex];
    const rootOctave = 3;
    
    // 生成和弦音符
    this.currentChord = {
      type: selectedChordType,
      root: rootNote,
      rootOctave: rootOctave,
      notes: []
    };
    
    // 计算和弦中的音符
    selectedChordType.intervals.forEach(interval => {
      const noteIndex = (rootNoteIndex + interval) % 12;
      const octaveOffset = Math.floor((rootNoteIndex + interval) / 12);
      const noteName = noteNames[noteIndex];
      const noteOctave = rootOctave + octaveOffset;
      
      this.currentChord.notes.push({
        name: noteName,
        octave: noteOctave,
        fullName: `${noteName}${noteOctave}`
      });
    });
    
    // 更新显示
    this.setData({
      chordType: `${rootNote} ${selectedChordType.name}`,
      selectedNotes: [],
      selectedNotesText: '请选择3个音符',
      canSubmit: false,
      canPlayArpeggio: false,
      showNewQuestion: false,
      resultMessage: '',
      resultClass: '',
      showIntervalChart: false
    });
    
    // 重置键盘状态
    const updatedKeys = this.data.pianoKeys.map(key => {
      return {
        ...key,
        selected: false,
        state: ''
      };
    });
    
    this.setData({
      pianoKeys: updatedKeys
    });
    
    // 播放和弦
    setTimeout(() => {
      this.playChord();
    }, 500);
  },

  // 处理钢琴键点击
  onKeyPress: function(e) {
    if (this.data.showNewQuestion) return; // 如果已经显示"下一题"按钮，则不允许再选择
    
    const note = e.currentTarget.dataset.note;
    const midi = e.currentTarget.dataset.midi;
    
    // 查找点击的键
    const keyIndex = this.data.pianoKeys.findIndex(key => key.note === note);
    if (keyIndex === -1) return;
    
    const updatedKeys = [...this.data.pianoKeys];
    const key = updatedKeys[keyIndex];
    
    // 如果已经选中，则取消选中
    if (key.selected) {
      key.selected = false;
      
      // 从已选择的音符中移除
      const selectedNotes = this.data.selectedNotes.filter(n => n.note !== note);
      
      this.setData({
        pianoKeys: updatedKeys,
        selectedNotes: selectedNotes,
        selectedNotesText: selectedNotes.length > 0 ? selectedNotes.map(n => n.note).join(', ') : '请选择3个音符',
        canSubmit: selectedNotes.length === 3
      });
    } 
    // 如果未选中且已选择的音符少于3个，则选中
    else if (this.data.selectedNotes.length < 3) {
      key.selected = true;
      
      // 添加到已选择的音符中
      const selectedNotes = [...this.data.selectedNotes, { note, midi }];
      
      this.setData({
        pianoKeys: updatedKeys,
        selectedNotes: selectedNotes,
        selectedNotesText: selectedNotes.map(n => n.note).join(', '),
        canSubmit: selectedNotes.length === 3
      });
      
      // 播放音符
      this.playNote(note);
    }
  },

  // 清除选择
  clearSelection: function() {
    const updatedKeys = this.data.pianoKeys.map(key => {
      return {
        ...key,
        selected: false
      };
    });
    
    this.setData({
      pianoKeys: updatedKeys,
      selectedNotes: [],
      selectedNotesText: '请选择3个音符',
      canSubmit: false
    });
  },

  // 提交答案
  submitAnswer: function() {
    if (this.data.selectedNotes.length !== 3) return;
    
    // 获取正确答案
    const correctNotes = this.currentChord.notes.slice(0, 3); // 只取前三个音符（三和弦）
    
    // 检查答案是否正确（不考虑八度）
    let isCorrect = true;
    const selectedNoteNames = this.data.selectedNotes.map(n => n.note.replace(/\d+$/, '')); // 移除八度数字
    
    // 检查是否包含所有正确的音符（不考虑顺序和八度）
    for (const correctNote of correctNotes) {
      const correctNoteName = correctNote.name.split('/')[0]; // 使用升号表示
      if (!selectedNoteNames.some(name => name.startsWith(correctNoteName))) {
        isCorrect = false;
        break;
      }
    }
    
    // 更新统计
    const totalCount = this.data.totalCount + 1;
    const correctCount = isCorrect ? this.data.correctCount + 1 : this.data.correctCount;
    const accuracy = Math.round((correctCount / totalCount) * 100);
    
    // 更新键盘状态
    const updatedKeys = [...this.data.pianoKeys];
    
    // 标记所有选中的键
    this.data.selectedNotes.forEach(selectedNote => {
      const keyIndex = updatedKeys.findIndex(key => key.note === selectedNote.note);
      if (keyIndex !== -1) {
        updatedKeys[keyIndex].state = isCorrect ? 'correct' : 'incorrect';
      }
    });
    
    // 如果答案错误，标记正确的键
    if (!isCorrect) {
      correctNotes.forEach(correctNote => {
        // 找到对应八度的键
        const keyIndex = updatedKeys.findIndex(key => 
          key.note.startsWith(correctNote.name.split('/')[0]) && 
          key.note.endsWith(correctNote.octave.toString())
        );
        
        if (keyIndex !== -1 && !updatedKeys[keyIndex].state) {
          updatedKeys[keyIndex].state = 'correct';
          // 标记根音
          if (correctNote.name === this.currentChord.root) {
            updatedKeys[keyIndex].state += ' root';
          }
        }
      });
    }
    
    // 创建半音关系图
    const intervalCells = this.createIntervalCells();
    
    // 生成和弦描述
    const chordDescription = this.generateChordDescription();
    
    // 更新UI
    this.setData({
      pianoKeys: updatedKeys,
      resultMessage: isCorrect ? '正确！' : '错误！请查看正确答案。',
      resultClass: isCorrect ? 'correct' : 'incorrect',
      showNewQuestion: true,
      canPlayArpeggio: true,
      correctCount: correctCount,
      totalCount: totalCount,
      accuracy: accuracy,
      showIntervalChart: true,
      intervalCells: intervalCells,
      chordDescription: chordDescription
    });
  },

  // 创建半音关系图
  createIntervalCells: function() {
    const cells = [];
    
    // 创建12个半音格子
    for (let i = 0; i < 12; i++) {
      const isActive = this.currentChord.type.intervals.includes(i);
      const isRoot = i === 0; // 根音是第一个音符
      
      cells.push({
        index: i,
        active: isActive,
        root: isRoot,
        label: i.toString()
      });
    }
    
    return cells;
  },

  // 生成和弦描述
  generateChordDescription: function() {
    const chordType = this.currentChord.type;
    const root = this.currentChord.root;
    
    let description = `${root} ${chordType.name} (${root}${chordType.symbol})`;
    
    // 添加和弦结构描述
    switch (chordType.name) {
      case '大三和弦':
        description += '\n大三度 + 小三度 = 纯五度';
        break;
      case '小三和弦':
        description += '\n小三度 + 大三度 = 纯五度';
        break;
      case '增三和弦':
        description += '\n大三度 + 大三度 = 增五度';
        break;
      case '减三和弦':
        description += '\n小三度 + 小三度 = 减五度';
        break;
      case '大七和弦':
        description += '\n大三和弦 + 大七度';
        break;
      case '属七和弦':
        description += '\n大三和弦 + 小七度';
        break;
      case '小七和弦':
        description += '\n小三和弦 + 小七度';
        break;
      case '半减七和弦':
        description += '\n减三和弦 + 小七度';
        break;
      case '减七和弦':
        description += '\n减三和弦 + 减七度';
        break;
    }
    
    return description;
  },

  // 获取音符频率
  getNoteFrequency: function(note) {
    // 提取音符名称和八度（例如：C4, D♯3）
    const noteName = note.replace(/\d+$/, '');
    const octave = parseInt(note.match(/\d+$/) || ['4'][0]);
    
    // 基础频率映射（基于A4 = 440Hz）
    const baseFrequencies = {
      'C': 261.63,
      'C♯': 277.18,
      'D♭': 277.18,
      'D': 293.66,
      'D♯': 311.13,
      'E♭': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F♯': 369.99,
      'G♭': 369.99,
      'G': 392.00,
      'G♯': 415.30,
      'A♭': 415.30,
      'A': 440.00,
      'A♯': 466.16,
      'B♭': 466.16,
      'B': 493.88
    };
    
    // 获取基础频率
    let frequency = baseFrequencies[noteName] || 440;
    
    // 根据八度调整频率
    const octaveDiff = octave - 4; // 相对于第4个八度
    if (octaveDiff !== 0) {
      frequency *= Math.pow(2, octaveDiff);
    }
    
    return frequency;
  },
  
  // 播放音符
  playTone: function(frequency, duration = 500) {
    const audioCtx = wx.createWebAudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine'; // 正弦波
    oscillator.frequency.value = frequency; // 设置频率
    
    // 设置音量渐变
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration / 1000);
    
    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 开始播放
    oscillator.start();
    
    // 设置定时器停止播放
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, duration);
    
    return { oscillator, audioCtx };
  },

  // 播放和弦
  playChord: function() {
    console.log('播放和弦:', this.currentChord);
    
    try {
      // 获取和弦中的音符频率
      const frequencies = this.currentChord.notes.map(note => 
        this.getNoteFrequency(`${note.name}${note.octave}`)
      );
      
      // 同时播放所有音符
      frequencies.forEach(freq => {
        this.playTone(freq, 1000);
      });
      
      // 显示提示
      wx.showToast({
        title: '播放和弦: ' + this.currentChord.root + this.currentChord.type.name,
        icon: 'none',
        duration: 2000
      });
    } catch (error) {
      console.error('播放和弦错误:', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 播放琶音
  playArpeggio: function() {
    if (!this.data.canPlayArpeggio) return;
    
    console.log('播放琶音:', this.currentChord);
    
    try {
      // 获取和弦中的音符频率
      const frequencies = this.currentChord.notes.map(note => 
        this.getNoteFrequency(`${note.name}${note.octave}`)
      );
      
      // 依次播放音符（琶音效果）
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, 500);
        }, index * 300);
      });
      
      // 显示提示
      wx.showToast({
        title: '播放琶音: ' + this.currentChord.root + this.currentChord.type.name,
        icon: 'none',
        duration: 2000
      });
    } catch (error) {
      console.error('播放琶音错误:', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 播放单个音符
  playNote: function(note) {
    console.log('播放音符:', note);
    
    try {
      // 获取音符频率
      const frequency = this.getNoteFrequency(note);
      
      // 播放音符
      this.playTone(frequency, 500);
    } catch (error) {
      console.error('播放音符错误:', error);
    }
  },

  // 下一题
  newQuestion: function() {
    this.generateNewChord();
  },

  // 重置统计
  resetStats: function() {
    this.setData({
      correctCount: 0,
      totalCount: 0,
      accuracy: 0
    });
    
    wx.showToast({
      title: '统计已重置',
      icon: 'success',
      duration: 1000
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '和弦练习 - 音乐练习中心',
      path: '/pages/chord-practice/chord-practice'
    };
  }
});