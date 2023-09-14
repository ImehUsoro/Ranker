import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  // SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { PollsService } from './polls.service';

@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway implements OnGatewayInit {
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  afterInit(): void {
    this.logger.log('Websocket Gateway Initialized!');
  }
}