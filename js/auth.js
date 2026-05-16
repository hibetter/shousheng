/**
 * 寿生宝鉴 - 用户认证与记录管理（API 版）
 * 后端地址：<ADDRESS>http://localhost:5000</ADDRESS>
 */
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? ''          // 同域部署时直接用相对路径
  : 'http://localhost:5000';

const Auth = (function () {
  const SESSION_KEY = 'yinzhai_session';

  // ========== 工具 ==========
  function api(path, options) {
    const url = API_BASE + path;
    return fetch(url, Object.assign({
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    }, options))
    .then(r => r.json());
  }

  function getUsername() {
    return localStorage.getItem(SESSION_KEY);
  }

  // ========== 注册 ==========
  function register(username, password, phone, email) {
    if (!username || username.length < 2) return Promise.resolve({ ok: false, msg: '用户名至少2个字符' });
    if (!password || password.length < 6) return Promise.resolve({ ok: false, msg: '密码至少6位' });
    return api('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, phone, email })
    });
  }

  // ========== 登录 ==========
  function login(username, password) {
    if (!username || !password) return Promise.resolve({ ok: false, msg: '请输入用户名和密码' });
    return api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }).then(data => {
      if (data.ok) {
        localStorage.setItem(SESSION_KEY, username);
      }
      return data;
    });
  }

  // ========== 退出 ==========
  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  // ========== 需要登录 ==========
  function requireLogin() {
    if (!getUsername()) {
      location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ========== 获取个人信息 ==========
  function getProfile(username) {
    return api('/api/profile?username=' + encodeURIComponent(username), { method: 'GET' });
  }

  // ========== 修改密码 ==========
  function updatePassword(username, oldPwd, newPwd) {
    if (!newPwd || newPwd.length < 6) return Promise.resolve({ ok: false, msg: '新密码至少6位' });
    return api('/api/password', {
      method: 'PUT',
      body: JSON.stringify({ username, oldPwd, newPwd })
    });
  }

  // ========== 注销账号 ==========
  function deleteAccount(username) {
    return api('/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ username })
    }).then(data => {
      if (data.ok) logout();
      return data;
    });
  }

  // ========== 记录管理 ==========
  function getRecords(username, page, pageSize, keyword) {
    let url = '/api/records?username=' + encodeURIComponent(username);
    if (page) url += '&page=' + page;
    if (pageSize) url += '&page_size=' + pageSize;
    if (keyword) url += '&keyword=' + encodeURIComponent(keyword);
    return api(url, { method: 'GET' });
  }

  function saveRecord(username, record) {
    return api('/api/records', {
      method: 'POST',
      body: JSON.stringify({ username, record })
    });
  }

  function deleteRecord(username, id) {
    return api('/api/records/' + encodeURIComponent(id), {
      method: 'DELETE',
      body: JSON.stringify({ username })
    });
  }

  function getRecord(username, id) {
    return getRecords(username).then(data => {
      if (!data.ok) return null;
      return (data.records || []).find(r => r.id === id) || null;
    });
  }

  return {
    register,
    login,
    logout,
    getUsername,
    getCurrentUsername: getUsername,   // 别名，兼容各处调用
    requireLogin,
    getProfile,
    updatePassword,
    deleteAccount,
    getRecords,
    saveRecord,
    deleteRecord,
    getRecord,
  };
})();
