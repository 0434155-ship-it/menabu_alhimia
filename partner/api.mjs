const encoder = new TextEncoder();
const ttl = 7 * 24 * 60 * 60;
const cookieName = 'menabu_partner';
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const random = size => hex(crypto.getRandomValues(new Uint8Array(size)));
const hash = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000}, key, 256));
}

function same(a,b) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function json(body, status = 200, headers = {}) {
  return Response.json(body, {status, headers: {'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers}});
}

function error(message,status) {
  return json({error:message},status);
}

function sessionCookie(value, maxAge, secure) {
  return cookieName + '=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge + (secure ? '; Secure' : '');
}

function productKeys(products) {
  return new Map(products.flatMap(product => product.variants.map(variant => {
    const item = [product.name, variant.label, variant.weight].join('|');
    return [item, {name:product.name, variant:variant.label, weight:variant.weight}];
  })));
}

export function partnerApi(database, products, prices = {}) {
  const keys = productKeys(products);
  return async request => {
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();
    const write = request.method === 'POST';
    const secure = url.protocol === 'https:';
    if (!write && request.method !== 'GET') return error('Метод не поддерживается.',405);
    if (write && (request.headers.get('Origin') !== url.origin || !request.headers.get('Content-Type')?.startsWith('application/json'))) {
      return error('Запрос не принят.',403);
    }

    const db = (sql,...params) => database.prepare(sql).bind(...params);
    const now = Math.floor(Date.now()/1000);
    let body;
    if (write) {
      const raw = await request.text();
      if (raw.length > 24000) return error('Запрос слишком большой.',413);
      try { body = JSON.parse(raw); } catch { return error('Проверьте данные формы.',400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return error('Проверьте данные формы.',400);
    }

    if (write && (action === 'register' || action === 'login')) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const company = typeof body.company === 'string' ? body.company.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) {
        return error('Введите адрес электронной почты и пароль длиной от 12 до 128 символов.',400);
      }
      if (action === 'register' && (!company || company.length > 100)) return error('Укажите название компании до 100 символов.',400);
      const bucket = Math.floor(now/600);
      const caller = request.headers.get('CF-Connecting-IP') || 'local';
      for (const [scope, limit] of [['ip:'+caller,30],['email:'+email,8]]) {
        const key = await hash(scope);
        const row = await db('INSERT INTO partner_attempts VALUES(?,?,1) ON CONFLICT(scope,minute) DO UPDATE SET count=count+1 RETURNING count',key,bucket).first();
        if (row.count > limit) return error('Слишком много попыток. Попробуйте через несколько минут.',429);
      }
      await db('DELETE FROM partner_attempts WHERE minute < ?',bucket-2).run();
      let account = await db('SELECT * FROM partner_accounts WHERE email=?',email).first();
      if (action === 'register') {
        if (account) return error('Для этого адреса уже есть аккаунт. Войдите в кабинет.',409);
        const salt = random(24);
        account = {id:crypto.randomUUID(), email, company, salt, password_hash:await passwordHash(password,salt)};
        const result = await db('INSERT INTO partner_accounts VALUES(?,?,?,?,?) ON CONFLICT(email) DO NOTHING',account.id,email,company,salt,account.password_hash).run();
        if (result.meta.changes === 0) return error('Для этого адреса уже есть аккаунт. Войдите в кабинет.',409);
      } else {
        const attempted = await passwordHash(password,account?.salt || 'invalid-account');
        if (!account || !same(account.password_hash,attempted)) return error('Проверьте почту и пароль.',401);
      }
      const token = random(32);
      await db('DELETE FROM partner_sessions WHERE expires <= ?',now).run();
      await db('INSERT INTO partner_sessions VALUES(?,?,?)',await hash(token),account.id,now+ttl).run();
      return json({company:account.company},200,{'Set-Cookie':sessionCookie(token,ttl,secure)});
    }

    const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)menabu_partner=([a-f0-9]{64})(?:;|$)/)?.[1];
    const tokenHash = token && await hash(token);
    if (write && action === 'logout') {
      if (tokenHash) await db('DELETE FROM partner_sessions WHERE token_hash=?',tokenHash).run();
      return json({ok:true},200,{'Set-Cookie':sessionCookie('',0,secure)});
    }
    const account = tokenHash && await db('SELECT a.id,a.company FROM partner_sessions s JOIN partner_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>?',tokenHash,now).first();
    if (!account) return error('Войдите в кабинет партнёра.',401);

    if (!write && action === 'state') {
      const [favorites, orders] = await Promise.all([
        db('SELECT item FROM partner_favorites WHERE account_id=? ORDER BY item',account.id).all(),
        db('SELECT id,created,items FROM partner_orders WHERE account_id=? ORDER BY created DESC,rowid DESC',account.id).all()
      ]);
      return json({company:account.company, favorites:favorites.results.map(row=>row.item), prices, orders:orders.results.map(row=>({...row,items:JSON.parse(row.items)}))});
    }

    if (write && action === 'favorite') {
      if (!keys.has(body.item) || typeof body.selected !== 'boolean') return error('Изделие не найдено.',400);
      if (body.selected) await db('INSERT OR IGNORE INTO partner_favorites VALUES(?,?)',account.id,body.item).run();
      else await db('DELETE FROM partner_favorites WHERE account_id=? AND item=?',account.id,body.item).run();
      return json({ok:true});
    }

    if (write && action === 'order') {
      if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/.test(body.id) || !Array.isArray(body.items) || !body.items.length || body.items.length > 40) {
        return error('Выберите до 40 позиций для заявки.',400);
      }
      if (new Set(body.items.map(line=>line?.item)).size !== body.items.length ||
          body.items.some(line=>!keys.has(line?.item) || !Number.isInteger(line.quantity) || line.quantity<1 || line.quantity>999)) {
        return error('Проверьте изделия и количество.',400);
      }
      const items = body.items.map(line=>({...keys.get(line.item), quantity:line.quantity}));
      const id = account.id + ':' + body.id;
      await db('INSERT OR IGNORE INTO partner_orders VALUES(?,?,?,?)',id,account.id,now,JSON.stringify(items)).run();
      const saved = await db('SELECT created,items FROM partner_orders WHERE id=? AND account_id=?',id,account.id).first();
      return json({id,created:saved.created,items:JSON.parse(saved.items)},201);
    }
    return error('Страница не найдена.',404);
  };
}
