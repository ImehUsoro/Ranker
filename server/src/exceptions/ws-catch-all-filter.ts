import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SocketWithAuth } from 'src/polls/types';
import {
  WsBadRequestException,
  WsForbiddenException,
  WsInternalServerErrorException,
  WsNotFoundException,
  WsTypeException,
  WsUnauthorizedException,
  WsUnknownException,
} from './ws-exceptions';

@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
  catch(exception: Error, host: import('@nestjs/common').ArgumentsHost) {
    const socket: SocketWithAuth = host.switchToWs().getClient();

    if (exception instanceof BadRequestException) {
      const exceptionData = exception.getResponse();
      const message = exceptionData['message'];
      const WsException = new WsBadRequestException(
        message ?? exceptionData ?? exception.name,
      );

      socket.emit('exception', WsException.getError());
      return;
    }

    if (exception instanceof UnauthorizedException) {
      const exceptionData = exception.getResponse();
      const message = exceptionData['message'];
      const WsException = new WsUnauthorizedException(
        message ?? exceptionData ?? exception.name,
      );

      socket.emit('exception', WsException.getError());
      return;
    }

    if (exception instanceof ForbiddenException) {
      const exceptionData = exception.getResponse();
      const message = exceptionData['message'];
      const WsException = new WsForbiddenException(
        message ?? exceptionData ?? exception.name,
      );

      socket.emit('exception', WsException.getError());
      return;
    }

    if (exception instanceof NotFoundException) {
      const exceptionData = exception.getResponse();
      const message = exceptionData['message'];
      const WsException = new WsNotFoundException(
        message ?? exceptionData ?? exception.name,
      );

      socket.emit('exception', WsException.getError());
      return;
    }

    if (exception instanceof InternalServerErrorException) {
      const exceptionData = exception.getResponse();
      const message = exceptionData['message'];
      const WsException = new WsInternalServerErrorException(
        message ?? 'Internal Server Error',
      );

      socket.emit('exception', WsException.getError());
      return;
    }

    if (exception instanceof WsTypeException) {
      socket.emit('exception', exception.getError());
      return;
    }

    const WsException = new WsUnknownException(exception.message);
    socket.emit('exception', WsException.getError());
    Logger.debug("we're in the WsTypeException block");
  }
}
