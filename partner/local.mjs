import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { partnerApi } from './api.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(process.env.MENABU_PARTNER_DATA || resolve(root,'.partner-data'));
await mkdir(directory,{recursive:true});
const db = new DatabaseSync(resolve(directory,'partner.sqlite'));
db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
db.exec(await readFile(new URL('../migrations/0001_partner.sql',import.meta.url),'utf8'));
const scope = {window:{}};
runInNewContext(await readFile(new URL('../wholesale-data.js',import.meta.url),'utf8'),scope);
const database = {
  prepare(sql) {
    const statement = db.prepare(sql);
    return {bind(...parameters) { return {
      first: () => Promise.resolve(statement.get(...parameters)),
      all: () => Promise.resolve({results:statement.all(...parameters)}),
      run: () => Promise.resolve({meta:statement.run(...parameters)})
    }; }};
  }
};
const api = partnerApi(database,scope.window.WHOLESALE_PRODUCTS);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
const rootPrefix = root.endsWith(sep) ? root : root+sep;
const host = '127.0.0.1';
const port = Number(process.env.MENABU_PARTNER_PORT || 8765);
createServer(async (req,res)=>{
  try {
    if (req.headers.host !== host+':'+port) {res.writeHead(400).end();return;}
    const url = new URL(req.url,'http://'+host+':'+port);
    if (url.pathname.startsWith('/api/partner/')) {
      const chunks = [];
      let size=0;
      for await (const chunk of req) {
        size+=chunk.length;
        if (size>32000) {res.writeHead(413).end();return;}
        chunks.push(chunk);
      }
      const request = new Request(url,{method:req.method,headers:req.headers,body:chunks.length ? Buffer.concat(chunks) : undefined});
      const response = await api(request);
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const relative = decodeURIComponent(url.pathname).slice(1);
    const file = resolve(root,relative+(url.pathname.endsWith('/')?'index.html':''));
    const type=types[extname(file)];
    const blocked = relative.split(/[\\/]/).some(part=>part.startsWith('.') || ['partner','migrations'].includes(part));
    if (req.method!=='GET' || !file.startsWith(rootPrefix) || !type || blocked) {res.writeHead(404).end();return;}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff'}).end(data);
  } catch(e) {
    if (e.code==='ENOENT') {res.writeHead(404).end();return;}
    console.error(e.code || e.name);
    res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Сервис временно недоступен.'}));
  }
}).listen(port,host,()=>console.log('http://'+host+':'+port+'/wholesale.html#partner'));
