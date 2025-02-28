import express from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
import cors from 'cors';
import { newRouter } from './router';
import { newSSEService } from './sse';
import { newPublisher, newSubscriber } from './pubSub';
import { users } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
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

const sseService= newSSEService(newSubscriber(), newPublisher())
newRouter(app, sseService)


app.listen(3001, () => {
  console.log(`Server running on port ${3001}`);
});
