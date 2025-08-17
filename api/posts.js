/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 1.5: Correção crítica na validação da senha de administrador. Implementada função isValidAdminPassword() com múltiplas verificações de comparação e logs temporários de debug para identificar problemas na autenticação. Adicionada robustez contra variações de encoding e whitespace.
 * Versão 1.4: Refatoração da lógica de PUT e DELETE para remover a restrição de 5 minutos para o administrador. Agora, a regra é aplicada apenas se a senha de admin não for fornecida ou estiver incorreta, garantindo que o acesso do painel de administração tenha controle total sobre as postagens.
 * Versão 1.3: Adicionada a função getSecurePassword() para ofuscar a senha do administrador, substituindo o método de senha dinâmica para maior segurança.
 * Versão 1.2: Melhoria no tratamento de parâmetros de busca e ordenação para evitar SQL injection, usando prepared statements.
 */
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEON_CONNECTION_STRING,
});

const obfuscated = 'JFkpJF0lJF0pJFkpJFopJFkpJF4lJFopJF8lJFslJE0=';

function getSecurePassword() {
    const decoded = atob(obfuscated);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ 77);
    }
    return result;
}

// Função auxiliar para debug (remover em produção)
function debugPasswordComparison(receivedPassword, expectedPassword) {
    console.log('=== DEBUG PASSWORD COMPARISON ===');
    console.log('Received password:', receivedPassword);
    console.log('Expected password:', expectedPassword);
    console.log('Lengths match:', receivedPassword?.length === expectedPassword?.length);
    console.log('Are equal (===):', receivedPassword === expectedPassword);
    console.log('Are equal (==):', receivedPassword == expectedPassword);
    
    if (receivedPassword && expectedPassword) {
        console.log('Received bytes:', Array.from(receivedPassword).map(c => c.charCodeAt(0)));
        console.log('Expected bytes:', Array.from(expectedPassword).map(c => c.charCodeAt(0)));
    }
    console.log('================================');
}

// Função mais robusta para verificar senha de admin
function isValidAdminPassword(providedPassword) {
    if (!providedPassword) return false;
    
    const expectedPassword = getSecurePassword();
    
    // Debug temporário - REMOVER EM PRODUÇÃO
    debugPasswordComparison(providedPassword, expectedPassword);
    
    // Tentativas múltiplas de comparação
    const checks = [
        providedPassword === expectedPassword,
        providedPassword.trim() === expectedPassword.trim(),
        decodeURIComponent(providedPassword) === expectedPassword,
        providedPassword === encodeURIComponent(expectedPassword)
    ];
    
    console.log('Comparison results:', checks);
    return checks.some(check => check);
}

export default async function handler(request, response) {
    try {
        const client = await pool.connect();
        
        if (request.method === 'GET') {
            const { searchTerm = '', sortBy = 'created_at', sortOrder = 'desc', limit = 20, page = 1 } = request.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            let whereClause = '';
            const queryParams = [];
            
            if (searchTerm) {
                if (searchTerm.startsWith('tag:')) {
                    const tag = searchTerm.substring(4);
                    whereClause = 'WHERE tags ILIKE $1';
                    queryParams.push(`%${tag}%`);
                } else {
                    whereClause = 'WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1';
                    queryParams.push(`%${searchTerm}%`);
                }
            }
            
            const totalQuery = `SELECT COUNT(*) FROM memorial_schema.memorial ${whereClause}`;
            const totalResult = await client.query(totalQuery, queryParams);
            const totalPosts = parseInt(totalResult.rows[0].count);

            const allowedSortBy = ['created_at', 'photo_date', 'title', 'author'];
            const allowedSortOrder = ['asc', 'desc'];
            
            const sanitizedSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
            const sanitizedSortOrder = allowedSortOrder.includes(sortOrder) ? sortOrder : 'desc';

            const dataQuery = `
                SELECT id, title, description, author, photo_date, image_url, tags, created_at, color FROM memorial_schema.memorial
                ${whereClause}
                ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `;
            
            queryParams.push(limit, offset);
            const { rows: posts } = await client.query(dataQuery, queryParams);
            response.status(200).json({ posts, total: totalPosts });

        } else if (request.method === 'POST') {
            const { title, image_url, description, author, photo_date, tags, color } = request.body;
            const query = `
                INSERT INTO memorial_schema.memorial (title, image_url, description, author, photo_date, tags, color)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, created_at
            `;
            const result = await client.query(query, [title, image_url, description, author, photo_date, tags, color]);
            response.status(201).json(result.rows[0]);

        } else if (request.method === 'PUT') {
            const { id } = request.query;
            const { title, image_url, description, author, photo_date, tags, color } = request.body;
            const adminPassword = request.query.admin_password;

            console.log('PUT request - Admin password check starting...');

            // CORREÇÃO: Usar a nova função de validação
            if (!isValidAdminPassword(adminPassword)) {
                console.log('Admin password invalid, applying 5-minute rule');
                
                const postCheck = await client.query('SELECT created_at FROM memorial_schema.memorial WHERE id = $1', [id]);
                if (postCheck.rowCount === 0) {
                    return response.status(404).json({ message: 'Postagem não encontrada.' });
                }
    
                const createdTime = new Date(postCheck.rows[0].created_at);
                const fiveMinutesAgo = new Date(new Date() - (5 * 60 * 1000));
                if (createdTime < fiveMinutesAgo) {
                    return response.status(403).json({ message: 'Não é possível editar esta postagem. O limite de 5 minutos foi excedido.' });
                }
            } else {
                console.log('Admin password valid, skipping 5-minute rule');
            }
            
            const query = `
                UPDATE memorial_schema.memorial SET
                title = $1,
                image_url = $2,
                description = $3,
                author = $4,
                photo_date = $5,
                tags = $6,
                color = $7
                WHERE id = $8
            `;
            const queryParams = [title, image_url, description, author, photo_date, tags, color, id];
            await client.query(query, queryParams);
            response.status(200).json({ message: 'Postagem atualizada com sucesso!' });

        } else if (request.method === 'DELETE') {
            const { id } = request.query;
            const adminPassword = request.query.admin_password;
            
            console.log('DELETE request - Admin password check starting...');
            
            // CORREÇÃO: Usar a nova função de validação
            if (!isValidAdminPassword(adminPassword)) {
                console.log('Admin password invalid, applying 5-minute rule');
                
                const postCheck = await client.query('SELECT created_at FROM memorial_schema.memorial WHERE id = $1', [id]);
                if (postCheck.rowCount === 0) {
                    return response.status(404).json({ message: 'Postagem não encontrada.' });
                }

                const createdTime = new Date(postCheck.rows[0].created_at);
                const fiveMinutesAgo = new Date(new Date() - (5 * 60 * 1000));
                if (createdTime < fiveMinutesAgo) {
                    return response.status(403).json({ message: 'Não é possível excluir esta postagem. O limite de 5 minutos foi excedido.' });
                }
            } else {
                console.log('Admin password valid, skipping 5-minute rule');
            }

            const query = 'DELETE FROM memorial_schema.memorial WHERE id = $1';
            const result = await client.query(query, [id]);

            if (result.rowCount === 0) {
                return response.status(404).json({ message: 'Postagem não encontrada.' });
            }

            response.status(200).json({ message: 'Postagem excluída com sucesso!' });
        } else {
            response.status(405).json({ message: 'Método não permitido' });
        }
        
        client.release();
    } catch (error) {
        console.error('Erro na API:', error);
        response.status(500).json({ message: 'Erro interno do servidor' });
    }
}
