import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import routes from './routes';
import { apiErrorHandler } from './common/errors/error-handler';
import { env } from './config/env';

const app = express();


app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'production') {
  app.use(morgan("dev"));
}


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
