const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const { fileURLToPath  } = require('node:url')
const mime = require('mime')

const server = http.createServer((req, res) => {
    let filepath = path.resolve(__dirname, path.join('www', fileURLToPath(`file:///${req.url}`)))
    if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath)
        const isDir = stats.isDirectory()
        if (isDir) {
            filepath = path.join(filepath, 'index.html')
        }
        if (fs.existsSync(filepath)) {
            // const content = fs.readFileSync(filepath)
            const ext = path.extname(filepath)
            res.writeHead(200, { 'Content-Type': mime.getType(ext) })
            const readStream = fs.createReadStream(filepath)
            readStream.pipe(res)
            return
        }
    }
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>NOT FOUND</h1>')
})

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
})

server.listen(8080, () => {
    console.log('opened server on', server.address());
})