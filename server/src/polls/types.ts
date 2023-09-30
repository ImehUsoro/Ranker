import { Nomination } from 'shared';
import { Socket } from 'socket.io';

// Service Types
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = {
  pollID: string;
  name: string;
  userID: string;
};

export type AddParticipantFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type RemoveParticipantFields = {
  pollID: string;
  userID: string;
};

export type AddNominationFields = {
  pollID: string;
  userID: string;
  text: string;
};

export type SubmitRankingsFields = {
  pollID: string;
  userID: string;
  rankings: string[];
};

// Repository Types
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
};

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddNominationsData = {
  pollID: string;
  nominationID: string;
  nomination: Nomination;
};

export type AddParticipantRankingsData = {
  pollID: string;
  userID: string;
  rankings: string[];
};

export type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};

export type AuthRequest = Request & AuthPayload;

export type SocketWithAuth = Socket & AuthPayload;
