import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis/redis.module';
import { Poll } from 'shared';
import { AddParticipantData, CreatePollData } from './types';

@Injectable()
export class PollRepository {
  private readonly ttl: string;
  private readonly logger = new Logger(PollRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    this.ttl = configService.get('POLL_DURATION');
  }

  async createPoll({
    pollID,
    topic,
    votesPerVoter,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      adminID: userID,
    };

    this.logger.log(
      `Creating new poll ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls:${pollID}`;

    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();

      return initialPoll;
    } catch (error) {
      this.logger.error(`Error creating poll ${pollID}`, error);
      throw new InternalServerErrorException('Could not create poll');
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Getting poll ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      const poll = await this.redisClient.send_command('JSON.GET', key, '.');

      this.logger.verbose(`Got poll ${pollID}: ${poll}`);

      //   if (poll.hasStarted) {
      //     this.logger.log(`P?oll ${pollID} has started`);
      //     throw new BadRequestException('Poll has already started');
      //   }

      return JSON.parse(poll);
    } catch (error) {
      this.logger.error(`Error getting poll ${pollID}`, error);
      throw new InternalServerErrorException();
    }
  }

  async addParticipant({ pollID, userID, name }: AddParticipantData) {
    this.logger.log(`Adding participant ${userID} to poll ${pollID}`);

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      const pollJSON = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      const poll = JSON.parse(pollJSON);

      this.logger.debug(
        `Added participant ${userID} to poll ${pollID}`,
        `Current participants: ${poll.participants}}`,
      );

      return poll;
    } catch (error) {
      this.logger.error(
        `Error adding participant ${userID} to poll ${pollID}`,
        error,
      );
      throw new InternalServerErrorException();
    }
  }
}
