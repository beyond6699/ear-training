// chord-type-practice.js
Page({
  data: {
    currentChord: '',
    currentFunction: '',
    selectedOption: '',
    resultMessage: '请选择和弦的功能',
    resultClass: '',
    showNextButton: false,
    correctCount: 0,
    totalCount: 0,
    accuracy: 0
  },

  onLoad: function() {
    this.generateNewQuestion();
  },

  // 生成新的和弦功能问题
  generateNewQuestion: function() {
    // 和弦类型
    const chordTypes = [
      { name: '大三和弦', symbol: '' },
      { name: '小三和弦', symbol: 'm' },
      { name: '大七和弦', symbol: 'maj7' },
      { name: '属七和弦', symbol: '7' },
      { name: '小七和弦', symbol: 'm7' }
    ];
    
    // C大调中的和弦功能
    const chordFunctions = [
      { degree: 'I', root: 'C', type: 0 },    // C大三和弦
      { degree: 'ii', root: 'D', type: 1 },   // D小三和弦
      { degree: 'iii', root: 'E', type: 1 },  // E小三和弦
      { degree: 'IV', root: 'F', type: 0 },   // F大三和弦
      { degree: 'V', root: 'G', type: 0 },    // G大三和弦
      { degree: 'vi', root: 'A', type: 1 },   // A小三和弦
      { degree: 'vii°', root: 'B', type: 1 }  // B减三和弦（简化为小三和弦）
    ];
    
    // 随机选择一个和弦功能
    const randomIndex = Math.floor(Math.random() * chordFunctions.length);
    const selectedFunction = chordFunctions[randomIndex];
    
    // 根据和弦功能选择和弦类型
    const chordType = chordTypes[selectedFunction.type];
    
    // 构建和弦名称
    const chordName = `${selectedFunction.root}${chordType.symbol}`;
    
    this.setData({
      currentChord: `${selectedFunction.root}${chordType.name}`,
      currentFunction: selectedFunction.degree,
      selectedOption: '',
      resultMessage: '请选择和弦的功能',
      resultClass: '',
      showNextButton: false
    });
  },

  // 获取音符频率
  getNoteFrequency: function(note) {
    // 提取音符名称
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
  
  // 获取和弦频率
  getChordFrequencies: function(root, chordType) {
    // 根音
    const rootNote = root;
    
    // 和弦类型到音程的映射
    const chordIntervals = {
      '': [0, 4, 7], // 大三和弦
      'm': [0, 3, 7], // 小三和弦
      'maj7': [0, 4, 7, 11], // 大七和弦
      '7': [0, 4, 7, 10], // 属七和弦
      'm7': [0, 3, 7, 10] // 小七和弦
    };
    
    // 获取和弦的音程
    const intervals = chordIntervals[chordType] || chordIntervals[''];
    
    // 计算和弦中每个音符的频率
    const rootFreq = this.getNoteFrequency(rootNote + '4');
    const frequencies = intervals.map(interval => {
      // 计算音符的频率（相对于根音）
      return rootFreq * Math.pow(2, interval / 12);
    });
    
    return frequencies;
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

  // 播放和弦进行
  playProgression: function() {
    try {
      // C大调的和弦进行：I - IV - V - I
      const progressionRoots = ['C', 'F', 'G', 'C'];
      const progressionTypes = ['', '', '', ''];
      
      // 依次播放和弦
      progressionRoots.forEach((root, index) => {
        setTimeout(() => {
          const frequencies = this.getChordFrequencies(root, progressionTypes[index]);
          
          // 同时播放和弦中的所有音符
          frequencies.forEach(freq => {
            this.playTone(freq, 800);
          });
        }, index * 1000);
      });
      
      // 显示提示
      wx.showToast({
        title: '播放和弦进行：I - IV - V - I',
        icon: 'none',
        duration: 4000
      });
    } catch (error) {
      console.error('播放和弦进行错误:', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 播放当前和弦
  playCurrentChord: function() {
    try {
      // 从当前和弦名称中提取根音和类型
      const chordParts = this.data.currentChord.split(/(\d+)$/); // 分离和弦名称和数字
      const chordName = chordParts[0].trim();
      
      // 提取根音和和弦类型
      let root = '';
      let chordType = '';
      
      if (chordName.includes('小')) {
        root = chordName.split('小')[0];
        chordType = 'm';
      } else if (chordName.includes('大七')) {
        root = chordName.split('大七')[0];
        chordType = 'maj7';
      } else if (chordName.includes('属七')) {
        root = chordName.split('属七')[0];
        chordType = '7';
      } else if (chordName.includes('小七')) {
        root = chordName.split('小七')[0];
        chordType = 'm7';
      } else {
        root = chordName.split('大')[0];
        chordType = '';
      }
      
      // 获取和弦的频率
      const frequencies = this.getChordFrequencies(root, chordType);
      
      // 同时播放和弦中的所有音符
      frequencies.forEach(freq => {
        this.playTone(freq, 1000);
      });
      
      // 显示提示
      wx.showToast({
        title: '播放当前和弦: ' + this.data.currentChord,
        icon: 'none',
        duration: 2000
      });
    } catch (error) {
      console.error('播放当前和弦错误:', error);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 选择和弦功能
  selectOption: function(e) {
    if (this.data.showNextButton) return; // 如果已经显示"下一题"按钮，则不允许再选择
    
    const option = e.currentTarget.dataset.option;
    const isCorrect = option === this.data.currentFunction;
    
    // 更新统计
    const totalCount = this.data.totalCount + 1;
    const correctCount = isCorrect ? this.data.correctCount + 1 : this.data.correctCount;
    const accuracy = Math.round((correctCount / totalCount) * 100);
    
    this.setData({
      selectedOption: option,
      resultMessage: isCorrect ? '正确！' : `错误！正确答案是 ${this.data.currentFunction}`,
      resultClass: isCorrect ? 'correct' : 'incorrect',
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
      title: '和弦调性练习 - 音乐练习中心',
      path: '/pages/chord-type-practice/chord-type-practice'
    };
  }
});
