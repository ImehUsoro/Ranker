import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './dtos';
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private pollsService: PollsService) {}

  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    Logger.log('Creating a poll...');

    return this.pollsService.createPoll(createPollDto);
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    Logger.log('Joining a poll...');

    return this.pollsService.joinPoll(joinPollDto);
  }

  @Post('/rejoin')
  async rejoin() {
    Logger.log('Rejoining a poll...');

    return this.pollsService.rejoin({
      pollID: 'From Token',
      name: 'Also from Token',
      userID: 'Guess where this comes from?',
    });
  }
}
