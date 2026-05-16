/**
 * 农历/公历转换及八字计算库 v2.0
 * 基于 lunar-javascript (https://6tail.cn/calendar/api.html)
 * 提供简洁统一的 API 给 calc.js 使用
 *
 * 主要修复：
 * - 早子时(00:00-00:59)与晚子时(23:00-23:59)正确区分
 * - 五鼠遁口诀公式修正
 * - 代码结构优化，增加更多实用API
 */

const Lunar = (function () {
  // ==================== 库依赖检查 ====================
  const LibSolar = window.Solar;
  const LibLunar = window.Lunar;
  const hasLib = typeof LibSolar !== 'undefined' && typeof LibLunar !== 'undefined';

  if (!hasLib) {
    console.warn('[Lunar] lunar-javascript 库未加载，将使用原生实现');
  } else {
    console.log('[Lunar] lunar-javascript 库已加载，使用专业八字计算引擎');
  }

  // ==================== 常量定义 ====================
  const TianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DiZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const MonthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '腊月'];
  const DayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'];
  const ShiChenNames = [
    { name: '子时', range: '23:00-00:59' },
    { name: '丑时', range: '01:00-02:59' },
    { name: '寅时', range: '03:00-04:59' },
    { name: '卯时', range: '05:00-06:59' },
    { name: '辰时', range: '07:00-08:59' },
    { name: '巳时', range: '09:00-10:59' },
    { name: '午时', range: '11:00-12:59' },
    { name: '未时', range: '13:00-14:59' },
    { name: '申时', range: '15:00-16:59' },
    { name: '酉时', range: '17:00-18:59' },
    { name: '戌时', range: '19:00-20:59' },
    { name: '亥时', range: '21:00-22:59' }
  ];

  // 生肖映射
  const ShengXiaoMap = {
    '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
    '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
    '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
  };

  // 五行映射
  const GanWuXing = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const ZhiWuXing = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

  // ==================== 公历转农历 ====================
  function solarToLunar(year, month, day) {
    if (hasLib) {
      const solar = LibSolar.fromYmd(year, month, day);
      const lunar = solar.getLunar();
      const rawMonth = lunar.getMonth();
      const isLeap = rawMonth < 0;
      const lunarMonth = isLeap ? -rawMonth : rawMonth;

      return {
        lunarYear: lunar.getYear(),
        lunarMonth: lunarMonth,
        lunarDay: lunar.getDay(),
        isLeap: isLeap,
        monthName: MonthNames[lunarMonth - 1],
        dayName: DayNames[lunar.getDay() - 1],
        yearGanZhi: lunar.getYearInGanZhi(),
        shengXiao: lunar.getYearShengXiao(),
        solarDate: { year, month, day },
      };
    } else {
      return nativeSolarToLunar(year, month, day);
    }
  }

  // ==================== 农历转公历 ====================
  function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap) {
    if (hasLib) {
      const libMonth = isLeap ? -lunarMonth : lunarMonth;
      const lunar = LibLunar.fromYmd(lunarYear, libMonth, lunarDay);
      const solar = lunar.getSolar();
      return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
    } else {
      return nativeLunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap);
    }
  }

  // ==================== 获取下一个农历日期（用于晚子时计算）====================
  function getNextLunarDay(year, month, day, isLeap) {
    if (hasLib) {
      const libMonth = isLeap ? -month : month;
      const lunar = LibLunar.fromYmd(year, libMonth, day);
      const solar = lunar.getSolar();
      const nextSolar = solar.next(1);
      const nextLunar = nextSolar.getLunar();
      const nextMonth = nextLunar.getMonth();
      const nextIsLeap = nextMonth < 0;
      return {
        year: nextLunar.getYear(),
        month: nextIsLeap ? -nextMonth : nextMonth,
        day: nextLunar.getDay(),
        isLeap: nextIsLeap
      };
    } else {
      // 原生简化实现
      const daysInMonth = (month % 2 === 1) ? 30 : 29;
      let nextDay = day + 1;
      let nextMonth = month;
      let nextYear = year;
      let nextIsLeap = isLeap;

      if (nextDay > daysInMonth) {
        nextDay = 1;
        nextMonth++;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }
        if (isLeap && month === 6) {
          nextIsLeap = false;
        }
      }
      return { year: nextYear, month: nextMonth, day: nextDay, isLeap: nextIsLeap };
    }
  }

  // ==================== 五鼠遁口诀 - 获取时干 ====================
  /**
   * 五鼠遁口诀：
   * 甲己日起甲子，乙庚日起丙子，丙辛日起戊子，丁壬日起庚子，戊癸日起壬子
   *
   * 公式推导：
   * - 子时天干 = (日干index × 2) % 10
   * - 时干 = (子时天干 + 时支index) % 10
   *
   * @param {string} dayGan - 日干（甲/乙/丙/丁/戊/己/庚/辛/壬/癸）
   * @param {string} timeZhi - 时支（子/丑/寅/卯/辰/巳/午/未/申/酉/戌/亥）
   * @returns {string} 时干
   */
  function getTimeGan(dayGan, timeZhi) {
    const dayGanIdx = TianGan.indexOf(dayGan);
    const timeZhiIdx = DiZhi.indexOf(timeZhi);

    // 子时天干 = (日干index × 2) % 10
    const ziGanIdx = (dayGanIdx * 2) % 10;
    // 时干 = (子时天干 + 时支index) % 10
    const timeGanIdx = (ziGanIdx + timeZhiIdx) % 10;
    return TianGan[timeGanIdx];
  }

  // ==================== 获取时支 ====================
  /**
   * @param {number} hour - 小时 (0-23)
   * @returns {string} 时支
   *
   * 注意：23:00-00:59 为晚子时/早子时分界
   * - 23:00-00:59 属于"子时"
   */
  function getTimeZhi(hour) {
    if (hour >= 23 || hour < 1) return '子';
    if (hour < 3) return '丑';
    if (hour < 5) return '寅';
    if (hour < 7) return '卯';
    if (hour < 9) return '辰';
    if (hour < 11) return '巳';
    if (hour < 13) return '午';
    if (hour < 15) return '未';
    if (hour < 17) return '申';
    if (hour < 19) return '酉';
    if (hour < 21) return '戌';
    return '亥';
  }

  // ==================== 获取完整八字 ====================
  /**
   * @param {number} lunarYear - 农历年
   * @param {number} lunarMonth - 农历月 (1-12)
   * @param {number} lunarDay - 农历日 (1-30)
   * @param {boolean} isLeap - 是否闰月
   * @param {number} hour - 出生小时 (0-23)
   * @returns {object} 八字信息
   *
   * 关键逻辑：
   * - 晚子时（23:00-23:59）：算第二天开始，农历日期+1
   * - 早子时（00:00-00:59）：属于当天，农历日期不变
   */
  function getBaZi(lunarYear, lunarMonth, lunarDay, isLeap, hour) {
    // 晚子时处理：23时后算第二天
    let adjustedYear = lunarYear;
    let adjustedMonth = isLeap ? -lunarMonth : lunarMonth;
    let adjustedDay = lunarDay;
    let adjustedIsLeap = isLeap;

    if (hour >= 23) {
      const nextDay = getNextLunarDay(lunarYear, lunarMonth, lunarDay, isLeap);
      adjustedYear = nextDay.year;
      adjustedMonth = nextDay.isLeap ? -nextDay.month : nextDay.month;
      adjustedDay = nextDay.day;
      adjustedIsLeap = nextDay.isLeap;
    }

    if (hasLib) {
      const lunar = LibLunar.fromYmdHms(adjustedYear, adjustedMonth, adjustedDay, hour, 30, 0);
      const baZi = lunar.getEightChar();
      const dayGanZhi = baZi.getDay();
      const timeZhi = getTimeZhi(hour);
      const timeGan = getTimeGan(dayGanZhi[0], timeZhi);
      const timeGanZhi = timeGan + timeZhi;

      return {
        yearGanZhi: baZi.getYear(),
        monthGanZhi: baZi.getMonth(),
        dayGanZhi: dayGanZhi,
        timeGanZhi: timeGanZhi,
        dayGan: dayGanZhi[0],
        timeGan: timeGan,
        timeZhi: timeZhi,
        shengXiao: lunar.getYearShengXiao(),
        lunarYear: adjustedYear,
        lunarMonth: Math.abs(adjustedMonth),
        lunarDay: adjustedDay,
        isLeap: adjustedIsLeap,
        // 原始输入
        originalInput: { lunarYear, lunarMonth, lunarDay, isLeap, hour },
        // 时辰类型判断
        isLateNightZi: hour >= 23
      };
    } else {
      const solar = lunarToSolar(adjustedYear, Math.abs(adjustedMonth), adjustedDay, adjustedIsLeap);
      return nativeGetBaZi(adjustedYear, Math.abs(adjustedMonth), adjustedDay, adjustedIsLeap, hour, solar, lunarYear, lunarMonth, lunarDay, isLeap);
    }
  }

  // ==================== 日柱 ====================
  function getDayGanZhi(year, month, day) {
    if (hasLib) {
      const solar = LibSolar.fromYmd(year, month, day);
      const lunar = solar.getLunar();
      return lunar.getDayInGanZhi();
    } else {
      return nativeGetDayGanZhi(year, month, day);
    }
  }

  // ==================== 年干支 ====================
  function getYearGanZhi(lunarYear) {
    if (hasLib) {
      const lunar = LibLunar.fromYmd(lunarYear, 1, 1);
      return lunar.getYearInGanZhi();
    } else {
      const idx = ((lunarYear - 4) % 60 + 60) % 60;
      return TianGan[idx % 10] + DiZhi[idx % 12];
    }
  }

  // ==================== 月干支 ====================
  function getMonthGanZhi(lunarYear, lunarMonth) {
    if (hasLib) {
      const lunar = LibLunar.fromYmd(lunarYear, lunarMonth, 1);
      return lunar.getMonthInGanZhi();
    } else {
      return nativeGetMonthGanZhi(lunarYear, lunarMonth);
    }
  }

  // ==================== 时辰名称 ====================
  function getShiChen(hour) {
    if (hour === 23) return '晚子时';
    if (hour === 0) return '早子时';
    const idx = DiZhi.indexOf(getTimeZhi(hour));
    return ShiChenNames[idx].name;
  }

  function getShiChenDesc(hour) {
    if (hour === 23) return '晚子时（23:00-00:00）';
    if (hour === 0) return '早子时（00:00-01:00）';
    const idx = DiZhi.indexOf(getTimeZhi(hour));
    const sc = ShiChenNames[idx];
    return `${sc.name}（${sc.range}）`;
  }

  // ==================== 生肖相关 ====================
  function getShengXiaoByYear(lunarYear) {
    const yGZ = getYearGanZhi(lunarYear);
    return getShengXiaoByGanZhi(yGZ);
  }

  function getShengXiaoByGanZhi(ganZhi) {
    const zhi = ganZhi[1];
    return ShengXiaoMap[zhi] || '';
  }

  // ==================== 五行相关 ====================
  function getDayGanWuXing(dayGan) {
    return GanWuXing[dayGan] || '';
  }

  function getDayZhiWuXing(timeZhi) {
    return ZhiWuXing[timeZhi] || '';
  }

  // ==================== 命理简批 ====================
  function getMingLiBrief(baZi) {
    const { dayGanZhi, timeGanZhi } = baZi;
    const dayGan = dayGanZhi[0];
    const dayZhi = dayGanZhi[1];
    const timeZhi = timeGanZhi[1];

    const dayWuXing = getDayGanWuXing(dayGan);
    const timeWuXing = getDayZhiWuXing(timeZhi);

    // 简化日主强弱判断
    const dayGanStrength = analyzeDayGanStrength(baZi);

    return {
      dayGan,
      dayWuXing,
      dayZhi,
      timeGan: timeGanZhi[0],
      timeWuXing,
      timeZhi,
      dayGanStrength,
      summary: `${dayGan}日主，${dayWuXing}气，${timeWuXing}时宫，${dayGanStrength}`
    };
  }

  function analyzeDayGanStrength(baZi) {
    const monthZhi = baZi.monthGanZhi[1];
    const dayGan = baZi.dayGan;
    const timeGan = baZi.timeGan;

    // 月令地支对应的旺相
    const monthStrength = {
      '寅': '旺', '卯': '旺', '辰': '衰',
      '巳': '旺', '午': '旺', '未': '衰',
      '申': '旺', '酉': '旺', '戌': '衰',
      '亥': '旺', '子': '旺', '丑': '衰'
    };

    const hasTimeRoot = timeGan === dayGan;
    const strength = monthStrength[baZi.monthGanZhi[1]];
    return hasTimeRoot ? `身${strength}` : `身弱`;
  }

  // ==================== 获取闰月 ====================
  function getLeapMonth(lunarYear) {
    if (hasLib) {
      const lunar = LibLunar.fromYmd(lunarYear, 1, 1);
      return lunar.getLeapMonth();
    } else {
      return nativeGetLeapMonth(lunarYear);
    }
  }

  // ==================== 公历转八字（一步到位）====================
  function solarToBaZi(year, month, day, hour) {
    const lunar = solarToLunar(year, month, day);
    const baZi = getBaZi(lunar.lunarYear, lunar.lunarMonth, lunar.lunarDay, lunar.isLeap, hour);
    const mingLi = getMingLiBrief(baZi);

    return {
      lunar: lunar,
      baZi: baZi,
      mingLi: mingLi
    };
  }

  // ==================== 验证八字计算 ====================
  /**
   * 内置测试用例，验证八字计算正确性
   */
  function validateBaZi() {
    const tests = [
      {
        solar: [1984, 3, 8], hour: 0,
        expectedYear: '甲子', expectedDay: '辛丑', expectedTime: '戊子',
        desc: '早子时(00:14) - 应属当天二月初六'
      },
      {
        solar: [1984, 3, 8], hour: 23,
        expectedYear: '甲子', expectedDay: '壬寅', expectedTime: '庚子',
        desc: '晚子时(23:14) - 应算第二天二月初七'
      },
    ];

    return tests.map(t => {
      const lunar = solarToLunar(t.solar[0], t.solar[1], t.solar[2]);
      const baZi = getBaZi(lunar.lunarYear, lunar.lunarMonth, lunar.lunarDay, lunar.isLeap, t.hour);
      const passed = baZi.yearGanZhi === t.expectedYear && baZi.dayGanZhi === t.expectedDay && baZi.timeGanZhi === t.expectedTime;

      return {
        desc: t.desc,
        input: `${t.solar.join('-')} ${t.hour}:00`,
        lunar: `${lunar.lunarYear}年${lunar.monthName}${lunar.dayName}`,
        got: `${baZi.yearGanZhi} ${baZi.monthGanZhi} ${baZi.dayGanZhi} ${baZi.timeGanZhi}`,
        expected: `${t.expectedYear} ${baZi.monthGanZhi} ${t.expectedDay} ${t.expectedTime}`,
        passed,
        isLateNightZi: baZi.isLateNightZi
      };
    });
  }

  // ==================== 原生 Fallback 实现 ====================
  const lunarInfo = [
    0x04AE53, 0x0A5748, 0x5526BD, 0x0D2650, 0x0D9544, 0x46AAB9, 0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A,
    0x6AA550, 0x0B5545, 0x4BABB9, 0x0AD550, 0x056A45, 0x4AADB3, 0x025D48, 0x092D3C, 0x64D638, 0x0D4E43,
    0x6E9537, 0x0EA54C, 0x06B541, 0x56D4B6, 0x04DA4A, 0x0A5B3D, 0x25AAB3, 0x096D48, 0x4AEDD7, 0x04AE53,
    0x0D6546, 0x56D4BA, 0x055450, 0x0D5544, 0x46AAB9, 0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A, 0x6AA550,
    0x0AB545, 0x4BABB9, 0x0AD550, 0x056A45, 0x4AADB3, 0x025D48, 0x092D3C, 0x6CAE38, 0x0D4E43, 0x6E9537,
    0x0EA54C, 0x06B541, 0x56D4B6, 0x04DA4A, 0x0A5B3D, 0x25AAB3, 0x096D48, 0x4AEDD7, 0x04AE53, 0x0D6546,
    0x56D4BA, 0x055450, 0x0D5544, 0x46AAB9, 0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A, 0x6AA550, 0x0AB545,
    0x4BABB9, 0x0AD550, 0x056A45, 0x4AADB3, 0x025D48, 0x092D3C, 0x6CAE38, 0x0D4E43, 0x6E9537, 0x0EA54C,
    0x06B541, 0x56D4B6, 0x04DA4A, 0x0A5B3D, 0x25AAB3, 0x096D48, 0x4AEDD7, 0x04AE53, 0x0D6546, 0x56D4BA,
    0x055450, 0x0D5544, 0x46AAB9, 0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A, 0x6AA550, 0x0AB545, 0x4BABB9,
    0x0AD550, 0x056A45, 0x4AADB3, 0x025D48, 0x092D3C, 0x6CAE38, 0x0D4E43, 0x6E9537, 0x0EA54C, 0x06B541,
    0x56D4B6, 0x04DA4A, 0x0A5B3D, 0x25AAB3, 0x096D48, 0x4AEDD7, 0x04AE53, 0x0D6546, 0x56D4BA, 0x055450,
    0x0D5544, 0x46AAB9, 0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A, 0x6AA550, 0x0AB545, 0x4BABB9, 0x0AD550,
    0x056A45, 0x4AADB3, 0x025D48, 0x092D3C, 0x6CAE38, 0x0D4E43, 0x6E9537, 0x0EA54C, 0x06B541, 0x56D4B6,
    0x04DA4A, 0x0A5B3D, 0x25AAB3, 0x096D48, 0x4AEDD7, 0x04AE53, 0x0D6546, 0x56D4BA, 0x055450, 0x0D5544,
    0x46AAB9, 0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A, 0x6AA550, 0x0AB545, 0x4BABB9, 0x0AD550, 0x056A45,
    0x4AADB3, 0x025D48, 0x092D3C, 0x6CAE38, 0x0D4E43, 0x6E9537, 0x0EA54C, 0x06B541, 0x56D4B6, 0x04DA4A,
    0x0A5B3D, 0x25AAB3, 0x096D48, 0x4AEDD7, 0x04AE53, 0x0D6546, 0x56D4BA, 0x055450, 0x0D5544, 0x46AAB9,
    0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A, 0x6AA550, 0x0AB545, 0x4BABB9, 0x0AD550, 0x056A45, 0x4AADB3,
    0x025D48, 0x092D3C, 0x6CAE38, 0x0D4E43, 0x6E9537, 0x0EA54C, 0x06B541, 0x56D4B6, 0x04DA4A, 0x0A5B3D
  ];

  function nGetLeapMonth(y) { return lunarInfo[y - 1900] & 0xf; }
  function nGetLeapDays(y) { return nGetLeapMonth(y) ? ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29) : 0; }
  function nGetMonthDays(y, m) { if (m > 12 || m < 1) return -1; return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
  function nGetYearDays(y) { let sum = 348; for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0; return sum + nGetLeapDays(y); }
  function nativeGetLeapMonth(y) { return lunarInfo[y - 1900] & 0xf; }

  function nativeSolarToLunar(y, m, d) {
    const base = new Date(1900, 0, 31);
    const obj = new Date(y, m - 1, d);
    let offset = Math.round((obj - base) / 86400000);
    let ly = 1900, temp = 0;
    for (; ly < 2101 && offset > 0; ly++) { temp = nGetYearDays(ly); offset -= temp; }
    if (offset < 0) { offset += temp; ly--; }
    let leap = nGetLeapMonth(ly), isLeap = false, lm = 1;
    for (; lm < 13 && offset > 0; lm++) {
      if (leap > 0 && lm === leap + 1 && !isLeap) { lm--; isLeap = true; temp = nGetLeapDays(ly); }
      else { temp = nGetMonthDays(ly, lm); }
      if (isLeap && lm === leap + 1) isLeap = false;
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && lm === leap + 1) { isLeap ? isLeap = false : (isLeap = true, lm--); }
    if (offset < 0) { offset += temp; lm--; }
    const ld = offset + 1;
    const yi = ((ly - 4) % 60 + 60) % 60;
    return {
      lunarYear: ly, lunarMonth: lm, lunarDay: ld, isLeap,
      monthName: MonthNames[lm - 1], dayName: DayNames[ld - 1],
      yearGanZhi: TianGan[yi % 10] + DiZhi[yi % 12],
      shengXiao: '', solarDate: { year: y, month: m, day: d }
    };
  }

  function nativeLunarToSolar(ly, lm, ld, isLeap) {
    let offset = 0;
    for (let y = 1900; y < ly; y++) offset += nGetYearDays(y);
    const leap = nGetLeapMonth(ly), lp = false;
    for (let m = 1; m < lm; m++) {
      if (leap > 0 && m === leap && !lp) { offset += nGetLeapDays(ly); }
      offset += nGetMonthDays(ly, m);
    }
    if (isLeap) offset += nGetMonthDays(ly, lm);
    offset += ld - 1;
    const base = new Date(1900, 0, 31);
    const result = new Date(base.getTime() + offset * 86400000);
    return { year: result.getFullYear(), month: result.getMonth() + 1, day: result.getDate() };
  }

  function nativeGetDayGanZhi(y, m, d) {
    const base = new Date(2000, 0, 7);
    const target = new Date(y, m - 1, d);
    const diff = Math.round((target - base) / 86400000);
    const idx = ((diff % 60) + 60) % 60;
    return TianGan[idx % 10] + DiZhi[idx % 12];
  }

  function nativeGetMonthGanZhi(ly, lm) {
    const yi = (((ly - 4) % 60) + 60) % 60;
    const baseGan = [2, 4, 6, 8, 0];
    const gan = (baseGan[yi % 5] + lm - 1) % 10;
    const zhiOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
    return TianGan[gan] + zhiOrder[lm - 1];
  }

  function nativeGetBaZi(ly, lm, ld, isLeap, hour, solar, origLy, origLm, origLd, origIsLeap) {
    const yGZ = getYearGanZhi(ly);
    const mGZ = nativeGetMonthGanZhi(ly, lm);
    const dGZ = nativeGetDayGanZhi(solar.year, solar.month, solar.day);
    const tZ = getTimeZhi(hour);
    const dGIdx = TianGan.indexOf(dGZ[0]);
    const zhiIdx = DiZhi.indexOf(tZ);

    // 五鼠遁口诀公式
    const ziGanIdx = (dGIdx * 2) % 10;
    const tG = TianGan[(ziGanIdx + zhiIdx) % 10];
    const tGZ = tG + tZ;

    return {
      yearGanZhi: yGZ, monthGanZhi: mGZ, dayGanZhi: dGZ, timeGanZhi: tGZ,
      dayGan: dGZ[0], timeGan: tG, timeZhi: tZ,
      shengXiao: getShengXiaoByGanZhi(yGZ),
      lunarYear: ly, lunarMonth: lm, lunarDay: ld, isLeap: isLeap,
      originalInput: { lunarYear: origLy, lunarMonth: origLm, lunarDay: origLd, isLeap: origIsLeap, hour: hour },
      isLateNightZi: hour >= 23
    };
  }

  // ==================== 导出公共API ====================
  return {
    // 核心转换
    solarToLunar,
    lunarToSolar,
    solarToBaZi,
    getBaZi,

    // 八字组件
    getYearGanZhi,
    getMonthGanZhi,
    getDayGanZhi,
    getTimeGan,
    getTimeZhi,
    getShiChen,
    getShiChenDesc,

    // 生肖/五行
    getShengXiaoByYear,
    getShengXiaoByGanZhi,
    getDayGanWuXing,
    getDayZhiWuXing,

    // 命理分析
    getMingLiBrief,

    // 农历信息
    getLeapMonth,
    getNextLunarDay,

    // 工具
    validateBaZi,

    // 常量
    TianGan,
    DiZhi,
    MonthNames,
    DayNames,
    ShiChenNames,

    // 库状态
    hasLib,
    libName: 'lunar-javascript (6tail.cn)',
    version: '2.0.0'
  };
})();
