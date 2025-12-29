import request from 'supertest';
import app from '../src/app.js';

describe('App', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('should return message for root', async () => {
    const res = await request(app).get('/api/');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Backend');
  });
});