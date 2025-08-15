**Descrição Técnica do Projeto**

Este projeto é um mural de postagens construído com uma arquitetura moderna e gratuita. A aplicação utiliza um **front-end** estático em HTML, CSS e JavaScript, uma **API de back-end** serverless para comunicação e um banco de dados **PostgreSQL** para persistência dos dados.

* **Front-end**: A interface do usuário é composta por arquivos estáticos hospedados no Vercel. A lógica do `script.js` interage com a API para realizar operações de leitura e criação de postagens.
* **Back-end (Vercel Functions)**: A API foi desenvolvida em **Node.js** e hospedada como uma função serverless no Vercel. Ela atua como uma ponte segura entre o front-end e o banco de dados.
* **Banco de Dados (Neon)**: A persistência dos dados é garantida por um banco de dados **PostgreSQL** hospedado no Neon, uma plataforma serverless com um plano gratuito generoso.

---

#### **Configuração Detalhada do DBeaver**

O **DBeaver** foi a ferramenta gráfica utilizada para gerenciar e configurar o banco de dados. A seguir, os passos e scripts utilizados para a conexão, criação do esquema e da tabela:

1.  **Conexão ao Neon**: Uma nova conexão foi criada no DBeaver utilizando a **string de conexão direta** do seu projeto no Neon. O formato da string de conexão é:

    `postgresql://[usuario]:[senha]@[host]:[porta]/[banco_de_dados]?sslmode=require`

2.  **Configurações da Conexão**: Para a conexão, os seguintes campos foram preenchidos com as informações da sua string de conexão:
    * **Host**: O endereço único do seu banco de dados, como `ep-lingering-heart-aczgeawr.sa-east-1.aws.neon.tech`.
    * **Porta**: `5432`.
    * **Banco de Dados**: `neondb`.
    * **Usuário**: O nome do proprietário, como `neondb_owner`.
    * **Senha**: A senha gerada para o usuário.

3.  **Criação do Esquema e Tabela**: Após a conexão bem-sucedida, os seguintes scripts foram executados no editor SQL do DBeaver para criar a estrutura do banco de dados, contornando os problemas de permissão:

    `CREATE SCHEMA memorial_schema AUTHORIZATION [seu_usuario];`

    `CREATE TABLE memorial_schema.memorial ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(255) NOT NULL, description TEXT, author VARCHAR(100), post_date DATE, image_url VARCHAR(255));`

---

#### **Integração com a API ImgBB**

O projeto utiliza a API **ImgBB** para o armazenamento de imagens. A chave de API do ImgBB é usada diretamente no `script.js` para realizar o upload. O back-end e o banco de dados armazenam apenas a URL da imagem, otimizando a aplicação.

---

#### **Configuração do Vercel**

O deploy da aplicação e da API foi realizado no Vercel. Para o back-end se comunicar com o banco de dados, é essencial configurar uma variável de ambiente:

* **Variável de Ambiente**: No painel do Vercel, a variável **`NEON_CONNECTION_STRING`** deve ser configurada com a **string de conexão direta** do Neon.

* **Exemplo de Configuração**:

    | Nome da Variável | Valor (Exemplo) |
    | :--- | :--- |
    | `NEON_CONNECTION_STRING` | `postgresql://[usuario]:[senha]@[host]:[porta]/[banco_de_dados]?sslmode=require` |

---

#### **Comandos do Terminal**

Os seguintes comandos foram utilizados para preparar a estrutura do projeto e enviá-lo para o GitHub, o que acionou o deploy automático no Vercel.

1.  **Clonar o repositório**: `git clone [URL_DO_SEU_REPOSITORIO]`
2.  **Acessar a pasta**: `cd mural-de-postagens`
3.  **Criar pastas e arquivos**: `mkdir api public` e `touch api/posts.js public/index.html public/script.js public/style.css package.json`
4.  **Mover arquivos**: `mv index.html public/` e `mv script.js public/`
5.  **Enviar para o GitHub**: `git add .`, `git commit -m "Mensagem do commit"` e `git push origin main`