const app = require('../src/app');
const request = require('supertest');

let server;

beforeAll(async () => {
  // Inicia o servidor na porta 9002
  server = app.listen(9002);
});

afterAll(async () => {
  // Encerra o servidor após os testes
  server.close();
});

test('deve retornar a mensagem de boas-vindas', async () => {
  const response = await request(app).get('/');

  expect(response.status).toBe(200); // Verifica o status da resposta
  expect(response.body).toEqual({
    message: 'Bem-vindo',
  }); // Verifica o corpo da resposta
});
