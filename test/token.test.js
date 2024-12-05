const app = require('../src/app');
const request = require('supertest');
const usuarios = require('../src/models/tabelaUsuarios');
const bcrypt = require('bcrypt');

let server;
let token;

describe('Testes de Usuários', () => {

  jest.mock('../src/models/tabelaUsuarios');

  beforeAll(async () => {
    server = await app.listen(9003);

    const response = await request(app)
      .post('/v1/user/token')
      .send({
        email: process.env.EMAIL_USER,
        password: process.env.SENHA_USER
      });

    expect(response.status).toBe(200);
    token = response.body.detalhes;
    expect(token).toBeDefined();
  });

  afterAll(async () => {
    server.close();
  });

  // Teste de login com sucesso
  test('Login validado com sucesso', async () => {
    const response = await request(app)
      .post('/v1/user/token')
      .send({
        email: process.env.EMAIL_USER,
        password: process.env.SENHA_USER
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "200",
      mensagem: "token criado",
      detalhes: response.body.detalhes
    });
  });

  // Teste de login com senha inválida
  test('Login com senha inválida', async () => {
    const response = await request(app)
      .post('/v1/user/token')
      .send({
        email: process.env.EMAIL_USER,
        password: "senhainvalida291281"
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "401",
      mensagem: "senha inválido",
    });
  });

  // Teste de login com email inválido
  test('Login com email inválido', async () => {
    const response = await request(app)
      .post('/v1/user/token')
      .send({
        email: "emailinvalido298192@email.com",
        password: process.env.SENHA_USER
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "401",
      mensagem: "email inválido",
    });
  });

  // Teste de login com campos obrigatórios ausentes
  test('Login com campos obrigatórios ausentes', async () => {
    const response = await request(app)
      .post('/v1/user/token')
      .send({
        email: "",
        password: ""
      });

    expect(response.status).toBe(401);  // ou 422 dependendo do seu código de validação
    expect(response.body).toEqual({
      mensagem: "email inválido",
      status: "401",
      
    });
  });

  // Teste de login com token inválido
  test('Login com token inválido', async () => {
    const invalidToken = 'tokenInvalido123';
    const response = await request(app)
      .get('/v1/user/token')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(response.status).toBe(404);
  });

  // Teste de login com token expirado
  test('Acesso com token expirado', async () => {
    const expiredToken = 'expiredToken123';
    const response = await request(app)
      .get('/v1/user/token')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(404);
    
  });
});
