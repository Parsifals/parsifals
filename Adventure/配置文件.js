/**
 * 
 * 用于定义棋盘格子的事件内容
 * 
 * 事件类型说明：
 * - 移动类: "前进X格" / "后退X格"
 * - 特殊类: "[暂停一回合]" - 跳过下一次掷骰子
 * - 互动类: 真心话、大冒险、指定互动等
 * - 奖励类: 获得红包等
 */

// 普通事件池（随机抽取）
window.GAME_EVENTS = [
    "原地不动",
    "全麦啤酒",
    "主持随机夸人（除自己）",
    "夸粉丝5句",
    "6麦即兴表演30s",
    "前进1格",
    "置顶卡一张",
    "撒娇八连",
    "后退1格",
    "全麦数字炸弹（主持不参加，数字100以内由管理决定单独和主持说，输的发作品说自己是游戏黑洞）",
    "带名字夸管理5句",
    "直播徒步7.98公里",
    "真心话：最尴尬的事",
    "前进2格",
    "发作品模仿一个动物",
    "后退5格",
    "罚款减半卡（任务5.0时可用）",
    "7.98红包",
    "恶龙咆哮三声",
    "说两句土味情话",
    "全麦说家乡话",
    "个播时间加半小时",
    "管理发作品，内容为平板支撑30s（男管理）",
    "再来一次（在掷骰子一次）",
    "il项链一个",
    "后退3格",
    "成语接龙（公屏扣最多的组合）",
    "真心话：最近的糗事",
    "大冒险：模仿猩猩",
    "获得红包：1元",
    "后退2格",
    "大冒险：唱儿歌",
    "真心话：初恋名字",
    "指定对视10秒",
    "大冒险：发朋友圈",
    "大冒险：模仿动物",
    "真心话：喜欢的人",
];

// 必须加载的事件（这些事件必定会随机出现在棋盘中）
window.GAME_REQUIRED_EVENTS = [
    "原地不动",
    "获得红包：5元",
    "前进3格",
    "后退3格",
    "回到起点"
];
window.GAME_CONFIG = {
    TOTAL_GRIDS: 68,
    COLS: 9, // 每行9格 (v6 UI布局)
    BACKGROUND_IMAGE: './assets/bg.png', // 背景图路径
    COLORS: [
        { name: '', value: '#ffadad' },
		{ name: '', value: '#bdb2ff' },
		{ name: '', value: '#FF6F00' },
		{ name: '', value: '#D50000' },
		{ name: '', value: '#FF1744' },
		{ name: '', value: '#F50057' },
		{ name: '', value: '#FF4081' },
		{ name: '', value: '#3D5AFE' },
		{ name: '', value: '#304FFE' },
		{ name: '', value: '#2979FF' },
		{ name: '', value: '#00B0FF' },
		{ name: '', value: '#0097A7' },
		{ name: '', value: '#00E676' },
		{ name: '', value: '#00E676' },
		{ name: '', value: '#00BCD4' },
		{ name: '', value: '#FF6F00' },
		{ name: '', value: '#673AB7' },
		{ name: '', value: '#FF5722' },
		{ name: '', value: '#1976D2' },
		{ name: '', value: '#424242' },
    ],
    STORAGE_KEY: 'monopoly_fusion_v1',
    MAP_SEED: 'monopoly_map_v1' // 地图种子
};
/*
{ name: '珊瑚红', value: '#FF6B6B' },
        { name: '青绿色', value: '#4ECDC4' },
        { name: '天蓝色', value: '#45B7D1' },
        { name: '薄荷绿', value: '#96CEB4' },
        { name: '奶黄色', value: '#FFEEAD' },
        { name: '橙黄色', value: '#FF9F43' },
        { name: '晴空蓝', value: '#54A0FF' },
        { name: '紫罗兰', value: '#5F27CD' },
        { name: '樱花粉', value: '#FF9FF3' },
        
        { name: '青色', value: '#00D2D3' }
		{ name: '', value: '#' }
*/