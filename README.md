# 音感练习器

这是一个基于Web的音感练习工具，帮助音乐学习者提高听力技能。

## 功能特点

1. **单音符识别练习**：训练识别单个音符的能力
2. **和弦识别练习**：训练识别不同和弦的能力
3. **和弦调性练习**：训练识别和弦调性特征的能力

## 技术实现

- 纯前端实现，使用HTML、CSS和JavaScript
- 使用Web Audio API生成音频
- 响应式设计，适配不同设备

## 使用方法

1. 克隆仓库到本地
2. 使用任何HTTP服务器运行项目（如http-server、live-server等）
3. 在浏览器中访问项目

```bash
# 使用http-server运行项目
npx http-server

# 然后访问 http://localhost:8080
```

## 项目结构

- `index.html` - 单音符识别练习页面
- `script.js` - 单音符识别练习的JavaScript逻辑
- `style.css` - 单音符识别练习的CSS样式
- `chord-practice.html` - 和弦识别练习页面
- `chord-script.js` - 和弦识别练习的JavaScript逻辑
- `chord-style.css` - 和弦识别练习的CSS样式
- `chord-type-practice.html` - 和弦调性练习页面
- `chord-type-script.js` - 和弦调性练习的JavaScript逻辑
- `chord-type-style.css` - 和弦调性练习的CSS样式
- `favicon.svg` - 网站图标

## 许可证

MIT