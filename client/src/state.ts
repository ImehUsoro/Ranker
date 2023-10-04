import { Poll } from 'shared/poll-types';
import { proxy, ref } from 'valtio';
import { derive, subscribeKey } from 'valtio/utils';
import { getTokenPayload } from './util';
import { Socket } from 'socket.io-client';
import { createSocketWithHandlers, socketIOUrl } from './socket-io';

export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
  WaitingRoom = 'waiting-room',
}

type Me = {
  id: string;
  name: string;
};

export type AppState = {
  currentPage: AppPage;
  me?: Me;
  isLoading: boolean;
  poll?: Poll;
  accessToken?: string;
  socket?: Socket;
};

const state: AppState = proxy({
  isLoading: false,
  currentPage: AppPage.Welcome,
});

const stateWithComputed = derive(
  {
    me: (get) => {
      const accessToken = get(state).accessToken;

      if (!accessToken) {
        return;
      }

      const token = getTokenPayload(accessToken);

      return {
        id: token.sub,
        name: token.name,
      };
    },

    isAdmin: (get) => {
      if (!get(state).me) {
        return false;
      }
      return get(state).poll?.adminID === get(state).me?.id;
    },
  },
  {
    proxy: state,
  }
);

const actions = {
  setPage: (page: AppPage) => {
    state.currentPage = page;
  },

  startOver: () => {
    state.currentPage = AppPage.Welcome;
  },

  startLoading: () => {
    state.isLoading = true;
  },

  stopLoading: () => {
    state.isLoading = false;
  },

  initializePoll: (poll?: Poll) => {
    state.poll = poll;
  },

  setPollAccessToken: (accessToken: string) => {
    state.accessToken = accessToken;
  },

  initializeSocket: (): void => {
    if (!state.socket) {
      state.socket = ref(
        createSocketWithHandlers({
          socketIOUrl,
          state,
          actions,
        })
      );
    } else {
      state.socket.connect();
    }
  },

  updatePoll: (poll: Poll) => {
    state.poll = poll;
  },
};

subscribeKey(state, 'accessToken', () => {
  if (state.accessToken && state.poll) {
    localStorage.setItem('accessToken', state.accessToken);
  } else {
    localStorage.removeItem('accessToken');
  }
});

export type AppActions = typeof actions;

export { stateWithComputed as state, actions };
