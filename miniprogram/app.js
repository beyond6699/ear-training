// app.js
App({
  onLaunch: function () {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        // env 参数决定接下来小程序发起的云开发调用会默认请求到哪个云环境的资源
        // 此处请填入环境 ID, 环境 ID 可通过云控制台获取
        // 如不填则使用默认环境（第一个创建的环境）
        env: 'your-env-id',
        traceUser: true,
      });
    }

    this.globalData = {
      // 全局数据
    };
  }
});