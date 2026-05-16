# 还阴债计算系统 - 配置文档

## 系统概览

| 项目 | 说明 |
|------|------|
| 系统名称 | 还阴债计算系统 |
| 当前版本 | v2.0.0 |
| 最后更新 | 2024-01-15 |
| 八字计算引擎 | lunar-javascript (6tail.cn) |
| 核心依赖 | lunar-lib.js, lunar.js, calc.js |

---

## 核心修复记录

### v2.0.0 (2024-01-15) - 八字排盘修复

#### 1. 早子时与晚子时区分

**问题说明：**
- 子时（23:00-00:59）是昼夜交替时段，古代命理分早晚子时
- 早子时（00:00-00:59）：属当天，农历日期不变
- 晚子时（23:00-23:59）：算第二天开始，农历日期+1

**测试用例：**

| 公历时间 | 农历日期（早子时） | 农历日期（晚子时） | 日柱 | 时柱 |
|---------|------------------|------------------|------|------|
| 1984-03-08 00:14 | 二月初六 | - | 辛丑 | 戊子 |
| 1984-03-08 23:14 | - | 二月初七 | 壬寅 | 庚子 |

#### 2. 五鼠遁口诀公式修正

**口诀：**
```
甲己日起甲子
乙庚日起丙子
丙辛日起戊子
丁壬日起庚子
戊癸日起壬子
```

**公式推导：**
```
子时天干 = (日干index × 2) % 10
时干 = (子时天干 + 时支index) % 10
```

**示例计算（辛丑日）：**
- 日干辛 → index=7
- 子时天干 = (7 × 2) % 10 = 14 % 10 = 4 → 戊
- 子时 → index=0
- 时干 = (4 + 0) % 10 = 4 → 戊
- 结果：戊子 ✓

---

## 文件结构

```
yinzhai/
├── index.html              # 首页
├── calculate.html          # 主计算页面
├── detail.html             # 记录详情
├── history.html            # 历史记录
├── login.html              # 登录页
├── register.html          # 注册页
├── profile.html            # 个人中心
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── lunar-lib.js        # 农历库（lunar-javascript完整版）
│   ├── lunar-lib.min.js    # 农历库（压缩版，未使用）
│   ├── lunar.js            # 八字计算核心（已修复）
│   ├── calc.js             # 还阴债计算引擎
│   └── auth.js             # 认证模块
└── lunar-javascript-master/
    └── lunar.js            # 原始库源码
```

---

## API 参考

### Lunar 对象

```javascript
// 核心转换
Lunar.solarToLunar(year, month, day)  // 公历→农历
Lunar.lunarToSolar(ly, lm, ld, leap) // 农历→公历
Lunar.getBaZi(ly, lm, ld, leap, hour) // 获取完整八字
Lunar.solarToBaZi(y, m, d, hour)     // 公历直接转八字

// 八字组件
Lunar.getYearGanZhi(lunarYear)        // 年干支
Lunar.getMonthGanZhi(ly, lm)          // 月干支
Lunar.getDayGanZhi(y, m, d)           // 日干支
Lunar.getTimeGan(dayGan, timeZhi)     // 时干（五鼠遁）
Lunar.getTimeZhi(hour)                // 时支
Lunar.getShiChen(hour)                // 时辰名称

// 工具
Lunar.validateBaZi()                  // 验证计算正确性
Lunar.getLeapMonth(lunarYear)         // 获取闰月
Lunar.solarToBaZi()                   // 一键八字排盘
```

### DebtCalc 对象

```javascript
// 主计算
DebtCalc.calculate(params, birthSolarYear)

// 工具
DebtCalc.getConfig()                  // 获取系统配置
DebtCalc.getAllYearDebts()            // 获取年柱欠债表
DebtCalc.formatCurrency(amount)       // 格式化金额
DebtCalc.calculateDemo()              // 示例计算
```

---

## 还阴债计算规则

### 计算公式

```
官债 = 年柱 + 月干 + 月份 + 日 + 时干 + 时支
私债 = 官债
利息 = 私债 × 年龄倍数
总计 = 官债 + 私债 + 利息
```

### 年龄倍数表

| 年龄范围 | 倍数 |
|---------|------|
| 0-9岁 | ×2 |
| 10-19岁 | ×3 |
| 20-29岁 | ×4 |
| 30-39岁 | ×5 |
| 40-49岁 | ×6 |
| 50-59岁 | ×7 |
| 60-69岁 | ×8 |
| 70-79岁 | ×9 |
| 80岁以上 | ×10 |

### 各柱欠债明细

#### 年柱欠债表（六十甲子）

| 干支 | 金额(元) | 读经(遍) | 纳库 | 曹官 |
|------|---------|---------|------|------|
| 甲子 | 53,000 | 18 | 3 | 元 |
| 乙丑 | 280,000 | 94 | 13 | 田 |
| 丙寅 | 80,000 | 27 | 10 | 马 |
| 丁卯 | 23,000 | 8 | 11 | 许 |
| 戊辰 | 54,000 | 18 | 14 | 冯 |
| ... | ... | ... | ... | ... |

（完整六十甲子数据见 calc.js）

#### 月柱欠债

- 月干欠债：10,000-100,000元（按天干递增）
- 月份欠债：1,000-12,000元（正月→腊月递增）

#### 日柱欠债

- 按农历日：1,000-30,000元（初一→三十递增）

#### 时柱欠债

- 时干欠债：10,000-100,000元（按天干递增）
- 时支欠债：1,000-12,000元（按地支递增）

---

## 使用示例

### 1. 直接使用八字排盘

```javascript
// 公历直接转八字（最简单方式）
const result = Lunar.solarToBaZi(1984, 3, 8, 23);
console.log(result.baZi);
// {
//   yearGanZhi: '甲子',
//   monthGanZhi: '丁卯',
//   dayGanZhi: '壬寅',
//   timeGanZhi: '庚子',
//   ...
// }
```

### 2. 计算还阴债

```javascript
const params = {
  lunarYear: 1984,
  lunarMonth: 2,
  lunarDay: 7,
  isLeap: false,
  hour: 23
};
const result = DebtCalc.calculate(params, 1984);
console.log(result.totalDebt); // 总欠债金额
```

### 3. 验证计算正确性

```javascript
const validation = Lunar.validateBaZi();
console.log(validation);
// [{desc: '早子时(00:14)...', passed: true}, ...]
```

---

## 配置项

### 年龄倍数配置（calc.js）

```javascript
const AGE_MULTIPLIER_CONFIG = {
  ranges: [
    { min: 0, max: 9, mul: 2 },
    { min: 10, max: 19, mul: 3 },
    // ...
  ],
  description: '年龄倍数表说明'
};
```

### 欠债数据配置

各柱欠债数据存储在 `calc.js` 的常量中：
- `YEAR_DEBT`: 年柱欠债表（六十甲子完整数据）
- `MONTH_GAN_DEBT`: 月干欠债表
- `MONTH_DEBT`: 月份欠债表
- `DAY_DEBT`: 日柱欠债表
- `TIME_GAN_DEBT`: 时干欠债表
- `TIME_ZHI_DEBT`: 时支欠债表

---

## 浏览器兼容性

| 浏览器 | 支持版本 |
|--------|---------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 11+ |
| Edge | 79+ |
| IE | 不支持 |

---

## 技术栈

- **前端框架**: 原生 JavaScript (ES6+)
- **农历计算库**: lunar-javascript (https://6tail.cn/calendar/)
- **数据存储**: LocalStorage
- **样式**: CSS3 + Flexbox

---

## 更新日志

### v2.0.0 (2024-01-15)
- ✅ 修复早子时/晚子时区分问题
- ✅ 修正五鼠遁口诀公式
- ✅ 增加 validateBaZi() 验证函数
- ✅ 增加命理简批功能
- ✅ 优化代码结构，删除重复代码

### v1.0.0
- 初始版本
- 基础还阴债计算功能
