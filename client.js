

const ioClient = require("socket.io-client");

const port = 7777; // 7777 is the proxy 4444 is the server

const socket = ioClient(
    `http://localhost:${port}`, {
    autoConnect: true,
    //extraHeaders: { bearer: accessToken },
    //transports: ["websocket"],
    query: {
        test: "testing 123"
    }
});

socket.on('terminal_response', (msg) => {
    console.log('received response:' + msg)
});

socket.on("disconnect", (reason) => {
    console.log("socket disconnect=" + reason)
});


socket.on('connect_error',(error)=> {
    console.log("connection error="+JSON.stringify(error))
})

socket.emit('client_message', "Hello from the client");

setInterval(()=>{
    socket.emit('client_message', "Time:" + Date());
},1000)