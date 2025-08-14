// 主练习页面脚本

// 练习模式配置
const practiceConfigs = {
    pitch: {
        title: '单音符识别',
        file: 'pitch-practice.html',
        description: '通过钢琴键盘或吉他指板识别音符，训练您的音感能力'
    },
    chord: {
        title: '和弦识别',
        file: 'chord-practice.html',
        description: '识别各种和弦类型，提升和声听觉能力'
    },
    'chord-type': {
        title: '和弦调性',
        file: 'chord-type-practice.html',
        description: '练习识别和弦的调性和功能，深入理解和声理论'
    },
    fretboard: {
        title: '吉他指板熟悉度',
        file: 'fretboard-practice.html',
        description: '通过随机音名练习，快速熟悉吉他指板上的音符位置'
    }
};

// DOM元素
let practiceCards = [];
let practiceContent = null;
let currentPractice = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    loadGlobalStats();
});

// 初始化DOM元素
function initializeElements() {
    practiceCards = document.querySelectorAll('.practice-card');
    practiceContent = document.getElementById('practice-content');
}

// 设置事件监听器
function setupEventListeners() {
    // 练习卡片点击事件
    practiceCards.forEach(card => {
        card.addEventListener('click', () => {
            const practiceType = card.dataset.practice;
            selectPractice(practiceType);
        });
    });

    // 重置统计按钮
    const resetButton = document.getElementById('reset-all-stats');
    if (resetButton) {
        resetButton.addEventListener('click', resetAllStats);
    }

    // 监听来自iframe的消息（用于统计更新）
    window.addEventListener('message', handleIframeMessage);
}

// 选择练习模式
function selectPractice(practiceType) {
    // 更新卡片状态
    practiceCards.forEach(card => {
        card.classList.remove('active');
    });
    
    const selectedCard = document.querySelector(`[data-practice="${practiceType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }

    // 加载练习内容
    loadPracticeContent(practiceType);
    currentPractice = practiceType;
}

// 加载练习内容
function loadPracticeContent(practiceType) {
    const config = practiceConfigs[practiceType];
    if (!config) return;

    // 显示加载状态
    practiceContent.innerHTML = `
        <div class="loading-container" style="text-align: center; padding: 50px;">
            <div class="loading"></div>
            <p style="margin-top: 15px; color: #7f8c8d;">正在加载 ${config.title}...</p>
        </div>
    `;

    // 创建iframe来加载练习内容
    setTimeout(() => {
        const iframe = document.createElement('iframe');
        iframe.src = config.file;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.minHeight = '800px'; // 增加最小高度，确保吉他指板完全显示
        iframe.style.border = 'none';
        iframe.style.borderRadius = '10px';
        
        // 为不同的练习类型设置特定的高度
        if (practiceType === 'fretboard') {
            iframe.style.minHeight = '900px'; // 吉他指板需要更多空间
        } else if (practiceType === 'chord-type') {
            iframe.style.minHeight = '1000px'; // 和弦调性练习需要更多空间显示半音阶图
        }
        iframe.onload = () => {
            // iframe加载完成后的处理
            console.log(`${config.title} 加载完成`);
            
            // 尝试调整iframe高度以适应内容
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        // 确保高度足够大，特别是对于吉他指板练习
                        const height = Math.max(entry.target.scrollHeight, 800);
                        iframe.style.height = `${height + 50}px`; // 添加额外的50px空间
                    }
                });
                
                resizeObserver.observe(iframeDoc.body);
                
                // 初始调整 - 确保最小高度
                const initialHeight = Math.max(iframeDoc.body.scrollHeight, 800);
                iframe.style.height = `${initialHeight + 50}px`;
                
                // 特殊处理吉他指板练习
                if (practiceType === 'fretboard') {
                    iframe.style.height = '900px'; // 为吉他指板设置更大的固定高度
                }
            } catch (e) {
                console.log('无法自动调整iframe高度:', e);
                
                // 如果自动调整失败，为吉他指板设置更大的固定高度
                if (practiceType === 'fretboard') {
                    iframe.style.height = '900px';
                }
            }
        };

        practiceContent.innerHTML = `
            <div class="practice-header">
                <h3>${config.title}</h3>
                <p>${config.description}</p>
            </div>
            <div class="iframe-container">
            </div>
        `;
        
        // 设置practiceContent为flex布局，使其能够自适应高度
        practiceContent.style.display = 'flex';
        practiceContent.style.flexDirection = 'column';
        practiceContent.style.flex = '1';

        const iframeContainer = practiceContent.querySelector('.iframe-container');
        iframeContainer.appendChild(iframe);
    }, 500);
}

// 在新标签页中打开练习
function openInNewTab(file) {
    window.open(file, '_blank');
}

// 处理来自iframe的消息
function handleIframeMessage(event) {
    // 这里可以处理来自各个练习页面的统计数据更新
    if (event.data && event.data.type === 'stats-update') {
        updateGlobalStats(event.data.practice, event.data.stats);
    }
}

// 更新全局统计
function updateGlobalStats(practiceType, stats) {
    const accuracyElement = document.getElementById(`${practiceType}-accuracy`);
    if (accuracyElement && stats.accuracy !== undefined) {
        accuracyElement.textContent = `${stats.accuracy}%`;
    }
    
    // 保存到本地存储
    saveGlobalStats(practiceType, stats);
}

// 保存全局统计到本地存储
function saveGlobalStats(practiceType, stats) {
    const globalStats = JSON.parse(localStorage.getItem('globalPracticeStats') || '{}');
    globalStats[practiceType] = stats;
    localStorage.setItem('globalPracticeStats', JSON.stringify(globalStats));
}

// 加载全局统计
function loadGlobalStats() {
    const globalStats = JSON.parse(localStorage.getItem('globalPracticeStats') || '{}');
    
    Object.keys(practiceConfigs).forEach(practiceType => {
        const stats = globalStats[practiceType];
        if (stats && stats.accuracy !== undefined) {
            const accuracyElement = document.getElementById(`${practiceType}-accuracy`);
            if (accuracyElement) {
                accuracyElement.textContent = `${stats.accuracy}%`;
            }
        }
    });
}

// 重置所有统计
function resetAllStats() {
    if (confirm('确定要重置所有练习的统计数据吗？此操作不可撤销。')) {
        // 清除本地存储
        localStorage.removeItem('globalPracticeStats');
        
        // 重置显示
        Object.keys(practiceConfigs).forEach(practiceType => {
            const accuracyElement = document.getElementById(`${practiceType}-accuracy`);
            if (accuracyElement) {
                accuracyElement.textContent = '0%';
            }
        });

        // 通知当前练习页面重置统计
        if (currentPractice) {
            const iframe = practiceContent.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'reset-stats'
                }, '*');
            }
        }

        alert('所有统计数据已重置！');
    }
}

// 添加练习头部样式
const additionalCSS = `
<style>
.practice-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 2px solid #ecf0f1;
}

.practice-header h3 {
    color: #2c3e50;
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.practice-header p {
    color: #7f8c8d;
    margin-bottom: 15px;
}

.iframe-container {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 600px;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
</style>
`;

// 将额外的CSS添加到头部
document.head.insertAdjacentHTML('beforeend', additionalCSS);