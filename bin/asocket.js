// ws
const ws = new require('ws');
const wss = new ws.Server({noServer: true});
const clients = new Set();

// https://www.tabnine.com/code/javascript/functions/ws/Server/handleUpgrade
// https://learn.javascript.ru/websocket
const WEBSOCKET_DEVICE_PATH = "/ws";

// Listen for devices connecting over WebSockets.
function asocket(req, ws, head) {
  const url = require("url");	
  const pathname = url.parse(req.url).pathname
  // Only listen to device connections.
  if (pathname !== WEBSOCKET_DEVICE_PATH) {
    return;
  }
  wss.handleUpgrade(req, ws, head, onSocketConnect, req.headers);//handleDeviceConnection(new DeviceWebSocketWrapper(socket), request.headers));
};


function onSocketConnect(socket){

  clients.add(socket);

  socket.on('message', function(message) {
    let text = message.toString();
    text = text.slice(0, 50); // максимальный размер сообщения 50
    console.log(text);
    for(let client of clients) {
      client.send(text);
    } 
  });

  socket.on('close', function() {
    clients.delete(socket);
  });

  socket.on('error', function(e) {
    // clients.delete(socket);
    console.log(e)
  });  
}

module.exports = asocket;