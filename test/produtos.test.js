const request = require('supertest');
const app = require('../src/app');
const produto = require('../src/models/tabelaProdutos');
const imagensProduto = require('../src/models/imagensProduto');
const opcoesProduto = require('../src/models/opcoesProduto');
const bcrypt = require('bcrypt');

let server;
let token;

// Teste da rota de Produtos
describe('Testando a rota de Produtos', () => {

  jest.mock('../src/models/tabelaProdutos');
  jest.mock('../src/models/imagensProduto');
  jest.mock('../src/models/opcoesProduto');

  beforeAll(async () => {
    server = app.listen(9005);
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
    server.close(); // Encerra o servidor após os testes
  });

  test('Teste do método GET', async () => {
    const response = await request(app).get('/v1/produtos/search');
    expect(response.status).toBe(200);
  });

  test('Teste do método GET com dados da requisição incorretos', async () => {
    const response = await request(app).get('/v1/produtos/search?limit=doze');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "400",
      mensagem: "limit aceita apensa numeros"
    });
  });

  // Teste do método GET por id
  test('Teste do método GET por id', async () => {
    const response = await request(app).get('/v1/produtos/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "200",
      mensagem: "Produto encontrado!",
      detalhes: {
        id: 1,
        enabled: true,
        name: "Camiseta Básica",
        slug: "camiseta-basica",
        stock: 100,
        description: "Camiseta de algodão com diversas cores disponíveis.",
        price: 39.9,
        price_with_discount: 29.9,
        images: [
          {
            id: 1,
            content: "/images/products/camiseta-basica-frente.jpg"
          },
          {
            id: 2,
            content: "/images/products/camiseta-basica-verso.jpg"
          }
        ],
        options: []
      }
    });
  });
  

  test('Teste do método GET por id - Recurso não encontrado', async () => {
    const response = await request(app).get('/v1/produtos/123');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      mensagem: "Produto não encontrado!",
      status: "404"
    });
  });

  // Teste do método POST
  test('Teste do método POST dados da requisição incorretos', async () => {
    const response = await request(app)
      .post('/v1/produtos')
      .set('Authorization', token)
      .send({
        name: "Produto A",
        slug: "produto-a",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      mensagem: "Há campos obrigatórios não preenchidos!",
      status: "400"
    });
  });

  test('Tentando criar produto com token inválido', async () => {
    const response = await request(app)
      .post('/v1/produtos')
      .set('Authorization', 'tokenInvalido')
      .send({
        name: "Produto A",
        slug: "produto-a",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "401",
      mensagem: "Token invalido"
    });
  });

  test('Criando um novo produto', async () => {
    produto.create = jest.fn();
    imagensProduto.bulkCreate = jest.fn();
    opcoesProduto.bulkCreate = jest.fn();

    produto.create.mockResolvedValue({
      id: 1,
      enabled: true,
      name: "Produto 01",
      slug: "produto-01",
      stock: 10,
      description: "Descrição do produto 01",
      price: 119.90,
      price_with_discount: 99.90,
      category_ids: [1, 15, 24, 68]
    });

    imagensProduto.bulkCreate.mockResolvedValue([
      { id: 1, product_id: 1, path: "base64 da imagem 1", enabled: true },
      { id: 2, product_id: 1, path: "base64 da imagem 2", enabled: true },
      { id: 3, product_id: 1, path: "base64 da imagem 3", enabled: true }
    ]);

    opcoesProduto.bulkCreate.mockResolvedValue([
      { id: 1, produtos_id: 1, title: "Cor", shape: "square", radius: 4, type: "text", values: '["PP", "GG", "M"]' },
      { id: 2, produtos_id: 1, title: "Tamanho", shape: "circle", radius: null, type: "color", values: '["#000", "#333"]' }
    ]);

    const response = await request(app)
      .post('/v1/produtos')
      .set('Authorization', token)
      .send({
        enabled: true,
        name: "Produto 01",
        slug: "produto-01",
        stock: 10,
        description: "Descrição do produto 01",
        price: 119.90,
        price_with_discount: 99.90,
        category_ids: [1, 15, 24, 68],
        images: [ /* imagens mockadas aqui */ ],
        options: [ /* opções mockadas aqui */ ]
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      mensagem: "Produto criado com sucesso!",
      status: "201"
    });
  });

  // Teste do método PUT
  test('Atualizando produto com token inválido', async () => {
    const response = await request(app)
      .put('/v1/produtos/2')
      .set('Authorization', 'tokenInvalido')
      .send({
        enabled: true,
        name: "Produto 01",
        slug: "produto-01",
        stock: 10,
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: '401',
      mensagem: 'Token invalido',
    });
  });

  test('Atualizando produto', async () => {
    produto.update = jest.fn();
    produto.update.mockResolvedValue([1]);

    const response = await request(app)
      .put('/v1/produtos/2')
      .set('Authorization', token)
      .send({
        enabled: true,
        name: "Produto 01",
        slug: "produto-01",
        stock: 10,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: '200',
      mensagem: "Produto atualizado com sucesso!",
    });
  });

  // Teste do método DELETE
  test('Deletando produto com token inválido', async () => {
    const response = await request(app)
      .delete('/v1/produtos/20')
      .set('Authorization', 'tokenInvalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: '401',
      mensagem: 'Token invalido',
    });
  });

  test('Deletando produto', async () => {
    produto.destroy = jest.fn();
    produto.destroy.mockResolvedValue(1);

    const response = await request(app)
      .delete('/v1/produtos/7')
      .set('Authorization', token);

    expect(response.status).toBe(204);
  });

});
