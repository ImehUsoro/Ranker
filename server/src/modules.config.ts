import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from './redis/redis.module';

export const redisModule = RedisModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger('Redis Module (modules.config.ts)');

    const redisHost = configService.get('REDIS_HOST');
    const redisPort = parseInt(configService.get('REDIS_PORT'));

    logger.log(`Connecting to Redis at ${redisHost}:${redisPort}`);

    return {
      connectionOptions: {
        host: redisHost,
        port: redisPort,
      },

      onClientReady: (client) => {
        logger.log('Redis Client Ready');

        client.on('error', (error) => {
          logger.error('Redis Client Error', error);
        });

        client.on('connect', () => {
          logger.log(
            `Connected to Redis on ${client.options.host}:${client.options.port}`,
          );
        });

        client.on('close', () => {
          logger.log('Disconnected from Redis');
        });
      },
    };
  },
  inject: [ConfigService],
});

export const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: parseInt(configService.get<string>('POLL_DURATION')),
    },
  }),
  inject: [ConfigService],
});
