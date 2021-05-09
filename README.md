## start server
`node ./server.js`

## start server in container
`docker build -t 'socket-server-example' .`
`docker run -p 4444:4444 socket-server-example`

## start client
`node ./client.js`

## start proxy
`node ./proxy.js` or use vscode to debug current file

