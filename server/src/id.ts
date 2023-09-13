import { customAlphabet, nanoid } from 'nanoid';

export const createPollID = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  6,
);

export const createUserID = () => nanoid();
export const createNominationID = () => nanoid(8);
