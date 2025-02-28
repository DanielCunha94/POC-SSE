import passport from "passport";
import { SSEService } from "./sse";
import { Express } from "express";
import jwt from 'jsonwebtoken';
import { users } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

class Router {
  private app: Express;
  private sseService: SSEService;
  constructor(app: Express, sseServer: SSEService) {
    this.app = app;
    this.sseService = sseServer
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.setupAuthRoutes();
    this.setupSSERoutes();
    this.setupNotificationRoutes();
  }

  private setupAuthRoutes(): void {
    this.app.post('/login', (req, res) => {
      const { email, password } = req.body;

      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const payload = { id: user.id, email: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    });;
  }

  private setupSSERoutes(): void {
    this.app.get(
      '/sse',
      passport.authenticate('jwt', { session: false }),
      async (req, res) => { await this.sseService.connect(req, res) })
  }

  private setupNotificationRoutes(): void {
    this.app.post(
      '/rent',
      passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
          await this.sseService.publish( "newRent",{ message: `rent created at ${new Date().toISOString()}` },)
          res.json({ success: true });
        } catch (e) {
          console.log(e)
        }
      })


    this.app.post(
      '/bloq',
      passport.authenticate('jwt', { session: false }),
      passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
          await this.sseService.publish( "newBloq",{ message: `Bloq created at ${new Date().toISOString()}` },)
          res.json({ success: true });
        } catch (e) {
          console.log(e)
        }
      }
    );
  }
}

export function newRouter(app: Express, sseServer: SSEService) {
  return new Router(app, sseServer)
}

