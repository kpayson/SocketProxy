## Steps
- Start the server (either stand alone or in docker container)
- Start the proxy
- Start the client (the client will emit the time every second)
## start server
`node ./server.js`
## start server in container
`docker build -t 'socket-server-example' .`
`docker run -p 4444:4444 socket-server-example`

## start proxy
`node ./proxy.js` or use vscode to debug current file

## start client
`node ./client.js`


