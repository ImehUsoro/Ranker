import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { WsCatchAllFilter } from 'src/exceptions/ws-catch-all-filter';
import { PollsService } from './polls.service';
import { SocketWithAuth } from './types';
import { GatewayAdminGuard } from './gateway-admin.guard';
import { NominationDto } from './dtos';

@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
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

  async handleConnection(client: SocketWithAuth): Promise<void> {
    const sockets = this.io.sockets;

    this.logger.debug(
      `Socket connected with userID: ${client.userID}, pollID: ${client.pollID} and name: ${client.name}`,
    );

    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Total clients: ${sockets.size}`);

    const roomName = client.pollID;
    await client.join(roomName);

    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `UserID: ${client.userID} joined room: ${roomName} with ${connectedClients} other clients`,
    );

    const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    this.io.to(roomName).emit('poll_updated', updatedPoll);
  }

  async handleDisconnect(client: SocketWithAuth): Promise<void> {
    const sockets = this.io.sockets;
    const { pollID, userID } = client;

    const updatedPoll = await this.pollsService.removeParticipant({
      pollID,
      userID,
    });

    const roomName = client.pollID;
    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `UserID: ${client.userID} left room: ${roomName} with ${connectedClients} other clients`,
    );

    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    if (updatedPoll) {
      this.io.to(roomName).emit('poll_updated', updatedPoll);
    }
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async removeParticipant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Removing participant with ID: ${id} from poll with ID: ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant({
      pollID: client.pollID,
      userID: id,
    });

    if (updatedPoll) {
      this.io.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('nominate')
  async nominate(
    @MessageBody() nomination: NominationDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Adding nomination with text: ${nomination.text} for user ${client.userID} to poll with ID: ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.addNomination({
      pollID: client.pollID,
      userID: client.userID,
      text: nomination.text,
    });

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_nomination')
  async removeNomination(
    @MessageBody('id') nominationID: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Removing nomination with ID: ${nominationID} from poll with ID: ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeNomination(
      client.pollID,
      nominationID,
    );

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('start_poll')
  async startPoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Starting poll with ID: ${client.pollID}`);

    const updatedPoll = await this.pollsService.startPoll(client.pollID);

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @SubscribeMessage('submit_rankings')
  async submitRankings(
    @MessageBody('rankings') rankings: string[],
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Submitting rankings for user with ID: ${client.userID} for poll with ID: ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.submitRankings({
      pollID: client.pollID,
      userID: client.userID,
      rankings,
    });

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('close_poll')
  async closePoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(
      `Closing poll with ID: ${client.pollID} and computing results`,
    );

    const updatedPoll = await this.pollsService.computeResults(client.pollID);

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('cancel_poll')
  async cancelPoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Canceling poll with ID: ${client.pollID}`);

    await this.pollsService.cancelPoll(client.pollID);

    this.io.to(client.pollID).emit('poll_cancelled');
  }
}
