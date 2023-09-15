import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { AuthRequest } from './types';

@Injectable()
export class PollsAuthGuard implements CanActivate {
  private readonly logger = new Logger(PollsAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: AuthRequest = context.switchToHttp().getRequest();

    this.logger.debug(`Checking if request is authorized`);

    const bearerToken = request.headers['authorization'];

    if (!bearerToken) {
      this.logger.debug(`Request has no token`);
      throw new UnauthorizedException(`Request has no token`);
    }

    const token = bearerToken.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token);

      this.logger.debug(`Request is authorized`);

      request.pollID = payload.pollID;
      request.name = payload.name;
      request.userID = payload.sub;

      return true;
    } catch (error) {
      this.logger.debug(`Request is not authorized`);
      throw new ForbiddenException(`Request is not authorized`);
    }
  }
}
