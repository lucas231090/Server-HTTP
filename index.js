const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// preflightContinue: o OPTIONS passa pelo CORS e chega nas nossas rotas
// (assim dá para mostrar o header Allow). exposedHeaders: libera o browser/Swagger
// a ler o token que vem nos headers da resposta do login.
app.use(
  cors({
    preflightContinue: true,
    exposedHeaders: ['Authorization', 'X-Auth-Token', 'Location', 'Allow'],
  }),
);
app.use(express.json());

const aulasIniciais = [
  { id: 1, title: 'Aula01', content: 'Apresentação da disciplina' },
  { id: 2, title: 'Aula02', content: 'Protocolo HTTP' },
  { id: 3, title: 'Aula03', content: 'HTML' },
  { id: 4, title: 'Aula04', content: 'CSS' },
  { id: 5, title: 'Aula05', content: 'JS' },
  { id: 6, title: 'Aula06', content: 'Prática JS' },
  { id: 7, title: 'Aula07', content: 'Prova 1' },
];

let aulas = aulasIniciais.map((a) => ({ ...a }));

// Contador de IDs: nunca diminui, então deletar não gera IDs repetidos.
let nextId = aulas.length + 1;

// ---------------------------------------------------------------------------
// Autenticação fake (didática)
// ---------------------------------------------------------------------------
const usuarios = [{ username: 'aluno', password: '123456', role: 'aluno' }];

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos
const tokens = new Map(); // token -> { username, role, expiresAt }

// Middleware: exige "Authorization: Bearer <token>".
function auth() {
  return (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ message: 'Token não enviado' });
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      res.set('WWW-Authenticate', 'Bearer');
      return res
        .status(401)
        .json({ message: 'Formato esperado: Authorization: Bearer <token>' });
    }

    const sessao = tokens.get(token);
    if (!sessao || sessao.expiresAt < Date.now()) {
      tokens.delete(token);
      res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    req.user = sessao;
    req.token = token;
    next();
  };
}

// Responde OPTIONS informando os métodos aceitos pelo endpoint (header Allow)
const allow =
  (...methods) =>
  (req, res) => {
    res.set('Allow', [...methods, 'OPTIONS'].join(', '));
    res.status(204).send();
  };

// ---------------------------------------------------------------------------
// Swagger
// ---------------------------------------------------------------------------
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API rest Didática',
      version: '1.1.0',
      description:
        'Uma API simples para testar requisições REST.\n\n' +
        '**Usuário de teste:** `aluno` / `123456`.\n\n' +
        'Faça POST em `/login`, pegue o token no header `Authorization` da resposta ' +
        'e envie nas rotas protegidas (botão *Authorize* aqui ou header no Postman/Insomnia).',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
  apis: [__filename],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Aula:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: integer
 *           description: ID da aula (gerado automaticamente)
 *           readOnly: true
 *         title:
 *           type: string
 *           description: Título da aula
 *         content:
 *           type: string
 *           description: Conteúdo da aula
 *       example:
 *         id: 1
 *         title: 'Aula de exemplo'
 *         content: 'Conteúdo da aula de exemplo'
 *     Login:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *       example:
 *         username: aluno
 *         password: '123456'
 */

app.get('/', (req, res) => {
  res.json({ message: 'Olá, você está no servidor do professor Lucas =D' });
});
app.options('/', allow('GET', 'HEAD'));

// ---------------------------------------------------------------------------
// Aulas
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /aulas:
 *   get:
 *     summary: Lista todas as aulas
 *     tags: [Aulas]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [id, title, content]
 *           default: id
 *         required: false
 *         description: Campo usado para ordenar a lista
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         required: false
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista de aulas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Aula'
 *       400:
 *         description: Parâmetro de ordenação inválido.
 */
app.get('/aulas', (req, res) => {
  const { sort = 'id', order = 'asc' } = req.query;

  if (!['id', 'title', 'content'].includes(sort)) {
    return res
      .status(400)
      .json({ message: 'sort deve ser: id, title ou content' });
  }
  if (!['asc', 'desc'].includes(order)) {
    return res.status(400).json({ message: 'order deve ser: asc ou desc' });
  }

  // cópia para não alterar a ordem do array original
  const result = [...aulas].sort((a, b) => {
    const cmp =
      sort === 'id'
        ? a.id - b.id
        : String(a[sort]).localeCompare(String(b[sort]), 'pt-BR');
    return order === 'desc' ? -cmp : cmp;
  });

  res.json(result);
});

/**
 * @swagger
 * /aulas:
 *   post:
 *     summary: Cria uma nova aula
 *     tags: [Aulas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aula'
 *     responses:
 *       201:
 *         description: Aula criada com sucesso. O header Location aponta para o novo recurso.
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: URL da aula criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aula'
 *       400:
 *         description: title e content são obrigatórios.
 */
app.post('/aulas', (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res
      .status(400)
      .json({ message: 'title e content são obrigatórios' });
  }

  const novaAula = { id: nextId++, title, content };
  aulas.push(novaAula);
  res.set('Location', `/aulas/${novaAula.id}`);
  res.status(201).json(novaAula);
});

// OPTIONS: o Express já responde HEAD automaticamente para toda rota GET
app.options('/aulas', allow('GET', 'HEAD', 'POST'));

/**
 * @swagger
 * /aulas/{id}:
 *   get:
 *     summary: Exibe uma aula específica pelo ID
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da aula
 *     responses:
 *       200:
 *         description: Detalhes da aula.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aula'
 *       404:
 *         description: Aula não encontrada.
 */
app.get('/aulas/:id', (req, res) => {
  const aula = aulas.find((a) => a.id === parseInt(req.params.id));
  if (!aula) return res.status(404).json({ message: 'Item não encontrado' });
  res.json(aula);
});

/**
 * @swagger
 * /aulas/{id}:
 *   put:
 *     summary: Substitui uma aula inteira pelo ID (title e content obrigatórios)
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da aula
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aula'
 *     responses:
 *       200:
 *         description: Aula substituída com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aula'
 *       400:
 *         description: title e content são obrigatórios no PUT.
 *       404:
 *         description: Aula não encontrada.
 */
app.put('/aulas/:id', (req, res) => {
  const aula = aulas.find((a) => a.id === parseInt(req.params.id));
  if (!aula) return res.status(404).json({ message: 'Item não encontrado' });

  const { title, content } = req.body || {};
  if (!title || !content) {
    return res
      .status(400)
      .json({ message: 'PUT substitui o recurso: envie title e content' });
  }

  aula.title = title;
  aula.content = content;
  res.json(aula);
});

/**
 * @swagger
 * /aulas/{id}:
 *   patch:
 *     summary: Atualiza parcialmente uma aula (envie só o que quer mudar)
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da aula
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *           example:
 *             content: 'Novo conteúdo'
 *     responses:
 *       200:
 *         description: Aula atualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Aula'
 *       404:
 *         description: Aula não encontrada.
 */
app.patch('/aulas/:id', (req, res) => {
  const aula = aulas.find((a) => a.id === parseInt(req.params.id));
  if (!aula) return res.status(404).json({ message: 'Item não encontrado' });

  const { title, content } = req.body || {};
  if (title !== undefined) aula.title = title;
  if (content !== undefined) aula.content = content;
  res.json(aula);
});

/**
 * @swagger
 * /aulas/{id}:
 *   delete:
 *     summary: Deleta uma aula pelo ID
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da aula
 *     responses:
 *       204:
 *         description: Aula deletada com sucesso.
 *       404:
 *         description: Aula não encontrada.
 */
app.delete('/aulas/:id', (req, res) => {
  const index = aulas.findIndex((a) => a.id === parseInt(req.params.id));
  if (index === -1)
    return res.status(404).json({ message: 'Item não encontrado' });

  aulas.splice(index, 1);
  res.status(204).send();
});

app.options('/aulas/:id', allow('GET', 'HEAD', 'PUT', 'PATCH', 'DELETE'));

// ---------------------------------------------------------------------------
// Login / rotas protegidas
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Faz login (fake) e devolve o token nos HEADERS da resposta
 *     description: >
 *       O token não vem no corpo. Olhe os headers da resposta
 *       (`Authorization` e `X-Auth-Token`).
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login realizado. Token nos headers.
 *         headers:
 *           Authorization:
 *             schema:
 *               type: string
 *             description: "Bearer <token>"
 *           X-Auth-Token:
 *             schema:
 *               type: string
 *             description: Token puro, sem o prefixo Bearer
 *       400:
 *         description: username e password são obrigatórios.
 *       401:
 *         description: Credenciais inválidas.
 */
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'username e password são obrigatórios' });
  }

  const usuario = usuarios.find(
    (u) => u.username === username && u.password === password,
  );
  if (!usuario) {
    return res.status(401).json({ message: 'Usuário ou senha inválidos' });
  }

  const token = crypto.randomUUID();
  tokens.set(token, {
    username: usuario.username,
    role: usuario.role,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });

  res.set('Authorization', `Bearer ${token}`);
  res.set('X-Auth-Token', token);
  res.json({ message: 'Login ok! Procure o token nos headers da resposta.' });
});
app.options('/login', allow('POST'));

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Invalida o token atual
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logout realizado.
 *       401:
 *         description: Token ausente, inválido ou expirado.
 */
app.post('/logout', auth(), (req, res) => {
  tokens.delete(req.token);
  res.status(204).send();
});
app.options('/logout', allow('POST'));

/**
 * @swagger
 * /perfil:
 *   get:
 *     summary: Dados do usuário logado (rota protegida)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário.
 *       401:
 *         description: Token ausente, inválido ou expirado.
 */
app.get('/perfil', auth(), (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role,
    tokenExpiraEm: new Date(req.user.expiresAt).toISOString(),
  });
});
app.options('/perfil', allow('GET', 'HEAD'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Documentação disponível em http://localhost:${PORT}/api-docs`);
});
