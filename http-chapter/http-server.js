const http = require('node:http')
// const url = require('node:url')

const responseData = {
    id: 'zhangsan',
    name: '张三',
    register_time: '2023-10-11'
}

const toHTML = (data) => {
    return `
    <ul>
      <li><span>账号：</span><span>${data.id}</span></li>
      <li><span>昵称：</span><span>${data.name}</span></li>
      <li><span>注册时间：</span><span>${data.register_time}</span></li>
    </ul>
  `;
}

const server = http.createServer((req, res) => {
    const { pathname } = new URL(`http://${req.headers.host}${req.url}`)
    if(pathname === '/') {
        const accept = req.headers.accept
        if (req.method === 'POST' || accept.indexOf('application/json') > -1) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(responseData))
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(toHTML(responseData));
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h1>Not Found</h1>');
    }
})

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
})

server.listen(8080, () => {
    console.log('opened server on', server.address());
})