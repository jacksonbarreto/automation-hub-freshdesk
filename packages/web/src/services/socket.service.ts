import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

class SocketService {
    private socket: Socket;

    constructor() {
        console.log(environment.base_url);
        
        this.socket = io(environment.base_url);

        this.socket.on('connect', () => {
            console.log('Connected');
        });
    }

    getSocket() {
        return this.socket;
    }
}

export default new SocketService();
