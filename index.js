const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(express.json());

let aulas = [
  { id: 1, title: "Aula01", content: "Apresentação da disciplina" },
  { id: 2, title: "Aula02", content: "Protocolo HTTP" },
  { id: 3, title: "Aula03", content: "HTML" },
  { id: 4, title: "Aula04", content: "CSS" },
  { id: 5, title: "Aula05", content: "JS" },
  { id: 6, title: "Aula06", content: "Prática JS" },
  { id: 7, title: "Aula07", content: "Prova 1" },
];

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API rest Didática",
      version: "1.0.0",
      description: "Uma API simples para testar requisições REST.",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./index.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do post
 *         title:
 *           type: string
 *           description: Título do post
 *         content:
 *           type: string
 *           description: Conteúdo do post
 *       example:
 *         id: 1
 *         title: 'Post de exemplo'
 *         content: 'Conteúdo do post de exemplo'
 */

/**
 * @swagger
 * /aulas:
 *   get:
 *     summary: Lista todos as aulas
 *     tags: [Aulas]
 *     responses:
 *       200:
 *         description: Lista de Aulas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
app.get("/", (req, res) => {
  res.json({ message: "Olá, você está no servidor do professor Lucas =D" });
});

app.get("/aulas", (req, res) => {
  res.json(aulas);
});

/**
 * @swagger
 * /aulas:
 *   post:
 *     summary: Cria um novo post
 *     tags: [Aulas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
app.post("/aulas", (req, res) => {
  const newPost = {
    id: aulas.length + 1,
    title: req.body.title,
    content: req.body.content,
  };
  aulas.push(newPost);
  res.status(201).json(newPost);
});

/**
 * @swagger
 * /aulas/{id}:
 *   get:
 *     summary: Exibe um post específico pelo ID
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do post
 *     responses:
 *       200:
 *         description: Detalhes do post.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post não encontrado.
 */
app.get("/aulas/:id", (req, res) => {
  const post = aulas.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ message: "Item não encontrado" });
  res.json(post);
});

/**
 * @swagger
 * /aulas/{id}:
 *   put:
 *     summary: Atualiza um post pelo ID
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post não encontrado.
 */
app.put("/aulas/:id", (req, res) => {
  const post = aulas.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ message: "Item não encontrado" });

  post.title = req.body.title || post.title;
  post.content = req.body.content || post.content;

  res.json(post);
});

/**
 * @swagger
 * /aulas/{id}:
 *   delete:
 *     summary: Deleta um post pelo ID
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do post
 *     responses:
 *       204:
 *         description: Post deletado com sucesso.
 *       404:
 *         description: Post não encontrado.
 */
app.delete("/aulas/:id", (req, res) => {
  const postIndex = aulas.findIndex((p) => p.id === parseInt(req.params.id));
  if (postIndex === -1)
    return res.status(404).json({ message: "Item não encontrado" });

  aulas.splice(postIndex, 1);
  res.status(204).send();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Documentação disponível em http://localhost:${PORT}/api-docs`);
});
