import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import routes from './routes';
import { apiErrorHandler } from './common/errors/error-handler';
import { requestIdMiddleware } from './common/middlewares/request-id.middleware';
import { env } from './config/env';

const app = express();

app.use(requestIdMiddleware);
app.use(helmet());

const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));


app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "platform-api",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api', routes);

// Error Handler
app.use(apiErrorHandler);

export default app;
