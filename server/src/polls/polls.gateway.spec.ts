import { Test, TestingModule } from '@nestjs/testing';
import { PollsGateway } from './polls.gateway';

describe('PollsGateway', () => {
  let gateway: PollsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PollsGateway],
    }).compile();

    gateway = module.get<PollsGateway>(PollsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
