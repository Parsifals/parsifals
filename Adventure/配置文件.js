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
// 格式：{ content: "事件内容", note: "备注（可选）" } 或直接字符串
window.GAME_EVENTS = [
    { content: "原地不动", note: "跳过下一回合" },
    "全麦啤酒",
    "主持随机夸人（除自己）",
    "夸粉丝5句",
    "6麦即兴表演30s",
    "前进1格",
    "置顶卡一张",
    "撒娇八连",
    "后退1格",
    { content: "全麦数字炸弹", note: "主持不参加，数字100以内由管理决定单独和主持说，输的发作品说自己是游戏黑洞" },
    "带名字夸管理5句",
    { content: "直播徒步7.98公里", note: "需要完成直播任务" },
    "真心话：最尴尬的事",
    "前进2格",
    "发作品模仿一个动物",
    "后退5格",
    { content: "罚款减半卡", note: "任务5.0时可用" },
    "7.98红包",
    "恶龙咆哮三声",
    "说两句土味情话",
    "全麦说家乡话",
    "个播时间加半小时",
    { content: "管理发作品", note: "内容为平板支撑30s（男管理）" },
    { content: "再来一次", note: "在掷骰子一次" },
    "il项链一个",
    "后退3格",
    { content: "成语接龙", note: "公屏扣最多的组合" },
    "模仿猩猩",
    "获得红包：1元",
    "后退2格",
    "唱歌",
];

// 必须加载的事件（这些事件必定会随机出现在棋盘中）
window.GAME_REQUIRED_EVENTS = [
    { content: "原地不动", note: "跳过下一回合" },
    "获得红包：5元",
    "前进2格",
    "后退3格",
    "唱歌",
    { content: "成语接龙", note: "公屏扣最多的组合" },
    { content: "再来一次", note: "在掷骰子一次" },
    { content: "全麦数字炸弹", note: "主持不参加，数字100以内由管理决定单独和主持说，输的发作品说自己是游戏黑洞" },
    { content: "回到起点", note: "直接回到起点重新开始" }
];
window.GAME_CONFIG = {
    TOTAL_GRIDS: 68,
    COLS: 9, // 棋盘列数
    BACKGROUND_IMAGE: './assets/bg.png', // 背景图路径
    COLORS: [
		{ name: '丁香紫', value: '#bdb2ff' },{ name: '紫晶蓝', value: '#673AB7' },
		{ name: '薰衣紫', value: '#9B5DE5' },{ name: '青柠绿', value: '#00F5D4' },
		{ name: '薄荷绿', value: '#6BCF7F' },{ name: '翡翠绿', value: '#00E676' },
		{ name: '琥珀橙', value: '#FF6F00' },{ name: '碧玉绿', value: '#00BCD4' },
		{ name: '珊瑚红', value: '#FF5722' },{ name: '青瓷蓝', value: '#0097A7' },
		{ name: '胭脂粉', value: '#ffadad' },{ name: '海洋蓝', value: '#00BBF9' },
		{ name: '珊瑚橙', value: '#FF6B6B' },{ name: '湖光蓝', value: '#00B0FF' },
		{ name: '樱花粉', value: '#F15BB5' },{ name: '天青蓝', value: '#2979FF' },
		{ name: '芙蓉粉', value: '#FF4081' },{ name: '宝石蓝', value: '#1976D2' },
		{ name: '胭脂红', value: '#FF1744' },{ name: '靛青蓝', value: '#3D5AFE' },
		{ name: '玫瑰红', value: '#F50057' },{ name: '藏青蓝', value: '#304FFE' },
		{ name: '朱砂红', value: '#D50000' },{ name: '石墨灰', value: '#424242' },
    ],
    STORAGE_KEY: 'monopoly_fusion_v1',  // 存储key
    MAP_SEED: 'monopoly_map_v1'         // 地图种子
};
