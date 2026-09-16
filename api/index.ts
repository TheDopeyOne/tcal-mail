import express from 'express';
import apiRouter from '../server/api.js';

const app = express();

// If Vercel rewrites strip the /api prefix, it matches /
app.use('/', apiRouter);
// If Vercel rewrites keep the /api prefix, it matches /api
app.use('/api', apiRouter);

export default app;
