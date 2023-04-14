class Rl {
  constructor(){
    this.socket = new WebSocket("ws://localhost:8090/ws");
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onmessage = this.onmessage.bind(this); 
    this.socket.onclose = this.onclose.bind(this);
    this.socket.onerror = this.onerror.bind(this);
  }

  onopen(e){
    window.tid && clearInterval(window.tid);
    console.log("[open] socked is connected");
    this.socket.send("ping");    
  }
  onmessage(e){
    console.log(`[message] data is recived: ${e.data}`);
  }
  onclose(e){
    if (e.wasClean) {
      console.log(`[close] connection is correct closed, cod=${e.code} reason=${e.reason}`);
    } else {
      // например, сервер убил процесс или сеть недоступна
      // обычно в этом случае event.code 1006
      console.log('[close] connection is broken');
      window.tid = setInterval(() => {
        location.reload(true);
      }, 3000);
      
    }
  }
  onerror(e){
    console.log(`[error] ${e.message}`);
  }

}

window.rl = new Rl();