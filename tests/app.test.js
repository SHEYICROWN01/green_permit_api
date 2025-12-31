const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
    it('should return 200 OK', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
    });
});

describe('API Base Route', () => {
    it('should return welcome message', async () => {
        const response = await request(app).get('/api/v1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
    });
});

describe('404 Not Found', () => {
    it('should return 404 for undefined routes', async () => {
        const response = await request(app).get('/api/v1/nonexistent');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
    });
});
