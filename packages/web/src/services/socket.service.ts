import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

class SocketService {
    private readonly socket: Socket;
    private readonly url: string;

    constructor() {
        console.log(environment.base_url);
      this.url = environment.base_url + '/socket.io';
      this.socket = io(this.url);

      console.log(this.socket);
      this.socket.on('connect', () => {
            console.log('Connected');
        });
    }

    getSocket() {
        return this.socket;
    }
}

export default new SocketService();
