import React, { useEffect } from 'react';
import { actions, state } from '../state';
import { useSnapshot } from 'valtio';

const WaitingRoom = () => {
  useEffect(() => {
    console.log('waiting room');
    actions.initializeSocket();
  }, []);
  return (
    <div className="flex flex-col w-full justify-between items-center h-full">
      Waiting Room
    </div>
  );
};

export default WaitingRoom;
