// 吉他指板熟悉度练习脚本

// 定义吉他的标准调弦（从6弦到1弦）
const standardTuning = ['E', 'A', 'D', 'G', 'B', 'E'];

// 所有音名（包括升降号）
const allNotes = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

// 自然音（不包含升降号）
const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// 初始化变量
let currentNote = '';
let timerInterval = null;
let timePerNote = 5000; // 默认每个音符5秒
let correctCount = 0;
let wrongCount = 0;
let isPlaying = false;
let fretRange = { min: 0, max: 12 }; // 默认品格范围

// DOM元素
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const difficultySelect = document.getElementById('difficulty');
const fretRangeSelect = document.getElementById('fret-range');
const currentNoteDisplay = document.getElementById('current-note');
const timerProgress = document.getElementById('timer-progress');
const correctCountDisplay = document.getElementById('correct-count');
const wrongCountDisplay = document.getElementById('wrong-count');
const accuracyDisplay = document.getElementById('accuracy');
const feedbackDisplay = document.getElementById('feedback');
const fretboardElement = document.querySelector('.fretboard');
const fretMarkersElement = document.querySelector('.fret-markers');

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    createFretboard();
    createFretMarkers();
    setupEventListeners();
});

// 创建吉他指板
function createFretboard() {
    // 清空现有内容
    fretboardElement.innerHTML = '';
    
    // 从第1弦（最细的）开始创建到第6弦（最粗的）
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        const stringElement = document.createElement('div');
        stringElement.className = 'string';
        stringElement.dataset.string = stringIndex + 1;
        
        // 为每个品位创建元素（0品到15品）
        for (let fretIndex = 0; fretIndex <= 15; fretIndex++) {
            const fretElement = document.createElement('div');
            fretElement.className = fretIndex === 0 ? 'fret open-string' : 'fret';
            fretElement.dataset.string = stringIndex + 1;
            fretElement.dataset.fret = fretIndex;
            
            // 计算这个位置的音符
            const note = calculateNote(standardTuning[5 - stringIndex], fretIndex);
            fretElement.dataset.note = note;
            
            // 添加点击事件
            fretElement.addEventListener('click', handleFretClick);
            
            // 添加到弦
            stringElement.appendChild(fretElement);
        }
        
        // 添加到指板
        fretboardElement.appendChild(stringElement);
    }
    
    // 添加指板上的装饰点
    addFretboardDots();
}

// 添加指板上的装饰点（3、5、7、9、12品位）
function addFretboardDots() {
    const dotPositions = [3, 5, 7, 9, 12, 15];
    
    // 对于每个弦
    document.querySelectorAll('.string').forEach(stringElement => {
        // 对于每个需要添加点的品位
        dotPositions.forEach(position => {
            const fret = stringElement.querySelector(`[data-fret="${position}"]`);
            if (fret) {
                // 第12品和第15品有双点，但我们在CSS中只显示单点
                fret.classList.add('fret-dot');
            }
        });
    });
}

// 创建品位标记
function createFretMarkers() {
    // 清空现有内容
    fretMarkersElement.innerHTML = '';
    
    // 创建0-15品的标记
    for (let i = 0; i <= 15; i++) {
        const markerElement = document.createElement('div');
        markerElement.className = 'fret-marker';
        markerElement.textContent = i;
        fretMarkersElement.appendChild(markerElement);
    }
}

// 设置事件监听器
function setupEventListeners() {
    startBtn.addEventListener('click', startPractice);
    stopBtn.addEventListener('click', stopPractice);
    
    // 难度选择改变事件
    difficultySelect.addEventListener('change', () => {
        updateDifficulty();
    });
    
    // 品格范围选择改变事件
    fretRangeSelect.addEventListener('change', () => {
        updateFretRange();
    });
}

// 更新难度设置
function updateDifficulty() {
    const difficulty = difficultySelect.value;
    
    switch (difficulty) {
        case 'easy':
            timePerNote = 7000; // 7秒
            break;
        case 'medium':
            timePerNote = 5000; // 5秒
            break;
        case 'hard':
            timePerNote = 3000; // 3秒
            break;
    }
}

// 更新品格范围
function updateFretRange() {
    const range = fretRangeSelect.value;
    
    switch (range) {
        case '0-5':
            fretRange = { min: 0, max: 5 };
            break;
        case '0-12':
            fretRange = { min: 0, max: 12 };
            break;
        case '0-15':
            fretRange = { min: 0, max: 15 };
            break;
    }
}

// 开始练习
function startPractice() {
    // 更新状态
    isPlaying = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    difficultySelect.disabled = true;
    fretRangeSelect.disabled = true;
    
    // 重置计数
    correctCount = 0;
    wrongCount = 0;
    updateStats();
    
    // 更新难度和品格范围
    updateDifficulty();
    updateFretRange();
    
    // 生成第一个音符
    generateNewNote();
    
    // 开始计时器
    startTimer();
}

// 停止练习
function stopPractice() {
    // 更新状态
    isPlaying = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    difficultySelect.disabled = false;
    fretRangeSelect.disabled = false;
    
    // 清除计时器
    clearInterval(timerInterval);
    
    // 重置显示
    currentNoteDisplay.textContent = '点击"开始练习"';
    timerProgress.style.width = '100%';
    feedbackDisplay.textContent = '';
    feedbackDisplay.className = 'feedback';
}

// 生成新的随机音符
function generateNewNote() {
    const difficulty = difficultySelect.value;
    let notePool;
    
    // 根据难度选择音符池
    if (difficulty === 'easy') {
        notePool = naturalNotes;
    } else {
        notePool = allNotes;
    }
    
    // 随机选择一个音符
    const randomIndex = Math.floor(Math.random() * notePool.length);
    currentNote = notePool[randomIndex];
    
    // 更新显示
    currentNoteDisplay.textContent = currentNote;
    feedbackDisplay.textContent = '';
    feedbackDisplay.className = 'feedback';
}

// 开始计时器
function startTimer() {
    // 重置进度条
    timerProgress.style.width = '100%';
    
    // 清除现有计时器
    clearInterval(timerInterval);
    
    // 设置新计时器
    const startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingPercent = 100 - (elapsedTime / timePerNote * 100);
        
        if (remainingPercent <= 0) {
            // 时间到，记为错误
            wrongCount++;
            updateStats();
            showFeedback(false, '时间到！');
            
            // 生成新音符
            setTimeout(() => {
                if (isPlaying) {
                    generateNewNote();
                    startTimer();
                }
            }, 1000);
            
            clearInterval(timerInterval);
        } else {
            // 更新进度条
            timerProgress.style.width = `${remainingPercent}%`;
        }
    }, 50);
}

// 处理品格点击
function handleFretClick(event) {
    if (!isPlaying) return;
    
    const clickedFret = event.target;
    const clickedNote = clickedFret.dataset.note;
    
    // 检查是否在当前品格范围内
    const fretNumber = parseInt(clickedFret.dataset.fret);
    if (fretNumber < fretRange.min || fretNumber > fretRange.max) {
        return;
    }
    
    // 检查是否正确
    const isCorrect = checkNote(clickedNote, currentNote);
    
    // 更新统计
    if (isCorrect) {
        correctCount++;
        clickedFret.classList.add('correct');
        setTimeout(() => {
            clickedFret.classList.remove('correct');
        }, 1000);
        showFeedback(true, '正确！');
    } else {
        wrongCount++;
        clickedFret.classList.add('wrong');
        setTimeout(() => {
            clickedFret.classList.remove('wrong');
        }, 1000);
        showFeedback(false, '错误！');
    }
    
    updateStats();
    
    // 生成新音符
    setTimeout(() => {
        if (isPlaying) {
            generateNewNote();
            startTimer();
        }
    }, 1000);
    
    // 清除计时器
    clearInterval(timerInterval);
}

// 检查音符是否匹配
function checkNote(playedNote, targetNote) {
    // 处理包含升降号的情况
    if (targetNote.includes('/')) {
        const [sharp, flat] = targetNote.split('/');
        return playedNote === sharp || playedNote === flat;
    }
    
    return playedNote === targetNote;
}

// 显示反馈
function showFeedback(isCorrect, message) {
    feedbackDisplay.textContent = message;
    feedbackDisplay.className = isCorrect ? 'feedback correct' : 'feedback wrong';
}

// 更新统计数据
function updateStats() {
    correctCountDisplay.textContent = correctCount;
    wrongCountDisplay.textContent = wrongCount;
    
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    accuracyDisplay.textContent = `${accuracy}%`;
}

// 计算指定弦上指定品位的音符
function calculateNote(openStringNote, fret) {
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
}