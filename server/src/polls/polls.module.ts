import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { jwtModule, redisModule } from 'src/modules.config';
import { PollsController } from './polls.controller';
import { PollRepository } from './polls.repository';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule, redisModule, jwtModule],
  controllers: [PollsController],
  providers: [PollsService, PollRepository],
})
export class PollsModule {}
