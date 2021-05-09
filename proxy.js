const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    // methods: ["GET", "POST"],
    // allowedHeaders: ["*"],
    // credentials: true
  }
});
const ioClient = require("socket.io-client");

const cors = require('cors');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());


const proxyPort = 7777;

io.on('connection', async (clientSocket) => {
  const socketQry = clientSocket.handshake.query;
  //const accessToken = clientSocket.handshake.headers.bearer;
  //const test = socketQry.test

  const port = '4444';
  const containerBaseUrl = "http://localhost";   // "http://172.17.0.2"; // ?? TODO

  const containerUrl = `${containerBaseUrl}:${port}`

  //const terminalSocket = ioClient();
  
  const terminalSocket = ioClient(
    `${containerUrl}`, {
    autoConnect: true,
    //extraHeaders: { bearer: accessToken },
    //transports: ["websocket"],
    // query: {
    //     test
    // }
  });


  // clientSocket is for communication between browser and proxy
  clientSocket.on('client_message', (msg) => {
    // pass allong the message from the browser
    terminalSocket.emit('client_message', msg); 
  });

  // terminalSocket is for communication between the proxy and the terminal server (running inside container)
  terminalSocket.on('terminal_response',(msg) => {
    //pass the message from the terminal server back to the browser client
    clientSocket.emit('terminal_response',msg); 
  });

  terminalSocket.on("disconnect", (reason) => {
    console.log("terminalSocket disconnect="+ reason)
  });
  

  terminalSocket.on('connect_error',(error)=> {
    console.log("terminal connection error="+JSON.stringify(error))
  })

  console.log(`Socket ${clientSocket.id} has connected ${Date()}`);
});

io.on("connect_error", (error) => {
  console.log("error="+JSON.stringify(error))
});


http.listen(proxyPort, () => {
  console.log(`Listening on port ${proxyPort}`);
});

