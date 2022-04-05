const http = require('http')
const { URL } = require('url')
const { createReadStream } = require('fs')

const port = 3000
const host = '127.0.0.1'
const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']

const parseJsonBody = (request) => new Promise((resolve, reject) => {
    let rawJson = ''
    request
        .on('data', (chunk) => {
            rawJson += chunk
        })
        .on('end', () => {
            try {
                if (rawJson) {
                    const requestBody = JSON.parse(rawJson)
                    resolve(requestBody)
                } else {
                    resolve(null)
                }
            } catch (err) {
                reject(err)
            }
        })
        .on('error', reject)
})

const parseQueryParams = (server, request) => {
    const { address, port } = server.address()
    const parseUrl = new URL(request.url, `http://${address}:${port}`)
    const queryParams = {}
    for (const [key, value] of parseUrl.searchParams.entries()) {
        queryParams[key] = value
    }
    return {queryParams, pathname: parseUrl.pathname}
}

const server = http.createServer(async (request, response) => {
    try {
        // Read json from http body.
        const result = await parseJsonBody(request)
        console.log(result)

        // Set header
        response.setHeader('X-Teach-Me-Skills', 'pro')
        response.setHeader('X-Hello-From', 'TMS')
        response.setHeader('Access-Control-Allow-Origin', 'valera.ru')

        // Read headers from client
        const { authorization } = request.headers
        console.log('authorization header:', authorization)

        // Read client header
        // Write status code
        if (!allowedMethods.includes(request.method)) {
            response.writeHead(400)
            response.setHeader('Allow', allowedMethods.join(','))
            response.end()
            return
        }

        // Parse query string
        // https://example.org/foo?name=value
        // -> ?name=value
        // new URL('?name=value', 'https://example.org/')
        const {queryParams, pathname} = parseQueryParams(server, request)
        // console.log('parsedUrl', parsedUrl)

        response.setHeader('Content-Type', 'text/html; charset=UTF-8')
        if (pathname === '/users') {
            response.end('<h1>Страница пользователя Евгения<h1/>')
        } else if (pathname === '/cars') {
            createReadStream('index.html')
                .on('data', (chunk) => response.write(chunk))
                .on('end', () => response.end())
        } else {
            response.end('<h1>Страница не существует<h1/>')
        }
    } catch (err) {
        console.error(err)
        response.writeHead(500)
        response.end('Internal server error')
        return
    }
})

server.on('error', (err) => {
    console.error(err)
})

server.listen(port, host, () => {
    const { address, port, family } = server.address()
    console.log(`Server is running on http://${address}:${port} Family: ${family}`)
})