/**
 * 寿生宝鉴（还阴债计算）— 用户认证与记录管理（纯本地版）
 * 所有数据存储于 localStorage，无需后端服务器
 * 
 * 免费分享，愿见者得安。
 * 信诚则灵，心念为善。
 */
(function(){
  var SESSION_KEY  = 'yinzhai_session';
  var USERS_KEY    = 'yinzhai_users';
  var RECORDS_KEY  = 'yinzhai_records';

  // ---------- 底层存取 ----------

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function setUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  function getRecords() {
    try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function setRecords(r) { localStorage.setItem(RECORDS_KEY, JSON.stringify(r)); }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  // ---------- 同步返回（统一包装为 Promise，兼容所有调用方） ----------

  function ok(data) { return Promise.resolve(Object.assign({ok: true}, data || {})); }
  function err(msg) { return Promise.resolve({ok: false, msg: msg || '操作失败'}); }

  // ========== Auth 对象 ==========

  window.Auth = {

    // -------- 登录状态 --------

    getCurrentUsername: function() {
      return localStorage.getItem(SESSION_KEY) || null;
    },

    getUsername: function() {
      return localStorage.getItem(SESSION_KEY) || null;
    },

    // -------- 注册 --------
    // register(username, password, phone, email) -> Promise
    register: function(username, password, phone, email) {
      username = (username || '').trim();
      password = (password || '').trim();
      if (username.length < 2) return err('用户名至少2个字符');
      if (password.length < 6) return err('密码至少6位');

      var users = getUsers();
      if (users[username]) return err('用户名已存在');

      users[username] = {
        password: password,   // 简单存储（演示用），生产环境建议 btoa()
        phone:    (phone  || '').trim(),
        email:    (email  || '').trim(),
        created_at: new Date().toISOString()
      };
      setUsers(users);
      return ok({ username: username, msg: '注册成功' });
    },

    // -------- 登录 --------
    // login(username, password) -> Promise
    login: function(username, password) {
      username = (username || '').trim();
      password = (password || '').trim();
      if (!username || !password) return err('请输入用户名和密码');

      var users = getUsers();
      var u = users[username];
      if (!u) return err('用户名不存在');
      if (u.password !== password) return err('密码错误');

      localStorage.setItem(SESSION_KEY, username);
      return ok({ user: { username: username, phone: u.phone, email: u.email, created_at: u.created_at } });
    },

    // -------- 退出 --------
    logout: function() {
      localStorage.removeItem(SESSION_KEY);
    },

    // -------- 需要登录 --------
    requireLogin: function() {
      if (!this.getCurrentUsername()) {
        location.href = 'login.html';
        return false;
      }
      return true;
    },

    // -------- 个人信息 --------
    // getProfile(username) -> Promise
    getProfile: function(username) {
      var users = getUsers();
      var u = users[username];
      if (!u) return err('用户不存在');

      var records = getRecords();
      var userRecords = records[username] || [];
      return ok({
        user: {
          username:     username,
          phone:        u.phone    || '',
          email:        u.email    || '',
          created_at:   u.created_at || '',
          record_count: userRecords.length
        }
      });
    },

    // -------- 修改密码 --------
    // updatePassword(username, oldPwd, newPwd) -> Promise
    updatePassword: function(username, oldPwd, newPwd) {
      newPwd = (newPwd || '').trim();
      if (newPwd.length < 6) return err('新密码至少6位');

      var users = getUsers();
      var u = users[username];
      if (!u) return err('用户不存在');
      if (u.password !== oldPwd) return err('当前密码错误');

      users[username].password = newPwd;
      setUsers(users);
      return ok({ msg: '密码修改成功' });
    },

    // -------- 注销账号 --------
    // deleteAccount(username) -> Promise
    deleteAccount: function(username) {
      var users = getUsers();
      var records = getRecords();
      delete users[username];
      delete records[username];
      setUsers(users);
      setRecords(records);
      this.logout();
      return ok({ msg: '账号已注销' });
    },

    // -------- 获取记录列表 --------
    // getRecords(username, page, pageSize, keyword) -> Promise
    getRecords: function(username, page, pageSize, keyword) {
      var records = getRecords();
      var list = (records[username] || []).slice().reverse(); // 最新在前

      if (keyword) {
        keyword = keyword.toLowerCase();
        list = list.filter(function(r) {
          return (r.name  && r.name.toLowerCase().indexOf(keyword)  > -1) ||
                 (r.bazi  && r.bazi.toLowerCase().indexOf(keyword)  > -1);
        });
      }

      var total     = list.length;
      page          = Math.max(1, parseInt(page, 10)  || 1);
      pageSize      = Math.max(1, parseInt(pageSize, 10) || 20);
      var start     = (page - 1) * pageSize;
      var pageRows  = list.slice(start, start + pageSize);

      return ok({ records: pageRows, total: total, page: page, page_size: pageSize });
    },

    // -------- 保存记录 --------
    // saveRecord(username, record) -> Promise
    saveRecord: function(username, record) {
      var records = getRecords();
      if (!records[username]) records[username] = [];

      var newRecord = {
        id:            genId(),
        name:          record.name          || '',
        input_type:    record.input_type    || 'lunar',
        lunar_year:    record.lunar_year    || 0,
        lunar_month:   record.lunar_month   || 0,
        lunar_day:     record.lunar_day     || 0,
        is_leap:       record.is_leap       || 0,
        hour_zhi:      record.hour_zhi      || '',
        bazi:          record.bazi          || '',
        official_debt: record.official_debt || 0,
        private_debt:  record.private_debt  || 0,
        official_interest: record.official_interest || 0,
        private_interest:  record.private_interest  || 0,
        total_debt:    record.total_debt    || 0,
        reading:        record.reading       || 0,
        naku:          record.naku          || 0,
        caoguan:       record.caoguan       || '',
        result_detail: record.result_detail || '{}',
        created_at:    record.created_at    || new Date().toISOString()
      };

      records[username].push(newRecord);
      setRecords(records);
      return ok({ id: newRecord.id, msg: '记录已保存' });
    },

    // -------- 获取单条记录 --------
    // getRecord(username, id) -> Promise
    getRecord: function(username, id) {
      var records = getRecords();
      var list = records[username] || [];
      var found = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) { found = list[i]; break; }
      }
      return ok(found);
    },

    // -------- 删除记录 --------
    // deleteRecord(username, id) -> Promise
    deleteRecord: function(username, id) {
      var records = getRecords();
      if (records[username]) {
        records[username] = records[username].filter(function(r){ return r.id !== id; });
        setRecords(records);
      }
      return ok({ msg: '记录已删除' });
    }

  };
})();
