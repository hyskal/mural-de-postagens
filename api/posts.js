/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 1.6: Versão DEBUG com logs extensivos para diagnosticar problema de autenticação. Logs detalhados de comparação de senhas, decodificação de URL, e validação de deployment. Esta versão será revertida após identificar o problema.
 * Versão 1.5: Correção crítica na validação da senha de administrador. Implementada função isValidAdminPassword() com decodificação adequada de URL encoding para resolver o problema de autenticação no painel de administração.
 * Versão 1.4: Refatoração da lógica de PUT e DELETE para remover a restrição de 5 minutos para o administrador. Agora, a regra é aplicada apenas se a senha de admin não for fornecida ou estiver incorreta, garantindo que o acesso do painel de administração tenha controle total sobre as postagens.
 * Versão 1.3: Adicionada a função getSecurePassword() para ofuscar a senha do administrador, substituindo o método de senha dinâmica para maior segurança.
 */
const { Pool } = require('pg');

// ====== DEBUG VERSION TIMESTAMP ======
console.log('🚀 API Posts.js carregado em:', new Date().toISOString());
console.log('🔧 Versão DEBUG 1.6 ativa');
// =====================================

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
    console.log('🔑 Senha esperada gerada (primeiros 3 chars):', result.substring(0, 3));
    return result;
}

// Função para validar senha de administrador com DEBUG COMPLETO
function isValidAdminPassword(providedPassword) {
    console.log('🛡️ === VALIDAÇÃO DE SENHA INICIADA ===');
    console.log('📥 Senha recebida:', providedPassword);
    console.log('📥 Tipo da senha:', typeof providedPassword);
    console.log('📥 Length senha recebida:', providedPassword?.length);
    
    if (!providedPassword) {
        console.log('❌ Senha não fornecida');
        return false;
    }
    
    const expectedPassword = getSecurePassword();
    console.log('🔑 Senha esperada (primeiros 3 chars):', expectedPassword.substring(0, 3));
    console.log('🔑 Length senha esperada:', expectedPassword.length);
    
    // Teste 1: Comparação direta
    const directMatch = providedPassword === expectedPassword;
    console.log('🔍 Teste 1 - Comparação direta:', directMatch);
    
    // Teste 2: Decodificação de URL
    let decodedPassword = providedPassword;
    try {
        decodedPassword = decodeURIComponent(providedPassword);
        console.log('🔄 URL decodificada:', decodedPassword);
        console.log('🔄 Primeiros 3 chars decodificados:', decodedPassword.substring(0, 3));
        console.log('🔄 Length decodificada:', decodedPassword.length);
    } catch (error) {
        console.log('⚠️ Erro na decodificação de URL:', error.message);
    }
    
    const urlDecodedMatch = decodedPassword === expectedPassword;
    console.log('🔍 Teste 2 - Após decode URL:', urlDecodedMatch);
    
    // Teste 3: Comparação com trim
    const trimmedMatch = decodedPassword.trim() === expectedPassword.trim();
    console.log('🔍 Teste 3 - Com trim:', trimmedMatch);
    
    // Teste 4: Comparação byte por byte
    if (decodedPassword.length === expectedPassword.length) {
        let bytesMatch = true;
        for (let i = 0; i < decodedPassword.length; i++) {
            if (decodedPassword.charCodeAt(i) !== expectedPassword.charCodeAt(i)) {
                console.log(`🔍 Byte ${i} diferente: ${decodedPassword.charCodeAt(i)} vs ${expectedPassword.charCodeAt(i)}`);
                bytesMatch = false;
                break;
            }
        }
        console.log('🔍 Teste 4 - Bytes match:', bytesMatch);
    } else {
        console.log('🔍 Teste 4 - Tamanhos diferentes, pulando comparação byte por byte');
    }
    
    const finalResult = directMatch || urlDecodedMatch || trimmedMatch;
    console.log('✅ Resultado final:', finalResult);
    console.log('🛡️ === VALIDAÇÃO DE SENHA FINALIZADA ===');
    
    return finalResult;
}

export default async function handler(request, response) {
    console.log(`📡 ${request.method} ${request.url} - ${new Date().toISOString()}`);
    
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
            console.log('🔄 Processando PUT request');
            const { id } = request.query;
            const { title, image_url, description, author, photo_date, tags, color } = request.body;
            const adminPassword = request.query.admin_password;

            console.log('🆔 Post ID:', id);
            console.log('🔐 Admin password presente:', !!adminPassword);

            // USAR A NOVA FUNÇÃO DE VALIDAÇÃO
            const isValidAdmin = isValidAdminPassword(adminPassword);
            
            if (!isValidAdmin) {
                console.log('❌ Senha inválida - aplicando regra de 5 minutos');
                const postCheck = await client.query('SELECT created_at FROM memorial_schema.memorial WHERE id = $1', [id]);
                if (postCheck.rowCount === 0) {
                    console.log('❌ Post não encontrado');
                    return response.status(404).json({ message: 'Postagem não encontrada.' });
                }
    
                const createdTime = new Date(postCheck.rows[0].created_at);
                const fiveMinutesAgo = new Date(new Date() - (5 * 60 * 1000));
                
                console.log('⏰ Created time:', createdTime.toISOString());
                console.log('⏰ Five minutes ago:', fiveMinutesAgo.toISOString());
                console.log('⏰ Is older than 5 min:', createdTime < fiveMinutesAgo);
                
                if (createdTime < fiveMinutesAgo) {
                    console.log('🚫 Bloqueado por limite de tempo');
                    return response.status(403).json({ message: 'Não é possível editar esta postagem. O limite de 5 minutos foi excedido.' });
                }
            } else {
                console.log('✅ Admin autenticado - pulando verificação de tempo');
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
            console.log('✅ PUT executado com sucesso');
            response.status(200).json({ message: 'Postagem atualizada com sucesso!' });

        } else if (request.method === 'DELETE') {
            console.log('🗑️ Processando DELETE request');
            const { id } = request.query;
            const adminPassword = request.query.admin_password;
            
            console.log('🆔 Post ID:', id);
            console.log('🔐 Admin password presente:', !!adminPassword);
            
            // USAR A NOVA FUNÇÃO DE VALIDAÇÃO
            const isValidAdmin = isValidAdminPassword(adminPassword);
            
            if (!isValidAdmin) {
                console.log('❌ Senha inválida - aplicando regra de 5 minutos');
                const postCheck = await client.query('SELECT created_at FROM memorial_schema.memorial WHERE id = $1', [id]);
                if (postCheck.rowCount === 0) {
                    console.log('❌ Post não encontrado');
                    return response.status(404).json({ message: 'Postagem não encontrada.' });
                }

                const createdTime = new Date(postCheck.rows[0].created_at);
                const fiveMinutesAgo = new Date(new Date() - (5 * 60 * 1000));
                
                console.log('⏰ Created time:', createdTime.toISOString());
                console.log('⏰ Five minutes ago:', fiveMinutesAgo.toISOString());
                console.log('⏰ Is older than 5 min:', createdTime < fiveMinutesAgo);
                
                if (createdTime < fiveMinutesAgo) {
                    console.log('🚫 Bloqueado por limite de tempo');
                    return response.status(403).json({ message: 'Não é possível excluir esta postagem. O limite de 5 minutos foi excedido.' });
                }
            } else {
                console.log('✅ Admin autenticado - pulando verificação de tempo');
            }

            const query = 'DELETE FROM memorial_schema.memorial WHERE id = $1';
            const result = await client.query(query, [id]);

            if (result.rowCount === 0) {
                console.log('❌ Post não encontrado para exclusão');
                return response.status(404).json({ message: 'Postagem não encontrada.' });
            }

            console.log('✅ DELETE executado com sucesso');
            response.status(200).json({ message: 'Postagem excluída com sucesso!' });
        } else {
            response.status(405).json({ message: 'Método não permitido' });
        }
        
        client.release();
    } catch (error) {
        console.error('💥 Erro na API:', error);
        response.status(500).json({ message: 'Erro interno do servidor' });
    }
}
