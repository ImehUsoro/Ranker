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

type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};

export type AuthRequest = Request & AuthPayload;

export type SocketWithAuth = Socket & AuthPayload;
