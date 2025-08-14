// index.js
Page({
  data: {
    // 页面的初始数据
  },
  
  onLoad: function() {
    // 页面加载时执行
  },
  
  // 导航到和弦练习页面
  navigateToChordPractice: function() {
    wx.switchTab({
      url: '/pages/chord-practice/chord-practice'
    });
  },
  
  // 导航到吉他指板熟悉度页面
  navigateToFretboardPractice: function() {
    wx.switchTab({
      url: '/pages/fretboard-practice/fretboard-practice'
    });
  },
  
  onShareAppMessage: function() {
    // 用户点击右上角分享
    return {
      title: '音乐练习中心',
      path: '/pages/index/index'
    }
  }
})
