#!/usr/bin/env python3
"""
寿生宝鉴（还阴债计算）— 后端服务
基于 Flask + SQLite，提供用户认证与记录管理的 REST API

免费分享，愿见者得安。
信诚则灵，心念为善。
"""

import sqlite3
import os
import sys
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# PyInstaller 打包时资源在 sys._MEIPASS，否则取脚本所在目录
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
    # 数据库放在 exe 同级目录，确保数据持久化
    DB_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_DIR = BASE_DIR

DB_PATH = os.path.join(DB_DIR, 'yinzhai.db')

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
CORS(app, supports_credentials=True, origins=["http://localhost:5000", "http://127.0.0.1:5000", "null"])

# ========== 数据库初始化 ==========

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            created_at TEXT DEFAULT ''
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT DEFAULT '',
            input_type TEXT DEFAULT 'lunar',
            lunar_year INTEGER,
            lunar_month INTEGER,
            lunar_day INTEGER,
            is_leap INTEGER DEFAULT 0,
            hour_zhi TEXT DEFAULT '',
            bazi TEXT DEFAULT '',
            official_debt INTEGER DEFAULT 0,
            private_debt INTEGER DEFAULT 0,
            official_interest INTEGER DEFAULT 0,
            private_interest INTEGER DEFAULT 0,
            total_debt INTEGER DEFAULT 0,
            reading INTEGER DEFAULT 0,
            naku INTEGER DEFAULT 0,
            caoguan TEXT DEFAULT '',
            result_detail TEXT DEFAULT '',
            created_at TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    # 尝试添加官债利息字段（如果已存在表则忽略）
    try:
        cur.execute('ALTER TABLE records ADD COLUMN official_interest INTEGER DEFAULT 0')
        conn.commit()
    except:
        pass
    conn.commit()
    conn.close()
    print(f'[DB] 数据库已初始化: {DB_PATH}')

init_db()

# ========== 工具函数 ==========

def error(msg, code=400):
    return jsonify({'ok': False, 'msg': msg}), code

def success(data=None, msg=''):
    d = {'ok': True}
    if data is not None:
        d.update(data)
    if msg:
        d['msg'] = msg
    return jsonify(d)

def b64_encode(s):
    import base64
    return base64.b64encode(s.encode()).decode()

def b64_decode(s):
    import base64
    return base64.b64decode(s).decode()

# ========== 静态文件 ==========

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(BASE_DIR, path)

# ========== API：注册 ==========

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    phone = (data.get('phone') or '').strip()
    email = (data.get('email') or '').strip()

    if len(username) < 2:
        return error('用户名至少2个字符')
    if len(password) < 6:
        return error('密码至少6位')

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id FROM users WHERE username = ?', (username,))
    if cur.fetchone():
        conn.close()
        return error('用户名已存在')

    cur.execute(
        'INSERT INTO users (username, password, phone, email, created_at) VALUES (?,?,?,?,?)',
        (username, b64_encode(password), phone, email, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return success(msg='注册成功')

# ========== API：登录 ==========

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, username, password, phone, email, created_at FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return error('用户名不存在')
    if b64_decode(row['password']) != password:
        return error('密码错误')

    user = {
        'id': row['id'],
        'username': row['username'],
        'phone': row['phone'],
        'email': row['email'],
        'created_at': row['created_at']
    }
    return success({'user': user})

# ========== API：获取用户信息 ==========

@app.route('/api/profile', methods=['GET'])
def api_profile():
    username = request.args.get('username') or ''
    if not username:
        return error('未提供用户名')

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, username, phone, email, created_at FROM users WHERE username = ?', (username,))
    row = cur.fetchone()

    if not row:
        conn.close()
        return error('用户不存在')

    # 获取记录数
    cur.execute('SELECT COUNT(*) as cnt FROM records WHERE user_id = ?', (row['id'],))
    rec_count = cur.fetchone()['cnt']
    conn.close()

    return success({
        'user': {
            'username': row['username'],
            'phone': row['phone'],
            'email': row['email'],
            'created_at': row['created_at'],
            'record_count': rec_count
        }
    })

# ========== API：修改密码 ==========

@app.route('/api/password', methods=['PUT'])
def api_password():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()
    old_pwd = (data.get('oldPwd') or '').strip()
    new_pwd = (data.get('newPwd') or '').strip()

    if len(new_pwd) < 6:
        return error('新密码至少6位')

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT password FROM users WHERE username = ?', (username,))
    row = cur.fetchone()

    if not row or b64_decode(row['password']) != old_pwd:
        conn.close()
        return error('当前密码错误')

    cur.execute('UPDATE users SET password = ? WHERE username = ?', (b64_encode(new_pwd), username))
    conn.commit()
    conn.close()
    return success(msg='密码修改成功')

# ========== API：删除账号 ==========

@app.route('/api/account', methods=['DELETE'])
def api_delete_account():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    if row:
        # 删除记录
        cur.execute('DELETE FROM records WHERE user_id = ?', (row['id'],))
        # 删除用户
        cur.execute('DELETE FROM users WHERE id = ?', (row['id'],))
        conn.commit()
    conn.close()
    return success(msg='账号已注销')

# ========== API：获取记录列表 ==========

@app.route('/api/records', methods=['GET'])
def api_get_records():
    username = request.args.get('username') or ''
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    keyword = (request.args.get('keyword') or '').strip()

    if not username:
        return error('未提供用户名')

    conn = get_db()
    cur = conn.cursor()

    cur.execute('SELECT id FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return success({'records': [], 'total': 0, 'page': page, 'page_size': page_size})
    user_id = row['id']

    # 查询
    if keyword:
        q = '%' + keyword + '%'
        cur.execute(
            'SELECT * FROM records WHERE user_id = ? AND (name LIKE ? OR bazi LIKE ?) ORDER BY created_at DESC',
            (user_id, q, q)
        )
    else:
        cur.execute(
            'SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        )
    all_rows = cur.fetchall()
    total = len(all_rows)

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    page_rows = all_rows[start:end]

    records = []
    for r in page_rows:
        records.append({
            'id': r['id'],
            'name': r['name'],
            'input_type': r['input_type'],
            'lunar_year': r['lunar_year'],
            'lunar_month': r['lunar_month'],
            'lunar_day': r['lunar_day'],
            'is_leap': r['is_leap'],
            'hour_zhi': r['hour_zhi'],
            'bazi': r['bazi'],
            'official_debt': r['official_debt'],
            'private_debt': r['private_debt'],
            'official_interest': r['official_interest'],
            'private_interest': r['private_interest'],
            'total_debt': r['total_debt'],
            'reading': r['reading'],
            'naku': r['naku'],
            'caoguan': r['caoguan'],
            'created_at': r['created_at']
        })

    conn.close()
    return success({
        'records': records,
        'total': total,
        'page': page,
        'page_size': page_size
    })

# ========== API：保存记录 ==========

@app.route('/api/records', methods=['POST'])
def api_save_record():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()
    record = data.get('record') or {}

    if not username:
        return error('未提供用户名')

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return error('用户不存在')
    user_id = row['id']

    import time, random
    rec_id = str(int(time.time() * 1000)) + random.random().__str__().split('.')[1][:4]
    now = datetime.now().isoformat()

    cur.execute('''
        INSERT INTO records (
            id, user_id, name, input_type, lunar_year, lunar_month, lunar_day,
            is_leap, hour_zhi, bazi, official_debt, private_debt,
            official_interest, private_interest, total_debt, reading, naku, caoguan,
            result_detail, created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', (
        rec_id, user_id,
        record.get('name', ''),
        record.get('input_type', 'lunar'),
        record.get('lunar_year'),
        record.get('lunar_month'),
        record.get('lunar_day'),
        1 if record.get('is_leap') else 0,
        record.get('hour_zhi', ''),
        record.get('bazi', ''),
        record.get('official_debt', 0),
        record.get('private_debt', 0),
        record.get('official_interest', 0),
        record.get('private_interest', 0),
        record.get('total_debt', 0),
        record.get('reading', 0),
        record.get('naku', 0),
        record.get('caoguan', ''),
        json.dumps(record.get('result_detail', {})),
        now
    ))
    conn.commit()
    conn.close()
    return success({'id': rec_id}, msg='记录已保存')

# ========== API：删除记录 ==========

@app.route('/api/records/<rec_id>', methods=['DELETE'])
def api_delete_record(rec_id):
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return error('用户不存在')

    cur.execute('DELETE FROM records WHERE id = ? AND user_id = ?', (rec_id, row['id']))
    conn.commit()
    conn.close()
    return success(msg='记录已删除')

# ========== 启动 ==========

if __name__ == '__main__':
    print('=' * 50)
    print('  寿生宝鉴 后端服务')
    print('  数据库:', DB_PATH)
    print('  访问地址: http://localhost:5000')
    print('  按 Ctrl+C 停止服务')
    print('=' * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
