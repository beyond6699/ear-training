// fretboard-practice.js
const audioContext = wx.createInnerAudioContext();

// 定义吉他的标准调弦（从6弦到1弦）
const standardTuning = ['E', 'A', 'D', 'G', 'B', 'E'];

// 所有音名（包括升降号）
const allNotes = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

// 自然音（不包含升降号）
const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

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
    difficulties: ['简单 (只有自然音)', '中等 (包含升降号)', '困难 (所有音名，更快节奏)'],
    difficultyIndex: 1,
    fretRanges: ['0-5品', '0-12品', '0-15品'],
    fretRangeIndex: 1,
    currentNote: '',
    timerProgress: 100,
    correctCount: 0,
    wrongCount: 0,
    accuracy: 0,
    feedback: '',
    feedbackClass: '',
    isPlaying: false,
    fretboardCreated: false
  },

  // 页面加载时执行
  onLoad: function() {
    // 初始化
    this.timePerNote = 5000; // 默认每个音符5秒
    this.fretRange = { min: 0, max: 12 }; // 默认品格范围
  },

  // 页面显示时执行
  onShow: function() {
    if (!this.data.fretboardCreated) {
      this.createFretboard();
      this.createFretMarkers();
      this.setData({
        fretboardCreated: true
      });
    }
  },

  // 页面卸载时执行
  onUnload: function() {
    this.stopPractice();
    audioContext.destroy();
  },

  // 难度选择改变事件
  onDifficultyChange: function(e) {
    this.setData({
      difficultyIndex: e.detail.value
    });
    this.updateDifficulty();
  },

  // 品格范围选择改变事件
  onFretRangeChange: function(e) {
    this.setData({
      fretRangeIndex: e.detail.value
    });
    this.updateFretRange();
  },

  // 更新难度设置
  updateDifficulty: function() {
    const difficulty = this.data.difficultyIndex;
    
    switch (difficulty) {
      case 0: // 简单
        this.timePerNote = 7000; // 7秒
        break;
      case 1: // 中等
        this.timePerNote = 5000; // 5秒
        break;
      case 2: // 困难
        this.timePerNote = 3000; // 3秒
        break;
    }
  },

  // 更新品格范围
  updateFretRange: function() {
    const range = this.data.fretRangeIndex;
    
    switch (range) {
      case 0: // 0-5品
        this.fretRange = { min: 0, max: 5 };
        break;
      case 1: // 0-12品
        this.fretRange = { min: 0, max: 12 };
        break;
      case 2: // 0-15品
        this.fretRange = { min: 0, max: 15 };
        break;
    }
  },

  // 开始练习
  startPractice: function() {
    // 更新状态
    this.setData({
      isPlaying: true,
      correctCount: 0,
      wrongCount: 0,
      accuracy: 0,
      feedback: ''
    });
    
    // 更新难度和品格范围
    this.updateDifficulty();
    this.updateFretRange();
    
    // 生成第一个音符
    this.generateNewNote();
    
    // 开始计时器
    this.startTimer();
  },

  // 停止练习
  stopPractice: function() {
    // 更新状态
    this.setData({
      isPlaying: false,
      currentNote: '点击"开始练习"',
      timerProgress: 100,
      feedback: '',
      feedbackClass: ''
    });
    
    // 清除计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  // 生成新的随机音符
  generateNewNote: function() {
    const difficulty = this.data.difficultyIndex;
    let notePool;
    
    // 根据难度选择音符池
    if (difficulty === 0) { // 简单
      notePool = naturalNotes;
    } else { // 中等和困难
      notePool = allNotes;
    }
    
    // 随机选择一个音符
    const randomIndex = Math.floor(Math.random() * notePool.length);
    const newNote = notePool[randomIndex];
    
    // 更新显示
    this.setData({
      currentNote: newNote,
      feedback: '',
      feedbackClass: ''
    });
    
    // 播放音符声音
    this.playNote(newNote);
  },

  // 开始计时器
  startTimer: function() {
    // 重置进度条
    this.setData({
      timerProgress: 100
    });
    
    // 清除现有计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // 设置新计时器
    const startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingPercent = 100 - (elapsedTime / this.timePerNote * 100);
      
      if (remainingPercent <= 0) {
        // 时间到，记为错误
        this.setData({
          wrongCount: this.data.wrongCount + 1,
          timerProgress: 0,
          feedback: '时间到！',
          feedbackClass: 'wrong'
        });
        this.updateStats();
        
        // 生成新音符
        setTimeout(() => {
          if (this.data.isPlaying) {
            this.generateNewNote();
            this.startTimer();
          }
        }, 1000);
        
        clearInterval(this.timerInterval);
      } else {
        // 更新进度条
        this.setData({
          timerProgress: remainingPercent
        });
      }
    }, 50);
  },

  // 处理品格点击
  handleFretClick: function(e) {
    if (!this.data.isPlaying) return;
    
    const dataset = e.currentTarget.dataset;
    const clickedNote = dataset.note;
    const fretNumber = parseInt(dataset.fret);
    const stringNumber = parseInt(dataset.string);
    
    // 检查是否在当前品格范围内
    if (fretNumber < this.fretRange.min || fretNumber > this.fretRange.max) {
      return;
    }
    
    // 播放点击的音符
    this.playNote(clickedNote);
    
    // 检查是否正确
    const isCorrect = this.checkNote(clickedNote, this.data.currentNote);
    
    // 更新统计
    if (isCorrect) {
      // 添加正确样式
      this.highlightFret(stringNumber, fretNumber, 'correct');
      
      this.setData({
        correctCount: this.data.correctCount + 1,
        feedback: '正确！',
        feedbackClass: 'correct'
      });
    } else {
      // 添加错误样式
      this.highlightFret(stringNumber, fretNumber, 'wrong');
      
      // 显示详细的错误信息
      const errorMessage = `错误！目标音符是 ${this.data.currentNote}，但你选择了 ${clickedNote}`;
      
      this.setData({
        wrongCount: this.data.wrongCount + 1,
        feedback: errorMessage,
        feedbackClass: 'wrong'
      });
    }
    
    this.updateStats();
    
    // 生成新音符
    setTimeout(() => {
      if (this.data.isPlaying) {
        this.generateNewNote();
        this.startTimer();
      }
    }, 1000);
    
    // 清除计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  // 高亮显示品格
  highlightFret: function(stringNumber, fretNumber, className) {
    // 在小程序中，我们不能直接操作DOM，所以这里使用一个简单的延时来模拟高亮效果
    // 实际应用中，可以使用setData来更新一个状态数组，然后在wxml中绑定样式
    setTimeout(() => {
      // 在实际应用中，这里会清除高亮效果
    }, 1000);
  },

  // 检查音符是否匹配
  checkNote: function(playedNote, targetNote) {
    // 处理目标音符包含升降号的情况
    if (targetNote.includes('/')) {
      const [sharp, flat] = targetNote.split('/');
      // 处理用户选择的音符也包含升降号的情况
      if (playedNote.includes('/')) {
        const [playedSharp, playedFlat] = playedNote.split('/');
        return playedSharp === sharp || playedSharp === flat || 
               playedFlat === sharp || playedFlat === flat;
      }
      return playedNote === sharp || playedNote === flat;
    }
    
    // 处理用户选择的音符包含升降号，但目标音符不包含的情况
    if (playedNote.includes('/')) {
      const [playedSharp, playedFlat] = playedNote.split('/');
      return playedSharp === targetNote || playedFlat === targetNote;
    }
    
    return playedNote === targetNote;
  },

  // 更新统计数据
  updateStats: function() {
    const total = this.data.correctCount + this.data.wrongCount;
    const accuracy = total > 0 ? Math.round((this.data.correctCount / total) * 100) : 0;
    
    this.setData({
      accuracy: accuracy
    });
  },

  // 播放音符
  playNote: function(noteName) {
    try {
      // 处理包含升降号的音符
      let frequency;
      if (noteName.includes('/')) {
        // 使用升号部分（第一个音符）
        const sharpNote = noteName.split('/')[0];
        frequency = noteFrequencies[sharpNote] || noteFrequencies['A'];
      } else {
        frequency = noteFrequencies[noteName] || noteFrequencies['A'];
      }
      
      // 使用微信小程序的音频API
      const buffer = this.generateToneBuffer(frequency, 1.5);
      audioContext.stop();
      audioContext.src = buffer;
      audioContext.play();
    } catch (e) {
      console.error('播放音符时出错:', e);
    }
  },

  // 生成音频buffer
  generateToneBuffer: function(frequency, duration) {
    // 在实际应用中，这里应该使用微信小程序的音频API
    // 由于微信小程序不支持直接生成音频buffer，这里只是一个占位函数
    // 实际应用中，可以使用预先录制的音频文件，或者使用云函数生成音频
    
    // 返回一个占位URL，实际应用中应该返回一个有效的音频URL
    return `data:audio/wav;base64,UklGRiXuAgBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQHuAgCA`;
  },

  // 创建吉他指板
  createFretboard: function() {
    // 在小程序中，我们不能直接操作DOM，所以这里使用模板和数据绑定
    // 这个函数在实际应用中会初始化指板数据，然后通过setData更新到视图
    
    // 创建6根弦的数据
    const strings = [];
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
      const frets = [];
      for (let fretIndex = 0; fretIndex <= 15; fretIndex++) {
        // 计算这个位置的音符
        const note = this.calculateNote(standardTuning[5 - stringIndex], fretIndex);
        
        frets.push({
          string: stringIndex + 1,
          fret: fretIndex,
          note: note,
          isOpenString: fretIndex === 0,
          hasDot: [3, 5, 7, 9, 12, 15].includes(fretIndex)
        });
      }
      strings.push({
        stringNumber: stringIndex + 1,
        frets: frets
      });
    }
    
    // 更新数据，在实际应用中会触发视图更新
    // this.setData({ strings: strings });
  },

  // 创建品位标记
  createFretMarkers: function() {
    // 定义重要品位
    const importantFrets = [3, 5, 7, 9, 12, 15];
    
    // 只创建重要品位的标记和0品标记
    const fretsToShow = [0, ...importantFrets];
    
    // 计算品位的非线性分布
    const fretPositions = this.calculateFretPositions(16);
    
    // 创建品位标记数据
    const markers = fretsToShow.map(i => {
      return {
        number: i,
        position: fretPositions[i] * 100,
        isImportant: importantFrets.includes(i)
      };
    });
    
    // 更新数据，在实际应用中会触发视图更新
    // this.setData({ markers: markers });
  },

  // 计算品位的非线性分布
  calculateFretPositions: function(numFrets) {
    // 创建一个数组来存储每个品位的相对位置（0到1之间）
    const positions = [];
    
    // 使用公式计算每个品位的位置
    for (let i = 0; i < numFrets; i++) {
      // 使用简化的公式：position = 1 - (2^(-i/12))
      positions[i] = 1 - Math.pow(2, -i/12);
      
      // 缩放到0-1范围
      positions[i] = positions[i] / positions[numFrets - 1];
    }
    
    return positions;
  },

  // 计算指定弦上指定品位的音符
  calculateNote: function(openStringNote, fret) {
    // 找到开放弦音符在所有音符中的索引
    const noteIndex = allNotes.findIndex(note => {
      if (note.includes('/')) {
        const [sharp, flat] = note.split('/');
        return sharp === openStringNote || flat === openStringNote;
      }
      return note === openStringNote;
    });
    
    if (noteIndex === -1) return '';
    
    // 计算品位上的音符索引（加上品位数并取模）
    const newNoteIndex = (noteIndex + fret) % allNotes.length;
    
    return allNotes[newNoteIndex];
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '吉他指板熟悉度练习 - 音乐练习中心',
      path: '/pages/fretboard-practice/fretboard-practice'
    };
  }
});