import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { SocketWithAuth } from './polls/types';

export class SocketIOAdapter extends IoAdapter {
  private logger = new Logger(SocketIOAdapter.name);
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }
  createIOServer(port: number, options?: ServerOptions) {
    const clientPort = parseInt(this.configService.get('CLIENT_PORT'));

    const cors = {
      origin: [
        `http://localhost:${clientPort}`,
        new RegExp(`/^http://192.168.1.([1-9]|[1-9]d):${clientPort}$/`),
      ],
    };

    this.logger.log(`Enabling CORS for ${JSON.stringify(cors, null, 2)}`);

    const optionsWithCORS: ServerOptions = {
      ...options,
      cors,
    };

    const jwtService = this.app.get(JwtService);

    const server: Server = super.createIOServer(port, optionsWithCORS);

    server.of('polls').use(createTokenMiddleware(jwtService, this.logger));

    return server;
  }
}

const createTokenMiddleware =
  (jwtService: JwtService, logger: Logger) =>
  (socket: SocketWithAuth, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      // this.logger.debug(`Request has no token`);
      throw new Error(`Unauthorized: Request has no token`);
    }
    try {
      const payload = jwtService.verify(token);

      logger.debug(`Request is authorized (WS)`);

      socket.pollID = payload.pollID;
      socket.name = payload.name;
      socket.userID = payload.sub;

      next();
    } catch (error) {
      next(new Error('FORBIDDEN'));
    }
  };
