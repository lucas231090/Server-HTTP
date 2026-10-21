# Servidor HTTP para testes

O servidor está preparado para responder requisições baseadas no padrão REST.

Clone o repositório e instale as dependências utilizando `npm install`

Para inicializar o servidor utilize o comando `npm start`

O servidor roda em `http://localhost:3000` e a documentação interativa (Swagger) fica em `http://localhost:3000/api-docs`.

> Os dados ficam apenas em memória: ao reiniciar o servidor, tudo volta ao estado inicial.

## Rotas da API de Aulas

| Verbo HTTP | Padrão de URL | Função                                          |
| ---------- | ------------- | ----------------------------------------------- |
| GET        | /aulas        | Lista todas as aulas (index)                    |
| POST       | /aulas        | Cria uma nova aula (create)                     |
| GET        | /aulas/{id}   | Exibe a aula número "id" (show)                 |
| PUT        | /aulas/{id}   | Substitui a aula número "id" (update completo)  |
| PATCH      | /aulas/{id}   | Altera parcialmente a aula número "id" (update) |
| DELETE     | /aulas/{id}   | Remove a aula número "id" (delete)              |
| OPTIONS    | qualquer rota | Informa os métodos aceitos (header `Allow`)     |

### EXEMPLO DE ENVIO DE BODY NAS REQUISIÇÕES POST/PUT

```json
{
  "title": "Aula teste",
  "content": "Descrição da aula teste"
}
```

No **PUT** é obrigatório enviar `title` e `content`. No **PATCH** envie apenas o que deseja alterar:

```json
{
  "content": "Novo conteúdo"
}
```

### ORDENAÇÃO NA LISTAGEM (QUERY PARAMS)

| Parâmetro | Valores                  | Padrão |
| --------- | ------------------------ | ------ |
| sort      | `id`, `title`, `content` | `id`   |
| order     | `asc`, `desc`            | `asc`  |

Exemplo: `GET /aulas?sort=title&order=desc`

## Autenticação (fake, apenas didática)

| Verbo HTTP | Padrão de URL | Protegida? | Função                                      |
| ---------- | ------------- | ---------- | ------------------------------------------- |
| POST       | /login        | Não        | Faz login e devolve o token **nos headers** |
| GET        | /perfil       | Sim        | Exibe os dados do usuário logado            |
| POST       | /logout       | Sim        | Invalida o token atual                      |

Usuário de teste: `aluno` / `123456`

### EXEMPLO DE ENVIO DE BODY NA REQUISIÇÃO DE LOGIN

```json
{
  "username": "aluno",
  "password": "123456"
}
```

O token **não vem no corpo** da resposta. Procure nos headers `Authorization` (já com o prefixo `Bearer`) e `X-Auth-Token`.

Para acessar as rotas protegidas, envie o header:

```
Authorization: Bearer <seu-token>
```

O token expira em 15 minutos. Sem token, ou com token inválido, a resposta é `401 Unauthorized`.

## Desafios para explorar

- Faça um `OPTIONS` em `/aulas` e em `/aulas/1` e compare o header `Allow`.
- Faça um `HEAD` em `/aulas` e observe que vêm só os headers, sem body.
- Crie uma aula e veja o header `Location` da resposta 201.
- Delete uma aula e crie outra: o ID se repete?
- Compare o `PUT` com apenas `title` e o `PATCH` com apenas `title`.
- Chame `/perfil` sem token, com token errado e com token válido.
- Faça logout e tente usar o mesmo token de novo.
- Liste as aulas ordenadas por `title` em ordem decrescente.
