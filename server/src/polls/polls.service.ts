import { Injectable } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';
import { createPollID, createUserID } from 'src/id';

@Injectable()
export class PollsService {
  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();
    return {
      pollID,
      userID,
      ...fields,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    return { ...fields, userID };
  }

  async rejoin(fields: RejoinPollFields) {
    return fields;
  }
}
