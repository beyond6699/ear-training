// pitch-practice.js
Page({
  data: {
    currentNote: '',
    currentOctave: 4,
    selectedNote: '',
    selectedOctave: 4,
    resultMessage: '',
    resultClass: '',
    showNextButton: false,
    correctCount: 0,
    totalCount: 0,
    accuracy: 0
  },

  onLoad: function() {
    this.generateNewQuestion();
  },

  // 生成新的音高识别问题
  generateNewQuestion: function() {
    // 音符名称
    const noteNames = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
    
    // 随机选择一个音符
    const randomNoteIndex = Math.floor(Math.random() * noteNames.length);
    const randomNote = noteNames[randomNoteIndex];
    
    // 随机选择一个八度（3-5）
    const octaves = [3, 4, 5];
    const randomOctaveIndex = Math.floor(Math.random() * octaves.length);
    const randomOctave = octaves[randomOctaveIndex];
    
    this.setData({
      currentNote: randomNote,
      currentOctave: randomOctave,
      selectedNote: '',
      selectedOctave: 4, // 默认选择中间八度
      resultMessage: '',
      resultClass: '',
      showNextButton: false
    });
  },

  // 获取音符频率
  getNoteFrequency: function(note, octave) {
    // 音符名称
    const noteName = note.split('/')[0]; // 使用升号表示，如果有多个名称
    
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
    try {
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
    } catch (error) {
      console.error('播放音符错误:', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 1000
      });
      return null;
    }
  },

  // 播放当前音符
  playNote: function() {
    try {
      // 获取音符频率
      const frequency = this.getNoteFrequency(this.data.currentNote, this.data.currentOctave);
      
      // 播放音符
      this.playTone(frequency, 1000);
      
      // 显示提示
      wx.showToast({
        title: `播放音符：${this.data.currentNote}${this.data.currentOctave}`,
        icon: 'none',
        duration: 2000
      });
    } catch (error) {
      console.error('播放音符错误:', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 播放参考音（A4 = 440Hz）
  playReference: function() {
    try {
      // A4 = 440Hz
      const frequency = 440;
      
      // 播放音符
      this.playTone(frequency, 1000);
      
      // 显示提示
      wx.showToast({
        title: '播放参考音：A4 (440Hz)',
        icon: 'none',
        duration: 2000
      });
    } catch (error) {
      console.error('播放参考音错误:', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 选择音符
  selectNote: function(e) {
    const note = e.currentTarget.dataset.note;
    
    this.setData({
      selectedNote: note
    });
  },

  // 选择八度
  selectOctave: function(e) {
    const octave = parseInt(e.currentTarget.dataset.octave);
    
    this.setData({
      selectedOctave: octave
    });
  },

  // 提交答案
  submitAnswer: function() {
    if (!this.data.selectedNote) {
      wx.showToast({
        title: '请先选择一个音符',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    const isCorrectNote = this.data.selectedNote === this.data.currentNote;
    const isCorrectOctave = this.data.selectedOctave === this.data.currentOctave;
    const isFullyCorrect = isCorrectNote && isCorrectOctave;
    
    // 更新统计
    const totalCount = this.data.totalCount + 1;
    const correctCount = isFullyCorrect ? this.data.correctCount + 1 : this.data.correctCount;
    const accuracy = Math.round((correctCount / totalCount) * 100);
    
    let resultMessage = '';
    if (isFullyCorrect) {
      resultMessage = '正确！';
    } else if (isCorrectNote) {
      resultMessage = `音符正确，但八度错误。正确答案是：${this.data.currentNote}${this.data.currentOctave}`;
    } else {
      resultMessage = `错误！正确答案是：${this.data.currentNote}${this.data.currentOctave}`;
    }
    
    this.setData({
      resultMessage: resultMessage,
      resultClass: isFullyCorrect ? 'correct' : 'incorrect',
      showNextButton: true,
      correctCount: correctCount,
      totalCount: totalCount,
      accuracy: accuracy
    });
  },

  // 下一题
  nextQuestion: function() {
    this.generateNewQuestion();
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
      title: '音高训练 - 音乐练习中心',
      path: '/pages/pitch-practice/pitch-practice'
    };
  }
});
