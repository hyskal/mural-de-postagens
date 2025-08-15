#### **Descrição Técnica do Projeto**

Este projeto é um mural de postagens construído com uma arquitetura moderna e gratuita, agora com funcionalidades aprimoradas. A aplicação utiliza um **front-end** estático em HTML, CSS e JavaScript, uma **API de back-end** serverless para comunicação e um banco de dados **PostgreSQL** para persistência dos dados.

* **Novas Funcionalidades**: O projeto agora suporta pesquisa de postagens, ordenação, paginação de 20 posts por página, tags, e uma página de administração protegida por senha, que permite editar e excluir postagens sem limite de tempo. A data de postagem é preenchida automaticamente com a data atual.
* **Front-end**: A interface do usuário é composta por arquivos estáticos hospedados no Vercel. A lógica do `script.js` foi atualizada para interagir com a API, suportando todas as novas funcionalidades e incluindo uma barra de carregamento para a submissão de posts. A formatação de datas de exibição foi alterada para `dd-mm-aaaa`.
* **Back-end (Vercel Functions)**: A API, desenvolvida em **Node.js** e hospedada no Vercel, atua como uma ponte segura entre o front-end e o banco de dados. Ela foi modificada para aceitar os novos métodos de edição (`PUT`), exclusão (`DELETE`) com verificação de senha de administrador e parâmetros de busca/paginação.
* **Banco de Dados (Neon)**: A persistência dos dados é garantida por um banco de dados **PostgreSQL** hospedado no Neon. A estrutura da tabela foi ajustada para suportar a nova funcionalidade de tempo e tags.

---

#### **Configuração Detalhada do DBeaver e Servidor SQL (Neon)**

O **DBeaver** foi a ferramenta gráfica utilizada para gerenciar e configurar o banco de dados. Para garantir que sua tabela suporte todas as funcionalidades, siga o script unificado abaixo.

**Conexão ao Neon**:
- Crie uma nova conexão no DBeaver e selecione **PostgreSQL**.
- Use a **string de conexão direta** do seu projeto no Neon para preencher os campos. O formato da string de conexão é: `postgresql://[usuario]:[senha]@[host]:[porta]/[banco_de_dados]?sslmode=require`.

**Script Unificado de Configuração**:
Execute este bloco de código no editor SQL do DBeaver. Ele irá criar um novo esquema, a tabela `memorial` (com as novas colunas `tags` e `created_at`) e ajustará a tabela caso ela já tenha sido criada:

```sql
-- Garante que o esquema exista e o usuário tenha permissão
CREATE SCHEMA IF NOT EXISTS memorial_schema AUTHORIZATION neondb_owner;

-- Cria a tabela com as novas colunas se ela ainda não existir
CREATE TABLE IF NOT EXISTS memorial_schema.memorial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    description TEXT,
    author VARCHAR(100),
    photo_date DATE,
    image_url VARCHAR(255),
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Adiciona a coluna 'tags' caso a tabela já exista (prevenindo erros)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='memorial_schema' AND table_name='memorial' AND column_name='tags') THEN
        ALTER TABLE memorial_schema.memorial ADD COLUMN tags TEXT;
    END IF;
END
$$;

-- Adiciona a coluna 'created_at' caso a tabela já exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='memorial_schema' AND table_name='memorial' AND column_name='created_at') THEN
        ALTER TABLE memorial_schema.memorial ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;
END
$$;
