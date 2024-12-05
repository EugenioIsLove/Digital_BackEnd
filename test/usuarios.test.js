const app = require('../src/app');
const request = require('supertest');
const usuarios = require('../src/models/tabelaUsuarios');
const bcrypt = require('bcrypt');

let server;
let token;

describe('Testes de usuários', () => {

  jest.mock('../src/models/tabelaUsuarios');

  beforeAll(async () => {
    // Inicia o servidor de teste na porta 3000 (ou outra porta de sua escolha)
    server = await app.listen(3000);

    // Realiza o login para obter o token
    const response = await request(app)
      .post('/v1/user/token')
      .send({
        email: process.env.EMAIL_USER,
        password: process.env.SENHA_USER,
      });

    expect(response.status).toBe(200);
    token = response.body.detalhes;
    expect(token).toBeDefined();
  });

  afterAll(async () => {
    // Encerra o servidor de teste para evitar conflitos de porta
    server.close();
  });

  // Limpando mocks antes de cada teste
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Teste do método GET
  test('Usuário não encontrado', async () => {
    const response = await request(app).get('/v1/usuarios/123');
    expect(response.status).toBe(404);
  });

  test('Usuário encontrado', async () => {
    const response = await request(app).get('/v1/usuarios/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "200",
      mensagem: "Usuario encontrado",
      detalhes: {
        id: 1,
        firstname: "Luis",
        surname: "Henrique",
        email: "henrique@teste.com",
        password: "$2b$10$oM6AMCo7AaxXX29bpE7i4ORPcJkX0qEmtTVZPjq.9wbZEz8aoPEIC",
      }
    });
  });

  // Teste do método POST
  test('Tentativa de criar usuário com email existente', async () => {
    const senhaCriptografada = await bcrypt.hash('123456', 10);

    const response = await request(app).post('/v1/usuarios')
      .set('Authorization', token)
      .send({
        firstname: 'Maria',
        surname: 'Eduarda',
        email: process.env.EMAIL_USER,
        password: senhaCriptografada
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "400",
      mensagem: "Email,já exite"
    });
  });

  test('Tentativa de criar usuário com um token inválido', async () => {
    const senhaCriptografada = await bcrypt.hash('123456', 10);

    const response = await request(app).post('/v1/usuarios')
      .set('Authorization', 'tokenInvalido')
      .send({
        firstname: 'Maria',
        surname: 'Eduarda',
        email: process.env.EMAIL_USER,
        password: senhaCriptografada
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "401",
      mensagem: "Token invalido"
    });
  });

  test('Tentativa de criar usuário com uma informação faltando', async () => {
    const senhaCriptografada = await bcrypt.hash('123456', 10);

    const response = await request(app).post('/v1/usuarios')
      .set('Authorization', token)
      .send({
        firstname: 'Maria',
        surname: 'Eduarda',
        password: senhaCriptografada
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "400",
      mensagem: "os campos são obrigatórios"
    });
  });

  test('Criando um novo usuário', async () => {
    usuarios.create = jest.fn();
    usuarios.create.mockResolvedValue({
      id: 1,
      firstname: 'Maria',
      surname: 'Eduarda',
      email: 'maria.eduarda@example.com',
      password: await bcrypt.hash('123456', 10)
    });

    const response = await request(app)
      .post('/v1/usuarios')
      .set('Authorization', token)
      .send({
        firstname: 'Maria',
        surname: 'Eduarda',
        email: 'maria.eduarda@example.com',
        password: '123456'
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      status: "201",
      mensagem: "usuario criando com sucesso",
      detalhes: {
        firstname: "Maria",
        surname: "Eduarda",
        email: 'maria.eduarda@example.com'
      }
    });
  });

  // Teste do método PUT
  test('Atualizando usuário com token inválido', async () => {
    const response = await request(app)
      .put('/v1/usuarios/1')
      .set('Authorization', 'tokenInvalido')
      .send({
        firstname: 'Maria',
        surname: 'Eduarda',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "401",
      mensagem: "Token invalido"
    });
  });

  test('Atualizando sem enviar informações', async () => {
    const response = await request(app)
      .put('/v1/usuarios/1')
      .set('Authorization', token)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "400",
      mensagem: "todos os campos não podem esta vazio"
    });
  });

  test('Atualizando informações com usuário inválido', async () => {
    const response = await request(app)
      .put('/v1/usuarios/41235')
      .set('Authorization', token)
      .send({
        firstname: 'Maria',
        surname: 'Eduarda',
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: "404",
      mensagem: "Usario não encotrado"
    });
  });

  test('Atualizando informações', async () => {
    usuarios.update = jest.fn();
    usuarios.update.mockResolvedValue({
      firstname: 'Eduarda',
      surname: 'Maria',
      email: 'eduarda@example.com',
    });

    const response = await request(app)
      .put('/v1/usuarios/3')
      .set('Authorization', token)
      .send({
        firstname: 'Eduarda',
        surname: 'Maria',
        email: 'eduarda@example.com'
      });

    expect(response.status).toBe(204);
  });

  // Teste dos métodos DELETE
  test('Deletando usuário com token inválido', async () => {
    const response = await request(app)
      .delete('/v1/usuarios/22')
      .set('Authorization', 'tokenInvalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: '401',
      mensagem: 'Token invalido'
    });
  });

  test('Deletando usuário inválido', async () => {
    const response = await request(app)
      .delete('/v1/usuarios/123473')
      .set('Authorization', token);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: '404',
      mensagem: 'Usuario com id= 123473 não foi encotrado'
    });
  });

  test('Deletando usuário', async () => {
    usuarios.destroy = jest.fn();
    usuarios.destroy.mockResolvedValue(4); // Simula uma deleção bem-sucedida

    const response = await request(app)
      .delete('/v1/usuarios/4')
      .set('Authorization', token);

    expect(response.status).toBe(204);
  });

});
