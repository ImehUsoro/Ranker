import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createPollID, createUserID } from 'src/id';
import { PollRepository } from './polls.repository';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);
  constructor(
    private readonly pollsRepository: PollRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.pollsRepository.createPoll({
      pollID,
      userID,
      ...fields,
    });

    this.logger.debug(
      `Creating a Token for pollId: ${createdPoll.id} user with ID: ${userID}`,
    );

    const accessToken = this.jwtService.sign(
      {
        pollID: createdPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );

    return {
      ...createdPoll,
      accessToken,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${fields.pollID} for user with ID: ${userID}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(fields.pollID);

    if (!joinedPoll) {
      this.logger.debug(`Poll with ID: ${fields.pollID} does not exist`);
      throw new NotFoundException(
        `Poll with ID: ${fields.pollID} does not exist`,
      );
    }

    this.logger.debug(
      `Creating a Token for pollId: ${joinedPoll.id} user with ID: ${userID}`,
    );

    const accessToken = this.jwtService.sign(
      {
        pollID: joinedPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );

    return {
      ...joinedPoll,
      accessToken,
    };
  }

  async rejoin(fields: RejoinPollFields) {
    this.logger.debug(
      `Rejoining poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`,
    );

    const joinedPoll = await this.pollsRepository.addParticipant(fields);

    return joinedPoll;
  }
}
