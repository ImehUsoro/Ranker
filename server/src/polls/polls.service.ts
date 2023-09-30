import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createNominationID, createPollID, createUserID } from 'src/id';
import { PollRepository } from './polls.repository';
import {
  AddNominationFields,
  AddParticipantFields,
  CreatePollFields,
  JoinPollFields,
  RejoinPollFields,
  RemoveParticipantFields,
  SubmitRankingsFields,
} from './types';
import { Poll } from 'shared';
import getResults from './getResults';

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

  async getPoll(pollID: string) {
    const poll = await this.pollsRepository.getPoll(pollID);

    if (!poll) {
      throw new NotFoundException(`Poll with ID: ${pollID} does not exist`);
    }

    return poll;
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

    // don't add players from here, add it from socket connection
    // const updatedPoll = await this.pollsRepository.addParticipant({
    //   pollID: joinedPoll.id,
    //   userID,
    //   name: fields.name,
    // });

    // console.log('fields name ====>', fields.name);

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
      joinedPoll,
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

  async addParticipant(
    participantData: AddParticipantFields,
  ): Promise<Poll | null> {
    return this.pollsRepository.addParticipant(participantData);
  }

  async removeParticipant(
    participantData: RemoveParticipantFields,
  ): Promise<Poll | void> {
    const poll = await this.pollsRepository.getPoll(participantData.pollID);

    if (!poll.hasStarted) {
      const updatedPoll = await this.pollsRepository.removeParticipant(
        participantData,
      );

      return updatedPoll;
    }
  }

  async addNomination({
    pollID,
    userID,
    text,
  }: AddNominationFields): Promise<Poll> {
    return this.pollsRepository.addNomination({
      pollID,
      nominationID: createNominationID(),
      nomination: {
        text,
        userID,
      },
    });
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    return this.pollsRepository.removeNomination(pollID, nominationID);
  }

  async startPoll(pollID: string): Promise<Poll> {
    return this.pollsRepository.startPoll(pollID);
  }

  async submitRankings(rankingsData: SubmitRankingsFields) {
    const hasPollStarted = await this.pollsRepository.getPoll(
      rankingsData.pollID,
    );

    if (!hasPollStarted.hasStarted) {
      throw new BadRequestException('Poll has not started');
    }
    return this.pollsRepository.addParticipantRankings(rankingsData);
  }

  async computeResults(pollID: string) {
    const poll = await this.pollsRepository.getPoll(pollID);

    if (!poll.hasStarted) {
      throw new BadRequestException('Poll has not started');
    }

    const results = getResults(
      poll.rankings,
      poll.nominations,
      poll.votesPerVoter,
    );

    return this.pollsRepository.addResults(pollID, results);
  }

  async cancelPoll(pollID: string) {
    return this.pollsRepository.deletePoll(pollID);
  }
}
