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

const cors = require('cors');
const bodyParser = require('body-parser');

// const Docker = require('dockerode');
// const docker = new Docker();

app.use(bodyParser.json());
app.use(cors());

const port = 4444; 

io.on('connection', (socket) => {
    socket.on('message', (message) => {
        console.log('received message: ' + message)
        socket.emit('terminal_response', 'received message:' + message);
    });
  
    console.log(`Socket ${socket.id} has connected ${Date()}`);
  });
  
  http.listen(port, () => {
    console.log('Listening on port 4444');
  });
  