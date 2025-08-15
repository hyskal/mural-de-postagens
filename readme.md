### README.md

#### **Descrição Técnica do Projeto**

Este projeto é um mural de postagens construído com uma arquitetura moderna e gratuita, agora com funcionalidades aprimoradas. A aplicação utiliza um **front-end** estático em HTML, CSS e JavaScript, uma **API de back-end** serverless para comunicação e um banco de dados **PostgreSQL** para persistência dos dados.

* **Novas Funcionalidades**: O projeto agora suporta pesquisa de postagens, ordenação, paginação de 20 posts por página, e a exibição de tags.
* **Front-end**: A interface do usuário é composta por arquivos estáticos hospedados no Vercel. A lógica do `script.js` foi atualizada para interagir com a API, suportando todas as novas funcionalidades.
* **Back-end (Vercel Functions)**: A API, desenvolvida em **Node.js** e hospedada no Vercel, atua como uma ponte segura entre o front-end e o banco de dados. Ela foi modificada para aceitar parâmetros de pesquisa, ordenação, paginação e tags.
* **Banco de Dados (Neon)**: A persistência dos dados é garantida por um banco de dados **PostgreSQL** hospedado no Neon.

---

#### **Configuração Detalhada do DBeaver e Servidor SQL (Neon)**

O **DBeaver** foi a ferramenta gráfica utilizada para gerenciar e configurar o banco de dados. A seguir, os passos e o script unificado para a conexão e criação da estrutura:

1.  **Conexão ao Neon**: Uma nova conexão foi criada no DBeaver utilizando a **string de conexão direta** do seu projeto no Neon. O formato da string de conexão é:

    `postgresql://[usuario]:[senha]@[host]:[porta]/[banco_de_dados]?sslmode=require`

2.  **Configurações da Conexão**: Para a conexão, os seguintes campos foram preenchidos com as informações da sua string de conexão:
    * **Host**: O endereço único do seu banco de dados, como `ep-lingering-heart-aczgeawr.sa-east-1.aws.neon.tech`.
    * **Porta**: `5432`.
    * **Banco de Dados**: `neondb`.
    * **Usuário**: O nome do proprietário, como `neondb_owner`.
    * **Senha**: A senha gerada para o usuário.

3.  **Script Unificado de Configuração**: Após a conexão, execute este bloco de código no editor SQL do DBeaver. Ele irá criar um novo esquema, a tabela `memorial` (com a nova coluna `tags`) e ajustará a tabela existente caso ela já tenha sido criada:

    ```sql
    -- Garante que o esquema exista e o usuário tenha permissão
    CREATE SCHEMA IF NOT EXISTS memorial_schema AUTHORIZATION neondb_owner;

    -- Cria a tabela com a nova coluna 'tags' se ela ainda não existir
    CREATE TABLE IF NOT EXISTS memorial_schema.memorial (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author VARCHAR(100),
        post_date DATE,
        image_url VARCHAR(255),
        tags TEXT
    );

    -- Adiciona a coluna 'tags' caso a tabela já exista (prevenindo erros)
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='memorial_schema' AND table_name='memorial' AND column_name='tags') THEN
            ALTER TABLE memorial_schema.memorial ADD COLUMN tags TEXT;
        END IF;
    END
    $$;
    ```

---

#### **Integração com a API ImgBB**

O projeto utiliza a API **ImgBB** para o armazenamento de imagens. A chave de API é usada no `script.js` para realizar o upload. O back-end e o banco de dados armazenam apenas a URL da imagem.

---

#### **Configuração do Vercel**

O deploy da aplicação e da API foi realizado no Vercel. Para o back-end se comunicar com o banco de dados, é essencial configurar uma variável de ambiente.

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
