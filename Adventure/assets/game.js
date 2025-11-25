/**
 * 大富翁 Pro - 融合版本
 * UI框架: v26
 * 核心逻辑: 稳定的玩家管理 + 胜场统计 + 事件系统 + 玩家自定义
 * 作者：Parsifals
 */

// 导入事件数据
const ADVENTURES = window.GAME_EVENTS || [];
const REQUIRED_EVENTS = window.GAME_REQUIRED_EVENTS || [];

const CONFIG = window.GAME_CONFIG || {};

let state = {
    players: [],
    currPlayerId: null,
    isGameStarted: false,
    mapScale: 1, // 地图缩放比例
    skipNextTurn: false // 暂停一回合标志
};

// === DOM 引用 ===
const dom = {
    viewport: document.getElementById('map-viewport'),
    layer: document.getElementById('map-transform-layer'),
    map: document.getElementById('game-map'),
    dice: document.getElementById('dice'),
    rollBtn: document.getElementById('btn-roll'),
    statusName: document.getElementById('current-player-name'),
    playerList: document.getElementById('player-list'),
    canvas: document.getElementById('bg-canvas'),
    startNode: document.getElementById('start-station'),
    endNode: document.getElementById('end-station'),
    modal: {
        el: document.getElementById('modal-overlay'),
        title: document.getElementById('modal-title'),
        body: document.getElementById('modal-content'),
        btn: document.getElementById('modal-confirm')
    },
    dev: {
        menu: document.getElementById('dev-menu'),
        select: document.getElementById('dev-player-select'),
        input: document.getElementById('dev-steps'),
        trigger: document.getElementById('dev-trigger')
    },
    zoomIn: document.getElementById('zoom-in'),
    zoomOut: document.getElementById('zoom-out'),
    zoomReset: document.getElementById('zoom-reset')
};

// === 初始化 ===
function init() {
    loadState();
    renderMap();
    updateUI();
    bindEvents();
    initBackgroundAnimation();
    updateCollapsedButtons();
    loadBackgroundImage(); // 动态加载背景图
}

// === 动态加载背景图 ===
function loadBackgroundImage() {
    const bgPath = CONFIG.BACKGROUND_IMAGE;
    if (!bgPath) return;
    
    // 创建一个Image对象测试图片是否存在
    const img = new Image();
    img.onload = () => {
        // 图片加载成功，应用背景
        document.body.classList.add('has-background');
        document.body.style.setProperty('--dynamic-bg', `url('${bgPath}')`);
        // 使用CSS变量设置背景
        const style = document.createElement('style');
        style.textContent = `
            body.has-background::before {
                background-image: url('${bgPath}');
            }
        `;
        document.head.appendChild(style);
    };
    img.onerror = () => {
        // 图片加载失败，移除背景类
        document.body.classList.remove('has-background');
    };
    img.src = bgPath;
}

// === 地图系统 (根目录蛇形布局) ===
function renderMap() {
    dom.map.innerHTML = '';
    
    // 先添加起点
    const startNode = document.createElement('div');
    startNode.className = 'special-station start';
    startNode.id = 'start-station';
    startNode.innerText = '起点';
    dom.map.appendChild(startNode);
    
    // 检查是否有保存的地图
    let savedMap = localStorage.getItem(CONFIG.MAP_SEED);
    let mapData = [];
    
    if (savedMap) {
        mapData = JSON.parse(savedMap);
    } else {
        // 生成新地图但不保存，等待开始游戏时再保存
        mapData = [];
    }
    
    // 只有当地图数据存在时才渲染格子
    if (mapData.length > 0) {
        for (let i = 1; i <= CONFIG.TOTAL_GRIDS; i++) {
            const evtText = mapData[i - 1];
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.id = `cell-${i}`;
            
            // 提取显示文本（移除括号内容）
            const displayText = evtText.replace(/\([^)]*\)/g, '').trim();
            
            cell.innerHTML = `
                <span class="cell-number">${i}</span>
                <div class="cell-content">${displayText}</div>
            `;
            cell.dataset.adventure = evtText; // 保存完整事件文本
            
            const pos = calculateGridPosition(i);
            cell.style.gridColumn = pos.col;
            cell.style.gridRow = pos.row;

            dom.map.appendChild(cell);
        }
    }
    
    // 添加终点
    const endNode = document.createElement('div');
    endNode.className = 'special-station end';
    endNode.id = 'end-station';
    endNode.innerText = '终点';
    dom.map.appendChild(endNode);
}

// 生成新地图的函数
function generateNewMap() {
    const mapData = [];
    const allEvents = [...ADVENTURES]; // 复制普通事件池
    
    // 首先将必须事件随机插入
    const requiredPositions = [];
    for (let i = 0; i < REQUIRED_EVENTS.length && i < CONFIG.TOTAL_GRIDS; i++) {
        let pos;
        do {
            pos = Math.floor(Math.random() * CONFIG.TOTAL_GRIDS);
        } while (requiredPositions.includes(pos));
        requiredPositions.push(pos);
        mapData[pos] = REQUIRED_EVENTS[i];
    }
    
    // 填充其余位置为普通事件
    for (let i = 0; i < CONFIG.TOTAL_GRIDS; i++) {
        if (!mapData[i]) {
            mapData[i] = allEvents[Math.floor(Math.random() * allEvents.length)];
        }
    }
    
    // 保存地图
    localStorage.setItem(CONFIG.MAP_SEED, JSON.stringify(mapData));
    return mapData;
}

// 根目录蛇形走位坐标算法
function calculateGridPosition(index) {
    const cycle = 20;
    const localIndex = (index - 1) % cycle;
    const cycleCount = Math.floor((index - 1) / cycle);
    const baseRow = cycleCount * 4;
    let col, row;

    if (localIndex < 8) {
        row = baseRow + 1; col = 2 + localIndex;
    } else if (localIndex < 10) {
        col = 9; row = baseRow + 1 + (localIndex - 7);
    } else if (localIndex < 18) {
        row = baseRow + 3; col = 9 - (localIndex - 9);
    } else {
        col = 1; row = baseRow + 3 + (localIndex - 17);
    }
    return { col, row };
}

// === 玩家管理 (根目录版本逻辑) ===
function getCurrentPlayer() {
    return state.players.find(p => p.id === state.currPlayerId);
}

function addPlayer() {
    if (state.isGameStarted) return;
    if (state.players.length >= 10) return showModal('提示', '人数已满', '🚫');

    state.players.push({
        id: Date.now().toString(),
        name: `玩家${state.players.length + 1}`,
        color: CONFIG.COLORS[state.players.length % CONFIG.COLORS.length].value,
        position: 0,
        wins: 0,
        isActive: true
    });
    saveState();
    updateUI();
    updateCollapsedButtons();
}

window.editPlayerName = (id) => {
    const p = state.players.find(p => p.id === id);
    if (!p) return;
    
    showNameEditor(p);
};

window.changePlayerColor = (id) => {
    const p = state.players.find(p => p.id === id);
    if (!p) return;
    
    showColorPicker(p);
};

function updateUI() {
    dom.playerList.innerHTML = '';
    
    // 根据位置排序（倒序，位置大的在前）
    const sortedPlayers = [...state.players].sort((a, b) => b.position - a.position);
    
    // 渲染正常玩家列表
    sortedPlayers.forEach((p) => {
        const isCurr = state.isGameStarted && p.id === state.currPlayerId;
        const div = document.createElement('div');
        div.className = `player-item ${isCurr ? 'active' : ''}`;
        if (isCurr) {
            div.style.setProperty('--player-active-color', p.color);
        }
        div.innerHTML = `
            <div class="p-avatar" style="background:${p.color}" onclick="changePlayerColor('${p.id}')">${p.name[0]}${p.name[1]}</div>
            <div style="flex:1">
                <div class="player-name" style="font-weight:bold;font-size:13px;cursor:pointer" onclick="editPlayerName('${p.id}')">${p.name}</div>
                <small>位置: ${p.position} | 胜: ${p.wins}</small>
            </div>
            ${!state.isGameStarted ? `<button class="btn-danger" onclick="removePlayer('${p.id}')" style="padding:5px 10px;color:red;background:none;border:none;cursor:pointer">×</button>` : ''}
        `;
        dom.playerList.appendChild(div);
    });

    // 渲染折叠时的迷你卡片
    const collapsedContainer = document.querySelector('.collapsed-players');
    if (collapsedContainer) {
        collapsedContainer.innerHTML = '';
        sortedPlayers.forEach((p) => {
            const isCurr = state.isGameStarted && p.id === state.currPlayerId;
            const miniCard = document.createElement('div');
            miniCard.className = `player-mini ${isCurr ? 'active' : ''}`;
            miniCard.innerHTML = `
                <div class="p-avatar-mini" style="background:${p.color}" onclick="changePlayerColor('${p.id}')">
                    ${p.name[0]}${p.name[1]}
                </div>
                <div class="player-name-mini" onclick="editPlayerName('${p.id}')">${p.name}</div>
            `;
            collapsedContainer.appendChild(miniCard);
        });
    }

    renderTokens();
    
    const curr = getCurrentPlayer();
    if (!state.isGameStarted) {
        dom.statusName.innerText = "等待开始...";
        dom.rollBtn.disabled = true;
        dom.rollBtn.innerText = "Waiting";
    } else if (curr) {
        dom.statusName.innerText = `${curr.name} 的回合`;
        dom.statusName.style.color = curr.color;
        dom.rollBtn.disabled = false;
        dom.rollBtn.innerText = "ROLL";
        dom.rollBtn.style.backgroundColor = curr.color;
    }
}

function renderTokens() {
    document.querySelectorAll('.player-token').forEach(e => e.remove());
    
    state.players.forEach((p, idx) => {
        if (!p.isActive) return;
        
        const token = document.createElement('div');
        token.className = 'player-token';
        token.style.backgroundColor = p.color;
        token.innerText = p.name[0]+p.name[1];
        token.id = `token-${p.id}`;
        
        let targetId = p.position === 0 ? 'start-station' : (p.position > CONFIG.TOTAL_GRIDS ? 'end-station' : `cell-${p.position}`);
        let targetCell = document.getElementById(targetId);

        if (targetCell) {
            // 堆叠偏移
            const offsetX = (idx % 3) * 5 - 5;
            const offsetY = Math.floor(idx / 3) * 5 - 5;
            token.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            targetCell.appendChild(token);
        }
    });
}

// === 核心流程 (根目录版本 + v6事件解析) ===
async function rollDice() {
    if (!state.isGameStarted) return;
    
    const player = getCurrentPlayer();
    if (!player) return;
    
    // 检查是否跳过回合
    if (state.skipNextTurn) {
        state.skipNextTurn = false;
        dom.rollBtn.disabled = true;
        await showModal('暂停回合', `${player.name} 暂停一回合`, '⏸️');
        nextTurn();
        return;
    }
    
    dom.rollBtn.disabled = true;

    const point = Math.floor(Math.random() * 6) + 1;
    console.log(point);
    
    animateDice(point);
    
   await wait(1200);
    await movePlayer(player, point);

    // 触发事件 - 所有格子都触发
    if (player.position <= CONFIG.TOTAL_GRIDS && player.position > 0) {
        const cell = document.getElementById(`cell-${player.position}`);
        if (cell) {
            const evtContent = cell.dataset.adventure;
            await showModal(`事件`, evtContent, '🎯');
            
            // 检查原地不动（替代暂停一回合）
            if (evtContent.includes('原地不动')) {
                state.skipNextTurn = true;
            }
            
            // 检查"再来一次"事件
            if (evtContent.match(/再来一次|再掷一次|重新掷骰/)) {
                dom.rollBtn.disabled = false;
                await showModal('提示', '你可以再掷一次骰子！', '🎲');
                return; // 不进入下一回合，当前玩家继续
            }
            
            // v6 智能解析
            const fwd = evtContent.match(/前[进往](\d+)/);
            const bwd = evtContent.match(/后[退回](\d+)/);
            
            if (fwd) {
                await wait(500);
                await movePlayer(player, parseInt(fwd[1]));
                // 移动后再次触发事件
                await checkEvent(player);
            }
            if (bwd) {
                await wait(500);
                await movePlayer(player, -parseInt(bwd[1]));
                // 移动后再次触发事件
                await checkEvent(player);
            }
        }
    }

    // 终点检查
    if (player.position > CONFIG.TOTAL_GRIDS) {
        winEffect(); // 终点特效
        await showModal('胜利！', `恭喜 ${player.name} 到达终点！`, '🏆');
        player.wins++;
        player.position = 0;
        saveState();
    }

    nextTurn();
}

// 根目录版本动画 (更流畅) - 修正点数映射
function animateDice(point) {
    const rX = Math.random() * 1440 + 720;
    const rY = Math.random() * 1440 + 720;
    dom.dice.style.transition = 'transform 1s ease-out';
    dom.dice.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;
    
    // 修正骰子面映射 - 修复6显示为9的问题
    const targetMap = {
        1: [0, 0],        // 正面显示1
        2: [90, 0],      // 2点面
        3: [0, -90],      // 右面显示3
        4: [0, 90],       // 左面显示4
        5: [-90, 0],      // 顶面显示5
        6: [0, 180]        // 6点面(修正：原来是[180,0]导致显示为9)
    };

    setTimeout(() => {
        dom.dice.style.transition = 'transform 0.2s linear';
        const [tx, ty] = targetMap[point];
        const finalX = Math.floor(rX / 360) * 360 + tx;
        const finalY = Math.floor(rY / 360) * 360 + ty;
        dom.dice.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
    }, 1000);
}

// 修复后的移动函数
async function movePlayer(player, steps) {
    const dir = steps > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(steps); i++) {
        player.position += dir;
        if (player.position < 0) player.position = 0;
        renderTokens();
        await wait(200);
    }
    saveState();
}

function nextTurn() {
    const idx = state.players.findIndex(p => p.id === state.currPlayerId);
    state.currPlayerId = state.players[(idx + 1) % state.players.length].id;
    saveState();
    updateUI();
}

// === 颜色选择器 ===
function showColorPicker(player) {
    const modal = document.createElement('div');
    modal.className = 'color-picker-modal';
    modal.innerHTML = `
        <div class="color-picker-content">
            <h3 style="color: var(--primary-color); margin-bottom: 15px;">选择颜色</h3>
            <div class="color-grid" id="color-grid"></div>
            <div class="modal-buttons">
                <button class="btn-cancel" onclick="this.closest('.color-picker-modal').remove()">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const grid = modal.querySelector('#color-grid');
    CONFIG.COLORS.forEach(colorObj => {
        const option = document.createElement('div');
        option.className = 'color-option';
        if (colorObj.value === player.color) option.classList.add('selected');
        option.style.backgroundColor = colorObj.value;
        option.title = colorObj.name;
        
        // 添加颜色名称标签
        const label = document.createElement('div');
        label.className = 'color-label';
        label.innerText = colorObj.name;
        option.appendChild(label);
        
        option.onclick = () => {
            player.color = colorObj.value;
            saveState();
            updateUI();
            modal.remove();
        };
        grid.appendChild(option);
    });
}

// === 名字编辑器 ===
function showNameEditor(player) {
    const modal = document.createElement('div');
    modal.className = 'name-editor-modal';
    modal.innerHTML = `
        <div class="name-editor-content">
            <h3 style="color: var(--primary-color); margin-bottom: 15px;">修改名字</h3>
            <input type="text" id="name-input" value="${player.name}" maxlength="8" placeholder="请输入名字" />
            <div class="modal-buttons">
                <button class="btn-cancel" onclick="this.closest('.name-editor-modal').remove()">取消</button>
                <button class="btn-confirm" id="confirm-name">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#name-input');
    input.focus();
    input.select();
    
    modal.querySelector('#confirm-name').onclick = () => {
        const newName = input.value.trim();
        if (newName) {
            player.name = newName.substring(0, 8);
            saveState();
            updateUI();
            modal.remove();
        }
    };
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#confirm-name').click();
        }
    });
}

// === 检查事件函数 ===
async function checkEvent(player) {
    if (player.position <= 0 || player.position > CONFIG.TOTAL_GRIDS) return;
    
    const cell = document.getElementById(`cell-${player.position}`);
    if (!cell) return;
    
    const text = cell.dataset.adventure;
    await showModal(`事件`, text, '✨');
    
    // 检查原地不动
    if (text.includes('原地不动')) {
        state.skipNextTurn = true;
    }

    // 自动移动逻辑
    const fwd = text.match(/前[进往](\d+)/);
    const bwd = text.match(/后[退回](\d+)/);
    if (fwd) { 
        await wait(500); 
        await movePlayer(player, parseInt(fwd[1])); 
        await checkEvent(player); 
    }
    if (bwd) { 
        await wait(500); 
        await movePlayer(player, -parseInt(bwd[1])); 
        await checkEvent(player); 
    }
}

// === 刷新棋盘 ===
function refreshMap() {
    localStorage.removeItem(CONFIG.MAP_SEED);
    renderMap();
    showModal('提示', '棋盘已刷新！', '✅');
}

// === 玩家出局/复活 ===
function kickPlayer(idx) {
    const p = state.players[idx];
    if (p) {
        p.isActive = false;
        saveState();
        updateUI();
    }
}

function revivePlayer(idx) {
    const p = state.players[idx];
    if (p) {
        p.isActive = true;
        saveState();
        updateUI();
    }
}



// === 缩放功能 ===
function zoomIn() {
    state.mapScale = Math.min(state.mapScale + 0.2, 2);
    dom.map.style.transform = `scale(${state.mapScale})`;
}

function zoomOut() {
    state.mapScale = Math.max(state.mapScale - 0.2, 0.6);
    dom.map.style.transform = `scale(${state.mapScale})`;
}

function zoomReset() {
    state.mapScale = 1;
    dom.map.style.transform = `scale(1)`;
}

// === 折叠按钮状态管理 ===
function updateCollapsedButtons() {
    const btnStartCollapsed = document.getElementById('btn-start-collapsed');
    const btnResetCollapsed = document.getElementById('btn-reset-collapsed');
    const btnAddCollapsed = document.getElementById('btn-add-collapsed');
    
    if (state.isGameStarted) {
        // 游戏开始后：显示重置，隐藏开始和添加
        btnStartCollapsed.style.display = 'none';
        btnResetCollapsed.style.display = 'block';
        btnAddCollapsed.style.display = 'none';
    } else {
        // 游戏开始前：显示开始和添加，隐藏重置
        btnStartCollapsed.style.display = 'block';
        btnResetCollapsed.style.display = 'none';
        btnAddCollapsed.style.display = 'block';
    }
}

// === 开始游戏特效 ===
function startGameEffect() {
    const canvas = dom.canvas;
    const ctx = canvas.getContext('2d');
    const particles = [];
    
    // 创建100个粒子
    for(let i = 0; i < 100; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            color: CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)].value,
            life: 100
        });
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if(p.life > 0) {
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 100;
                ctx.fillRect(p.x, p.y, 8, 8);
            }
        });
        ctx.globalAlpha = 1;
        if(alive) requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
}

// === 到达终点特效 ===
function winEffect() {
    const canvas = dom.canvas;
    const ctx = canvas.getContext('2d');
    const particles = [];
    
    // 创建200个粒子从顶部下落
    for(let i = 0; i < 200; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: -Math.random() * 500,
            vy: Math.random() * 3 + 2,
            color: CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)].value,
            size: Math.random() * 6 + 3,
            life: 150
        });
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if(p.life > 0 && p.y < canvas.height) {
                alive = true;
                p.y += p.vy;
                p.life--;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.min(1, p.life / 50);
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });
        ctx.globalAlpha = 1;
        if(alive) requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
}

// === 主题与动画 ===
window.setTheme = (themeName) => {
    document.body.className = themeName;
    initBackgroundAnimation();
    
    // 更新brand-logo文字
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
        let themeText = 'Material';
        if (themeName === 'theme-cyber') themeText = 'Cyber';
        else if (themeName === 'theme-paper') themeText = 'Paper';
        
        brandLogo.innerHTML = `MONOPOLY <span class="theme-label">for ${themeText}</span>`;
    }
};

function initBackgroundAnimation() {
    const ctx = dom.canvas.getContext('2d');
    let particles = [];
    let animId;
    
    const resize = () => {
        dom.canvas.width = window.innerWidth;
        dom.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const style = getComputedStyle(document.body);
    const colorPrimary = style.getPropertyValue('--primary-color').trim();
    const theme = document.body.className;

    function createParticle() {
        const w = dom.canvas.width;
        const h = dom.canvas.height;
        
        if (theme.includes('cyber')) {
            return {
                x: Math.random() * w,
                y: Math.random() * h - h,
                speed: Math.random() * 5 + 2,
                text: Math.random() > 0.5 ? '1' : '0',
                color: '#00f3ff',
                type: 'cyber'
            };
        } else if (theme.includes('paper')) {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2,
                color: '#333',
                type: 'paper'
            };
        } else {
            return {
                x: Math.random() * w,
                y: h + Math.random() * 100,
                radius: Math.random() * 20 + 5,
                speed: Math.random() * 1 + 0.5,
                color: colorPrimary,
                alpha: Math.random() * 0.2,
                type: 'md3'
            };
        }
    }

    particles = Array.from({length: 50}, createParticle);

    function draw() {
        ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
        
        particles.forEach((p, i) => {
            if (p.type === 'md3') {
                p.y -= p.speed;
                if (p.y < -50) particles[i] = createParticle();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.globalAlpha = 1;
            } 
            else if (p.type === 'cyber') {
                p.y += p.speed;
                if (p.y > dom.canvas.height) particles[i] = createParticle();
                ctx.fillStyle = `rgba(0, 243, 255, 0)`;
                ctx.font = '12px monospace';
                ctx.fillText(p.text, p.x, p.y);
            }
            else if (p.type === 'paper') {
                p.x += (Math.random()-0.5);
                p.y += (Math.random()-0.5);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.1;
                ctx.fillRect(p.x, p.y, p.size, p.size);
                ctx.globalAlpha = 1;
            }
        });

        animId = requestAnimationFrame(draw);
    }

    if (window.bgAnim) cancelAnimationFrame(window.bgAnim);
    window.bgAnim = animId;
    draw();
    loadBackgroundImage();
}

// === 事件绑定 ===
function bindEvents() {
    document.getElementById('btn-start').onclick = () => {
        if (state.players.length < 2) return showModal('提示', '至少2人才能开始', '⚠️');
        state.isGameStarted = true;
        if (!state.currPlayerId) state.currPlayerId = state.players[0].id;
        
        // 开始游戏时生成新地图
        generateNewMap();
        renderMap();
        
        startGameEffect(); // 开始游戏特效
        saveState(); 
        updateUI();
        updateCollapsedButtons();
    };
    
    document.getElementById('btn-add-player').onclick = addPlayer;

    document.getElementById('btn-reset').onclick = () => {
        if (confirm('重置进度？(保留玩家设置)')) {
            state.isGameStarted = false;
            state.currPlayerId = null;
            state.players.forEach(p => { p.position = 0; p.wins = 0; });
            
            // 重置时清空棋盘
            localStorage.removeItem(CONFIG.MAP_SEED);
            renderMap();
            
            saveState();
            updateUI();
            updateCollapsedButtons();
        }
    };
    
    // 折叠按钮绑定
    document.getElementById('btn-start-collapsed').onclick = () => {
        if (state.players.length < 2) return showModal('提示', '至少2人才能开始', '⚠️');
        state.isGameStarted = true;
        if (!state.currPlayerId) state.currPlayerId = state.players[0].id;
        
        // 开始游戏时生成新地图
        generateNewMap();
        renderMap();
        
        startGameEffect(); // 开始游戏特效
        saveState(); 
        updateUI();
        updateCollapsedButtons();
    };
    
    document.getElementById('btn-add-collapsed').onclick = addPlayer;
    
    document.getElementById('btn-reset-collapsed').onclick = () => {
        if (confirm('重置进度？(保留玩家设置)')) {
            state.isGameStarted = false;
            state.currPlayerId = null;
            state.players.forEach(p => { p.position = 0; p.wins = 0; });
            
            // 重置时清空棋盘
            localStorage.removeItem(CONFIG.MAP_SEED);
            renderMap();
            
            saveState();
            updateUI();
            updateCollapsedButtons();
        }
    };
    
    // 缩放按钮绑定
    dom.zoomIn.onclick = zoomIn;
    dom.zoomOut.onclick = zoomOut;
    dom.zoomReset.onclick = zoomReset;

    dom.rollBtn.onclick = rollDice;
    
    document.getElementById('sidebar-toggle').onclick = () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    };

    dom.modal.btn.onclick = () => dom.modal.el.classList.add('hidden');

    // 开发者工具
    let clicks = 0;
    dom.dev.trigger.onclick = () => {
        if (++clicks >= 5) {
            dom.dev.menu.classList.remove('hidden');
            updateDevSelect();
            clicks = 0;
        }
    };
    
    document.getElementById('close-dev').onclick = () => {
        dom.dev.menu.classList.add('hidden');
    };
    
    document.getElementById('dev-move-btn').onclick = async () => {
        const p = state.players[dom.dev.select.value];
        if (p) {
            await movePlayer(p, parseInt(dom.dev.input.value));
            await checkEvent(p);
        }
    };
    
    document.getElementById('dev-kick-btn').onclick = () => {
        kickPlayer(dom.dev.select.value);
    };
    
    document.getElementById('dev-revive-btn').onclick = () => {
        revivePlayer(dom.dev.select.value);
    };
    
    document.getElementById('dev-refresh-btn').onclick = () => {
        refreshMap();
    };
}

function updateDevSelect() {
    dom.dev.select.innerHTML = '';
    state.players.forEach((p, i) => {
        const opt = document.createElement('option');
        opt.value = i; 
        opt.text = `${p.name} ${p.isActive ? '' : '(出局)'}`;
        dom.dev.select.appendChild(opt);
    });
}

// === 工具函数 ===
function showModal(title, content, icon='✨') {
    return new Promise(resolve => {
        const player = getCurrentPlayer();
        const playerColor = player ? player.color : '#ff9ff3';
        const playerName = player ? player.name : '';
        
        // 创建v5风格弹窗
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay-v5';
        overlay.innerHTML = `
            <div class="modal-card-v5">
                <div class="modal-floating-icon-v5">${icon}</div>
                <div class="modal-header-v5" style="background: linear-gradient(180deg, ${playerColor} 0%, ${playerColor}cc 100%);">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body-v5">
                    <div class="modal-content-v5">${content}</div>
                </div>
                <div class="modal-footer-v5">
                    <button class="btn-pink-v5" style="background: linear-gradient(to bottom, ${playerColor}ee, ${playerColor});">我知道了</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const close = () => {
            overlay.remove();
            resolve();
        };
        
        const btn = overlay.querySelector('.btn-pink-v5');
        btn.addEventListener('click', close);
    });
}

function saveState() { 
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state)); 
}

function loadState() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        state = JSON.parse(saved);
    } else { 
        addPlayer(); 
        addPlayer(); 
    }
}

function wait(ms) { 
    return new Promise(r => setTimeout(r, ms)); 
}

window.removePlayer = (id) => {
    state.players = state.players.filter(p => p.id !== id);
    saveState();
    updateUI();
};

// 启动
init();
