import { Logger } from '@nestjs/common';
import {
  // SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { PollsService } from './polls.service';

@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  @WebSocketServer() io: Namespace;

  afterInit(): void {
    this.logger.log('Websocket Gateway Initialized!');
  }

  handleConnection(client: Socket) {
    const sockets = this.io.sockets;
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Total clients: ${sockets.size}`);

    this.io.emit('hello', `from ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const sockets = this.io.sockets;
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.log(`Total clients: ${sockets.size}`);

    // TODO remove client from poll
  }
}
