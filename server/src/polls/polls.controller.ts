import {
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './dtos';
import { PollsService } from './polls.service';
import { PollsAuthGuard } from './polls.guard';
import { AuthRequest } from './types';

@UsePipes(new ValidationPipe())
@Controller('polls')
export class PollsController {
  private readonly logger = new Logger(PollsController.name);
  constructor(private pollsService: PollsService) {}

  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    this.logger.log('Creating a poll...');

    return this.pollsService.createPoll(createPollDto);
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    this.logger.log('Joining a poll...');

    return this.pollsService.joinPoll(joinPollDto);
  }

  @UseGuards(PollsAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() request: AuthRequest) {
    const { pollID, name, userID } = request;

    this.logger.log('Rejoining a poll...');

    return this.pollsService.rejoin({
      pollID,
      name,
      userID,
    });
  }
}
