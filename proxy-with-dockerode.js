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
const Portastic = require('portastic');
const Docker = require('dockerode');
const docker = new Docker();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());

const assignedPorts = new Set();

async function getAvailablePort() {
  const ports = await Portastic.find({
    min: 8000,
    max: 10000,
    //retrieve: 1
  });

  for (let p of ports) {
    if (!assignedPorts.has(p)) {
      assignedPorts.add(p);
      return String(p);
    }
  }
  throw 'error: unable to find an available port';
}


async function findContainerByTerminalKey(terminalKey) {
  const containers = await docker.listContainers({
    all: true,
    filters: {
      label: [`terminalKey=${terminalKey}`]
    }
  });
  return containers.some(Boolean) ? containers[0] : null;
}

/**
 * Creates the container.
 * @param  {String} image The image to be used.
 * @param  {String} networkName the docker network to be used.
 * @param  {number} port the exposed port of the container.
 * @return {Promise} A primise to retreive a container.
 */
async function getContainer(image, networkName, terminalKey) {
  const createContainer = async (resolve, reject) => {
    const port = await getAvailablePort();
    const created = await docker.createContainer({
      Image: image,
      Tty: false,
      HostConfig: {
        //NetworkMode: networkName,
        // ExposedPorts: {"4444/tcp": {}},  //expose ports here if not expose in dockerfile
        PortBindings: {
          '4444/tcp': [
            {
              HostPort: port,
              HostIp: '0.0.0.0'
            }
          ]
        }
      },
      Labels: { terminalKey }
    });
    const started = await created.start();
    resolve(port);
  };

  return new Promise(async function (resolve, reject) {
    try {
      const container = await findContainerByTerminalKey(terminalKey)

      if (!container) {
        createContainer(resolve, reject);
      }
      else {
        if (container.State === 'running') {
          const port = container.Ports[0].PublicPort;
          resolve(port);
        }
        else if (container.State === "exited") {
          const startingContainer = await docker.getContainer(container.Id);
          await startingContainer.start();
          const info = await startingContainer.inspect();
          const port = info.NetworkSettings.Ports["4444/tcp"][0].HostPort
          resolve(port);
        }
        else {
          reject('unhandled container state');
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
}

const proxyPort = 7777;




io.on('connection', async (clientSocket) => {
  const socketQry = clientSocket.handshake.query;
  //const accessToken = clientSocket.handshake.headers.bearer;
  const test = socketQry.test

  const port = '4444'; //await getContainer('labshare/auth-cli-terminal', 'bridge', terminalKey);

  const containerBaseUrl = "http://localhost"   // "http://172.17.0.2"; // ?? TODO

  const containerUrl = `${containerBaseUrl}:${port}`

  const terminalSocket = ioClient(
    `${containerUrl}`, {
    autoConnect: true,
    //extraHeaders: { bearer: accessToken },
    //transports: ["websocket"],
    query: {
        test
    }
  });

  termin

  // clientSocket is for communication between browser and proxy
  clientSocket.on('client_message', (msg) => {
    // pass allong the message from the browser
    terminalSocket.emit('client_message', msg); 
  });

  // terminalSocket is for communication between the proxy and the terminal server
  terminalSocket.on('terminal_response',(msg) => {
    //pass the message from the terminal server back to the browser client
    clientSocket.emit('terminal_response',msg); 
  });

  terminalSocket.on("disconnect", (reason) => {
    console.log("terminalSocket disconnect="+ reason)
    // if (reason === "io server disconnect") {
    //   // the disconnection was initiated by the server, you need to reconnect manually
    //   socket.connect();
    // }
    // else the socket will automatically try to reconnect
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

