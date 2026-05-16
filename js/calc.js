/**
 * 还阴债计算核心引擎 v2.0
 * 基于 lunar-javascript 库提供精确的八字计算
 *
 * 版本历史：
 * - v1.0: 基础还阴债计算
 * - v2.0: 修复早子时/晚子时问题，完善八字计算，增加更多分析功能
 */

// 年龄倍数配置（可自定义）
const AGE_MULTIPLIER_CONFIG = {
  ranges: [
    { min: 0, max: 9, mul: 2 },
    { min: 10, max: 19, mul: 3 },
    { min: 20, max: 29, mul: 4 },
    { min: 30, max: 39, mul: 5 },
    { min: 40, max: 49, mul: 6 },
    { min: 50, max: 59, mul: 7 },
    { min: 60, max: 69, mul: 8 },
    { min: 70, max: 79, mul: 9 },
    { min: 80, max: 200, mul: 10 },
  ],
  description: '年龄倍数表：0-9岁×2，10-19岁×3，20-29岁×4，30-39岁×5，40-49岁×6，50-59岁×7，60-69岁×8，70-79岁×9，80岁以上×10'
};

const DebtCalc = (function () {

  // ==================== 欠债数据 (从Excel提取) ====================
  // 年柱欠债表：干支 → {金额, 读经遍数, 纳库数, 曹官}
  const YEAR_DEBT = {
    "甲子":{"amount":53000,"reading":18,"naku":3,"caoguan":"元"},"乙丑":{"amount":280000,"reading":94,"naku":13,"caoguan":"田"},
    "丙寅":{"amount":80000,"reading":27,"naku":10,"caoguan":"马"},"丁卯":{"amount":23000,"reading":8,"naku":11,"caoguan":"许"},
    "戊辰":{"amount":54000,"reading":18,"naku":14,"caoguan":"冯"},"己巳":{"amount":72000,"reading":24,"naku":21,"caoguan":"曹"},
    "庚午":{"amount":62000,"reading":21,"naku":42,"caoguan":"陈"},"辛未":{"amount":101000,"reading":34,"naku":59,"caoguan":"常"},
    "壬申":{"amount":42000,"reading":14,"naku":49,"caoguan":"王"},"癸酉":{"amount":50000,"reading":17,"naku":12,"caoguan":"申"},
    "甲戌":{"amount":27000,"reading":9,"naku":17,"caoguan":"井"},"乙亥":{"amount":48000,"reading":16,"naku":42,"caoguan":"成"},
    "丙子":{"amount":73000,"reading":25,"naku":9,"caoguan":"王"},"丁丑":{"amount":42000,"reading":15,"naku":3,"caoguan":"崔"},
    "戊寅":{"amount":60000,"reading":20,"naku":11,"caoguan":"郭"},"己卯":{"amount":80000,"reading":27,"naku":26,"caoguan":"宋"},
    "庚辰":{"amount":57000,"reading":19,"naku":24,"caoguan":"刘"},"辛巳":{"amount":57000,"reading":19,"naku":37,"caoguan":"高"},
    "壬午":{"amount":70000,"reading":24,"naku":44,"caoguan":"李"},"癸未":{"amount":52000,"reading":18,"naku":49,"caoguan":"朱"},
    "甲申":{"amount":70000,"reading":24,"naku":56,"caoguan":"吕"},"乙酉":{"amount":40000,"reading":14,"naku":2,"caoguan":"安"},
    "丙戌":{"amount":80000,"reading":27,"naku":3,"caoguan":"左"},"丁亥":{"amount":39000,"reading":13,"naku":40,"caoguan":"吉"},
    "戊子":{"amount":63000,"reading":21,"naku":6,"caoguan":"伍"},"己丑":{"amount":80000,"reading":27,"naku":7,"caoguan":"周"},
    "庚寅":{"amount":51000,"reading":17,"naku":15,"caoguan":"毛"},"辛卯":{"amount":80000,"reading":27,"naku":4,"caoguan":"张"},
    "壬辰":{"amount":45000,"reading":15,"naku":1,"caoguan":"赵"},"癸巳":{"amount":39000,"reading":13,"naku":50,"caoguan":"卞"},
    "甲午":{"amount":40000,"reading":14,"naku":21,"caoguan":"牛"},"乙未":{"amount":40000,"reading":14,"naku":51,"caoguan":"皇"},
    "丙申":{"amount":33000,"reading":11,"naku":57,"caoguan":"钮"},"丁酉":{"amount":170000,"reading":57,"naku":59,"caoguan":"郑"},
    "戊戌":{"amount":38000,"reading":13,"naku":41,"caoguan":"范"},"己亥":{"amount":73000,"reading":25,"naku":48,"caoguan":"彭"},
    "庚子":{"amount":68000,"reading":23,"naku":34,"caoguan":"吕"},"辛丑":{"amount":51000,"reading":17,"naku":45,"caoguan":"苏"},
    "壬寅":{"amount":43000,"reading":15,"naku":54,"caoguan":"卢"},"癸卯":{"amount":43000,"reading":15,"naku":63,"caoguan":"蒋"},
    "甲辰":{"amount":43000,"reading":15,"naku":72,"caoguan":"蔡"},"乙巳":{"amount":83000,"reading":28,"naku":81,"caoguan":"贾"},
    "丙午":{"amount":58000,"reading":20,"naku":90,"caoguan":"丁"},"丁未":{"amount":43000,"reading":15,"naku":99,"caoguan":"魏"},
    "戊申":{"amount":33000,"reading":11,"naku":9,"caoguan":"薛"},"己酉":{"amount":68000,"reading":23,"naku":18,"caoguan":"阎"},
    "庚戌":{"amount":98000,"reading":33,"naku":27,"caoguan":"余"},"辛亥":{"amount":43000,"reading":15,"naku":36,"caoguan":"潘"},
    "壬子":{"amount":98000,"reading":33,"naku":45,"caoguan":"杜"},"癸丑":{"amount":68000,"reading":23,"naku":54,"caoguan":"阮"},
    "甲寅":{"amount":33000,"reading":11,"naku":63,"caoguan":"段"},"乙卯":{"amount":68000,"reading":23,"naku":72,"caoguan":"倪"},
    "丙辰":{"amount":83000,"reading":28,"naku":81,"caoguan":"童"},"丁巳":{"amount":43000,"reading":15,"naku":90,"caoguan":"夏"},
    "戊午":{"amount":103000,"reading":35,"naku":99,"caoguan":"焦"},"己未":{"amount":38000,"reading":13,"naku":8,"caoguan":"邝"},
    "庚申":{"amount":53000,"reading":18,"naku":17,"caoguan":"霍"},"辛酉":{"amount":38000,"reading":13,"naku":26,"caoguan":"虞"},
    "壬戌":{"amount":103000,"reading":35,"naku":35,"caoguan":"万"},"癸亥":{"amount":113000,"reading":38,"naku":44,"caoguan":"呼延"}
  };

  const MONTH_GAN_DEBT = {"甲":10000,"乙":20000,"丙":30000,"丁":40000,"戊":50000,"己":60000,"庚":70000,"辛":80000,"壬":90000,"癸":100000};

  const MONTH_DEBT = {
    "正月":1000,"二月":2000,"三月":3000,"四月":4000,"五月":5000,"六月":6000,
    "七月":7000,"八月":8000,"九月":9000,"十月":10000,"十一月":11000,"腊月":12000
  };

  const DAY_DEBT = {
    "初一":1000,"初二":2000,"初三":3000,"初四":4000,"初五":5000,"初六":6000,"初七":7000,"初八":8000,"初九":9000,"初十":10000,
    "十一":11000,"十二":12000,"十三":13000,"十四":14000,"十五":15000,"十六":16000,"十七":17000,"十八":18000,"十九":19000,"二十":20000,
    "二十一":21000,"二十二":22000,"二十三":23000,"二十四":24000,"二十五":25000,"二十六":26000,"二十七":27000,"二十八":28000,"二十九":29000,"三十":30000
  };

  const TIME_GAN_DEBT = {"甲":10000,"乙":20000,"丙":30000,"丁":40000,"戊":50000,"己":60000,"庚":70000,"辛":80000,"壬":90000,"癸":100000};

  const TIME_ZHI_DEBT = {"子":1000,"丑":2000,"寅":3000,"卯":4000,"辰":5000,"巳":6000,"午":7000,"未":8000,"申":9000,"酉":10000,"戌":11000,"亥":12000};

  // 年龄→倍数
  const AGE_MULTIPLIER = [
    {min:0,max:9,mul:2},{min:10,max:19,mul:3},{min:20,max:29,mul:4},{min:30,max:39,mul:5},
    {min:40,max:49,mul:6},{min:50,max:59,mul:7},{min:60,max:69,mul:8},{min:70,max:79,mul:9},
    {min:80,max:89,mul:10},
  ];

  function getMultiplier(birthYear) {
    const age = new Date().getFullYear() - birthYear;
    for (const range of AGE_MULTIPLIER) {
      if (age >= range.min && age <= range.max) return range.mul;
    }
    return 10;
  }

  /**
   * 主计算函数
   * @param {object} params
   *   - lunarYear: 农历年
   *   - lunarMonth: 农历月 (1-12)
   *   - lunarDay: 农历日 (1-30)
   *   - isLeap: 是否闰月
   *   - hour: 时辰小时数 (0-23)
   * @param {number} birthSolarYear 公历出生年份 (用于计算年龄倍数)
   * @returns {object} 计算结果
   */
  function calculate(params, birthSolarYear) {
    const { lunarYear, lunarMonth, lunarDay, isLeap, hour } = params;

    // --- 使用 lunar-javascript 获取完整八字 ---
    const baZiInfo = Lunar.getBaZi(lunarYear, lunarMonth, lunarDay, isLeap, hour);

    const yearGanZhi = baZiInfo.yearGanZhi;
    const monthGanZhi = baZiInfo.monthGanZhi;
    const dayGanZhi = baZiInfo.dayGanZhi;
    const timeGanZhi = baZiInfo.timeGanZhi;
    const timeGan = baZiInfo.timeGan;
    const timeZhi = baZiInfo.timeZhi;

    // 月份名和日期名
    const monthName = Lunar.MonthNames[lunarMonth - 1];
    const dayName = Lunar.DayNames[lunarDay - 1];

    // 公历日期 (用于显示)
    const solarDate = Lunar.lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap);

    // --- 各项欠额 ---
    const yearData = YEAR_DEBT[yearGanZhi] || {amount:0,reading:0,naku:0,caoguan:''};
    const yearAmount = yearData.amount;
    const monthGanAmount = MONTH_GAN_DEBT[monthGanZhi[0]] || 0;
    const monthAmount = MONTH_DEBT[monthName] || 0;
    const dayAmount = DAY_DEBT[dayName] || 0;
    const timeGanAmount = TIME_GAN_DEBT[timeGan] || 0;
    const timeZhiAmount = TIME_ZHI_DEBT[timeZhi] || 0;

    // 官债 = 年 + 月干 + 月份 + 日 + 时干 + 时支
    const officialDebt = yearAmount + monthGanAmount + monthAmount + dayAmount + timeGanAmount + timeZhiAmount;

    // 私债 = 官债
    const privateDebt = officialDebt;

    // 年龄倍数
    const multiplier = getMultiplier(birthSolarYear);

    // 利息 = 私债 × 倍数
    const privateInterest = privateDebt * multiplier;
    
    // 官债利息 = 私债利息
    const officialInterest = privateInterest;

    // 总计 = 官债 + 私债 + 官债利息 + 私债利息
    const totalDebt = officialDebt + privateDebt + officialInterest + privateInterest;

    return {
      // 八字
      bazi: `${yearGanZhi} ${monthGanZhi} ${dayGanZhi} ${timeGanZhi}`,
      yearGanZhi,
      monthGanZhi,
      dayGanZhi,
      timeGanZhi,
      timeGan,
      timeZhi,
      // 农历信息
      lunarYear,
      lunarMonth,
      lunarDay,
      isLeap,
      monthName,
      dayName,
      shengXiao: baZiInfo.shengXiao,
      // 各项欠额明细
      yearAmount,
      monthGanAmount,
      monthGanLabel: monthGanZhi[0],
      monthAmount,
      dayAmount,
      dayName,
      timeGanAmount,
      timeGanLabel: timeGan,
      timeZhiAmount,
      timeZhiLabel: timeZhi,
      // 汇总
      officialDebt,
      privateDebt,
      officialInterest,
      multiplier,
      privateInterest,
      totalDebt,
      // 年柱附属信息
      reading: yearData.reading || 0,
      naku: yearData.naku || 0,
      caoguan: yearData.caoguan || '',
      // 公历
      solarDate: solarDate,
    };
  }

  return {
    calculate,
    YEAR_DEBT,
    MONTH_GAN_DEBT,
    MONTH_DEBT,
    DAY_DEBT,
    TIME_GAN_DEBT,
    TIME_ZHI_DEBT,
    AGE_MULTIPLIER_CONFIG,
    getMultiplier,

    // 工具方法
    getConfig,
    getAllYearDebts,
    formatCurrency,
    calculateDemo,
  };
})();

// ==================== 工具函数 ====================

/**
 * 获取当前配置
 */
function getConfig() {
  return {
    name: '还阴债计算系统',
    version: '2.0.0',
    updateDate: '2024-01-15',
    engine: Lunar.libName,
    engineVersion: Lunar.version,
    features: {
      earlyZiFix: true,  // 早子时修复
      lateZiFix: true,   // 晚子时日期+1
      wuShuDun: true,    // 五鼠遁时柱计算
    },
    ageMultiplier: AGE_MULTIPLIER_CONFIG,
  };
}

/**
 * 获取所有年柱欠债列表（用于调试或展示）
 */
function getAllYearDebts() {
  return Object.entries(DebtCalc.YEAR_DEBT).map(([gz, data]) => ({
    ganZhi: gz,
    shengXiao: Lunar.getShengXiaoByGanZhi(gz),
    amount: data.amount,
    reading: data.reading,
    naku: data.naku,
    caoguan: data.caoguan,
  }));
}

/**
 * 格式化货币
 */
function formatCurrency(amount) {
  return amount.toLocaleString('zh-CN') + ' 元';
}

/**
 * 示例计算（用于演示）
 */
function calculateDemo() {
  const params = {
    lunarYear: 1984,
    lunarMonth: 2,
    lunarDay: 7,
    isLeap: false,
    hour: 23
  };
  return DebtCalc.calculate(params, 1984);
}

