const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const path = require("path")
const logger = require('koa-logger')
const Koa = require('koa')
const Router = require('@koa/router')
const { koaBody } = require('koa-body')
const url = require("url")
const fs = require('fs')
const mime = require('mime')
const zlib = require('zlib')


const folderPath = './db'

const dbFile = path.resolve(__dirname, folderPath, "./todo.db")


let isExist = true
if (!fs.existsSync(dbFile)) {
    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(dbFile,'')
    isExist = false
}



const app = new Koa()
const router = new Router({
    exclusive: true
})

let db
app.use(async (ctx, next) => {
    if (!db) {
        db = await open({
            filename: dbFile,
            driver: sqlite3.cached.Database
        })
        if (!isExist) {
            await db.exec(`CREATE TABLE todo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT,
                state TEXT
            );`)
        }
    }
    ctx.database = db
    await next()
})

router.get("(.*)", async ({ params, req, response, res }, next) => {
    let filePath = path.resolve(__dirname, path.join('../fe', url.fileURLToPath(`file:///${req.url}`)));
    console.log("filePath", filePath)
    if(fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if(stats.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        if(fs.existsSync(filePath)) {
          const {ext} = path.parse(filePath);
          const stats = fs.statSync(filePath);
          const timeStamp = req.headers['if-modified-since'];
          res.statusCode = 200;
          if(timeStamp && Number(timeStamp) === stats.mtimeMs) {
            res.statusCode = 304;
          }
          const mimeType = mime.getType(ext);
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'max-age=86400');
          res.setHeader('Last-Modified', stats.mtimeMs);
          const acceptEncoding = req.headers['accept-encoding'];
          const compress = acceptEncoding && /^(text|application)\//.test(mimeType);
          let compressionEncoding;
          if(compress) {
            acceptEncoding.split(/\s*,\s*/).some((encoding) => {
              if(encoding === 'gzip') {
                res.setHeader('Content-Encoding', 'gzip');
                compressionEncoding = encoding;
                return true;
              }
              if(encoding === 'deflate') {
                res.setHeader('Content-Encoding', 'deflate');
                compressionEncoding = encoding;
                return true;
              }
              if(encoding === 'br') {
                res.setHeader('Content-Encoding', 'br');
                compressionEncoding = encoding;
                return true;
              }
              return false;
            });
          }
          if(res.statusCode === 200) {
            const fileStream = fs.createReadStream(filePath);
            if(compress && compressionEncoding) {
              let comp;
              if(compressionEncoding === 'gzip') {
                comp = zlib.createGzip();
              } else if(compressionEncoding === 'deflate') {
                comp = zlib.createDeflate();
              } else {
                comp = zlib.createBrotliCompress();
              }
              response.body = fileStream.pipe(comp);
            } else {
              response.body = fileStream;
            }
          }
        }
      } else {
        res.setHeader('Content-Type', 'text/html');
        response.body = '<h1>Not Found</h1>';
        res.statusCode = 404;
      }
    
      await next();
})

router.get("/list", koaBody(), async ({ database, request, res, response }, next) => {
    const { getList } = require("./model/todolist")
    const result = await getList(database)
    response.body = { data: result }
    await next()
})

router.post('/add', koaBody(), async (ctx, next) => {
    const { database, response } = ctx
    const { addTask } = require('./model/todolist')
    const params = ctx.request.body
    const result = await addTask(database, params)
    response.body = { data: result }
    await next()
})

router.post('/update', koaBody(), async (ctx, next) => {
  const { database, response } = ctx
  const { updateTask } = require("./model/todolist")
  const params = ctx.request.body
  const result = await updateTask(database, params)
  response.body = { data: result }
  await next()
})

app.use(logger())

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000, () => {

})