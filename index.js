const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(cors());
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
 *           description: ID da aula
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
 *     summary: Cria uma nova aula
 *     tags: [Aulas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Aula criada com sucesso.
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
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Aula não encontrada.
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
 *     summary: Atualiza uma aula pelo ID
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
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Aula atualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Aula não encontrada.
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
