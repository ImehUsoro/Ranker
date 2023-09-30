import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Poll, Results } from 'shared';
import { IORedisKey } from 'src/redis/redis.module';
import {
  AddNominationsData,
  AddParticipantData,
  AddParticipantRankingsData,
  CreatePollData,
  RemoveParticipantFields,
} from './types';

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
      nominations: {},
      rankings: {},
      adminID: userID,
      hasStarted: false,
      results: [],
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

      if (!poll) {
        this.logger.log(`Poll ${pollID} does not exist`);
        return null;
      }

      this.logger.verbose(
        `Got poll ${pollID}: ${JSON.stringify(JSON.parse(poll), null, 2)}}`,
      );

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

      const poll = await this.getPoll(pollID);

      if (!poll) {
        this.logger.log(`Poll ${pollID} does not exist`);
        return null;
      }

      this.logger.debug(
        `Added participant ${userID} to poll ${pollID}`,
        `Current participants: ${JSON.stringify(
          { participants: poll.participants },
          null,
          2,
        )}`,
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

  async removeParticipant(participantData: RemoveParticipantFields) {
    const { userID, pollID } = participantData;
    this.logger.log(
      `'Removing a participant with ID: ${userID} from poll with ID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, participantPath);
      //if you wanted to do something like count in an ARRAY of participants
      // ('JSON.STRLEN', key, '.participants'),

      return this.getPoll(pollID);
    } catch (error) {
      this.logger.error(
        `Error removing participant ${userID} from poll ${pollID}`,
        error,
      );
      throw new InternalServerErrorException();
    }
  }

  async addNomination({
    pollID,
    nominationID,
    nomination,
  }: AddNominationsData): Promise<Poll> {
    this.logger.log(
      `Adding nomination ${nominationID}/${nomination.text} to poll ${pollID}`,
    );
    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return this.getPoll(pollID);
    } catch (error) {
      this.logger.error(
        `Error adding nomination ${nominationID}/${nomination.text} to poll ${pollID}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to add nomination with nominationID/text: ${nominationID}/${nomination.text} to poll: ${pollID}`,
      );
    }
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    this.logger.log(`Removing nomination ${nominationID} from poll ${pollID}`);
    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, nominationPath);

      return this.getPoll(pollID);
    } catch (error) {
      this.logger.error(
        `Error removing nomination ${nominationID} from poll ${pollID}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to remove nomination with nominationID: ${nominationID} from poll: ${pollID}`,
      );
    }
  }

  async startPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Starting poll ${pollID}`);
    const key = `polls:${pollID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        '.hasStarted',
        JSON.stringify(true),
      );

      return this.getPoll(pollID);
    } catch (error) {
      this.logger.error(`Error starting poll ${pollID}`, error);
      throw new InternalServerErrorException();
    }
  }

  async addParticipantRankings({
    pollID,
    rankings,
    userID,
  }: AddParticipantRankingsData): Promise<Poll> {
    this.logger.log(
      `Attempting to add rankings for userID/name ${userID} to poll ${pollID}`,
      rankings,
    );

    const key = `polls:${pollID}`;
    const rankingsPath = `.rankings.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        rankingsPath,
        JSON.stringify(rankings),
      );

      return this.getPoll(pollID);
    } catch (error) {
      this.logger.error(
        `Error adding rankings for user with ID: ${userID} to poll ${pollID}`,
        rankings,
      );
      throw new InternalServerErrorException(
        `Failed to add rankings for user with ID: ${userID} to poll: ${pollID}`,
      );
    }
  }

  async addResults(pollID: string, results: Results): Promise<Poll> {
    this.logger.log(
      `Adding results to poll ${pollID}`,
      JSON.stringify(results),
    );

    const key = `polls:${pollID}`;
    const resultsPath = '.results';

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        resultsPath,
        JSON.stringify(results),
      );

      return this.getPoll(pollID);
    } catch (error) {
      this.logger.error(`Error adding results to poll ${pollID}`, error);
      throw new InternalServerErrorException(
        `Failed to add results to poll ${pollID}`,
      );
    }
  }

  async deletePoll(pollID: string): Promise<void> {
    this.logger.log(`Deleting poll ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      await this.redisClient.send_command('DEL', key);
    } catch (error) {
      this.logger.error(`Error deleting poll ${pollID}`, error);
      throw new InternalServerErrorException(
        `Failed to delete poll: ${pollID}`,
      );
    }
  }
}
