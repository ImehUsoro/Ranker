import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PollsService } from './polls.service';
import { WsUnauthorizedException } from 'src/exceptions/ws-exceptions';
import { AuthPayload, SocketWithAuth } from './types';
import { log } from 'console';

@Injectable()
export class GatewayAdminGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAdminGuard.name);
  constructor(
    private readonly pollsService: PollsService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: SocketWithAuth = context.switchToWs().getClient();

    const bearerToken =
      client.handshake.auth.token || client.handshake.headers['token'];

    log(`bearerToken: ${bearerToken}`);
    if (!bearerToken) {
      this.logger.debug(`No Authorization Token Provided`);
      throw new WsUnauthorizedException(`Request has no token`);
    }

    try {
      const payload = this.jwtService.verify<AuthPayload & { sub: string }>(
        bearerToken,
      );

      this.logger.debug(`Validating admin using token payload: ${payload}`);

      const { sub, pollID } = payload;

      const poll = await this.pollsService.getPoll(pollID);

      if (poll.adminID !== sub) {
        this.logger.debug(`User is not admin`);
        throw new WsUnauthorizedException(`User is not admin`);
      }
      return true;
    } catch (error) {}
  }
}
