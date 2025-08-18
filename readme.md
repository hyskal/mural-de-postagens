#### **Descrição Técnica do Projeto**

Este projeto é um mural de postagens construído com uma arquitetura moderna e gratuita, agora com funcionalidades aprimoradas. A aplicação utiliza um **front-end** estático em HTML, CSS e JavaScript, uma **API de back-end** serverless para comunicação e um banco de dados **PostgreSQL** para persistência dos dados.

## 🔧 **Estrutura do Projeto**

```
mural-postagens/
├── public/
│   ├── index.html          # Estrutura HTML limpa
│   ├── style.css          # Estilos organizados e otimizados  
│   └── script.js          # JavaScript modular e limpo
├── api/
│   └── posts.js           # Endpoints da API REST
├── README.md              # Documentação completa
└── package.json           # Dependências e scripts
```

* **Novas Funcionalidades**: O projeto agora suporta pesquisa de postagens por título, autor e tags, ordenação por diferentes critérios (data de postagem, data da foto, título e autor), paginação de 10 posts por página no mural principal e 20 na página de administração, e um tema de cores personalizável para cada postagem. Uma página de administração protegida por senha permite editar e excluir postagens sem limite de tempo.

* ## 🚀 **Principais Funcionalidades**

### 🔲 **Sistema de Grid Responsivo**
- **Desktop (1200px+):** 4 colunas compactas
- **Tablet (768-1199px):** 3 colunas adaptáveis  
- **Mobile (até 767px):** 2 colunas otimizadas
- **Layout fluido** que se adapta automaticamente ao dispositivo

### 📱 **Cards Expansíveis Inteligentes**
- **Visualização compacta** com informações essenciais
- **Clique para expandir** em modal overlay centralizado
- **Indicador visual "+"** para mostrar conteúdo adicional
- **Botão "×"** para fechar facilmente
- **Transições suaves** e animações modernas

### 🔍 **Sistema de Interações Avançadas**
- **Tecla ESC** para fechar cards expandidos
- **Swipe down** (mobile) para fechar rapidamente
- **Tags clicáveis** no modo expandido para busca
- **Clique na imagem** para ampliar em tela cheia
- **Hover effects** responsivos e intuitivos

### 📝 **Criação e Edição de Posts**
- **Formulário intuitivo** com validação em tempo real
- **Upload múltiplo de imagem** com APIs redundantes
- **Seletor de cores** para personalização
- **Limite de caracteres** com contador visual
- **Edição/exclusão** com limite de tempo (5 minutos)

### ⚡ **Sistema de Loading Moderno**
- **Círculo de progresso animado** com percentual
- **Indicadores de etapa** visuais
- **Mensagens de status** em tempo real
- **Animação de sucesso** com feedback visual
- **Tratamento de erros** com retry automático

### 🔎 **Busca e Filtros Inteligentes**
- **Busca em tempo real** com debounce
- **Filtros por data, título e autor**
- **Busca por tags** específicas
- **Ordenação** crescente/decrescente
- **Paginação** com controles intuitivos

## ⚙️ **Configurações Avançadas**

### **Limites Configuráveis**
```javascript
const EDIT_TIME_LIMIT_MINUTES = 5;    // Tempo para edição
const LIMIT_DESCRIPTION = 300;        // Máximo na descrição
const DISPLAY_LIMIT_DESCRIPTION = 100; // Truncar na visualização
const LIMIT_TITLE = 120;               // Máximo no título
const postsPerPage = 20;               // Posts por página
```

### **APIs de Upload**
```javascript
const IMG_API_CONFIGS = [
    { name: 'ImgBB - Primary', endpoint: 'https://api.imgbb.com/1/upload' },
    { name: 'ImgBB - Backup', endpoint: 'https://api.imgbb.com/1/upload' }
];
```

### **Temas de Cores**
```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #34495e;
    --background-gradient: linear-gradient(135deg, #e3f2fd, #c3e3f3);
    --glass-background: rgba(255, 255, 255, 0.6);
}
```


* **Front-end**: A interface do usuário é composta por arquivos estáticos hospedados no Vercel (ou GitHub Pages). A lógica do `script.js` e `admin-script.js` foi atualizada para interagir com a API, suportando todas as novas funcionalidades e incluindo uma barra de carregamento para a submissão de posts. A formatação de datas de exibição foi alterada para `dd-mm-aaaa`.

* **Back-end (Vercel Functions)**: A API, desenvolvida em **Node.js** e hospedada no Vercel, atua como uma ponte segura entre o front-end e o banco de dados. Ela foi modificada para aceitar os novos métodos de edição (`PUT`), exclusão (`DELETE`) com verificação de senha de administrador e parâmetros de busca/paginação.

* **Banco de Dados (Neon)**: A persistência dos dados é garantida por um banco de dados **PostgreSQL** hospedado no Neon. A estrutura da tabela foi ajustada para suportar as novas funcionalidades de tempo, tags e tema de cor.

#### **Configuração Detalhada do DBeaver e Servidor SQL (Neon)**

O **DBeaver** foi a ferramenta gráfica utilizada para gerenciar e configurar o banco de dados. Para garantir que sua tabela suporte todas as funcionalidades, siga o script unificado abaixo.

**Conexão ao Neon**:

* Crie uma nova conexão no DBeaver e selecione **PostgreSQL**.

* Use a **string de conexão direta** do seu projeto no Neon para preencher os campos. O formato da string de conexão é: `postgresql://[usuario]:[senha]@[host]:[porta]/[banco_de_dados]?sslmode=require`.

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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    color VARCHAR(50)
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

-- Adiciona a coluna 'color' caso a tabela já exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='memorial_schema' AND table_name='memorial' AND column_name='color') THEN
        ALTER TABLE memorial_schema.memorial ADD COLUMN color VARCHAR(50);
    END IF;
END
$$;
```

#### **Integração e Configuração**

**API de Imagens (Redundância)**:
O projeto agora utiliza duas APIs de upload de imagens para garantir redundância e maior confiabilidade: **ImgBB** e **Freeimage.host**. A lógica de `scripts.js` e `admin-script.js` tenta fazer o upload na primeira API e, se houver falha, automaticamente tenta a segunda. O back-end e o banco de dados armazenam apenas a URL da imagem.

**Configuração do Vercel**:
O **deploy** da aplicação e da API é realizado no Vercel. Para o back-end se comunicar com o banco de dados, é essencial configurar uma variável de ambiente.

* **Variável de Ambiente**: No painel do Vercel, a variável `NEON_CONNECTION_STRING` deve ser configurada com a string de conexão direta do Neon.

Exemplo de Configuração:
| Nome da Variável | Valor (Exemplo) |
| :--- | :--- |
| `NEON_CONNECTION_STRING` | `postgresql://[usuario]:[senha]@[host]:[porta]/[banco_de_dados]?sslmode=require` |

#### **Como Executar e Fazer o Deploy do Projeto**

Para preparar e gerenciar o projeto, os seguintes comandos de terminal são essenciais:

1. **Clonar o repositório:** `git clone [URL_DO_SEU_REPOSITORIO]`

2. **Acessar a pasta:** `cd mural-de-postagens`

3. **Rodar localmente com Vercel CLI:**

   * Instale a **Vercel CLI** globalmente: `npm i -g vercel`

   * Execute o servidor local: `vercel dev`

**Deploy no Vercel**:
Para enviar as atualizações ao Vercel e iniciar um novo **deploy**:

1. Adicione os arquivos alterados: `git add .`

2. Confirme as mudanças: `git commit -m "Mensagem do commit"`

3. Envie para o GitHub: `git push origin main`

**Termux (Alternativa)**:
O **Termux** é um emulador de terminal e ambiente Linux para Android que permite executar a linha de comando no seu dispositivo móvel. Ele é uma excelente alternativa para o desenvolvimento em trânsito.

Para rodar o projeto no Termux:

1. Instale o Termux e o pacote `nodejs` via `pkg install nodejs`.

2. Instale o Git: `pkg install git`.

3. Clone o repositório do projeto: `git clone [URL_DO_SEU_REPOSITORIO]`.

4. Entre na pasta do projeto: `cd mural-de-postagens`.

5. Instale as dependências: `npm install`.

6. Instale o **Vercel CLI** globalmente: `npm i -g vercel`.

7. Rode o projeto localmente: `vercel dev`. O servidor irá iniciar e você poderá acessar o mural pelo navegador do seu celular, usando o endereço IP e a porta fornecidos no terminal.

Instruções para Revisores nos changelogs:

 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
