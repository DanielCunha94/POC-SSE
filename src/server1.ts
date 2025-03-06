import express from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
import cors from 'cors';
import { newRouter } from './router';
import { users } from './db';
import { createLogger, format, transports } from 'winston';
import { createSSEService, SSEConfig } from './sse';
import { RedisConfig } from './pubSub';

dotenv.config();

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
  ]
});

// Configuration
const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  tls: process.env.REDIS_TLS === 'true',
  connectTimeout: 10000,
  maxRetriesPerRequest: 3
};

const sseConfig: SSEConfig = {
  channel: process.env.SSE_CHANNEL || 'sse-events',
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '6000')
};

// Create SSE service
const sseService = createSSEService(sseConfig, redisConfig, logger);

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());


const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    const user = users.find(u => u.id === jwtPayload.id);
    return done(null, user ?? undefined);
  }
  ));


newRouter(app, sseService)


app.listen(3000, () => {
  console.log(`Server running on port ${3000}`);
});
