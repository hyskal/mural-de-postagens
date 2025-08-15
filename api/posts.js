const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEON_CONNECTION_STRING,
});

export default async function handler(request, response) {
    try {
        const client = await pool.connect();

        if (request.method === 'GET') {
            const { searchTerm = '', sortBy = 'post_date', sortOrder = 'desc', limit = 20, page = 1 } = request.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Construção da consulta SQL com filtros e paginação
            let whereClause = '';
            const queryParams = [];
            
            if (searchTerm) {
                // Lógica de pesquisa por tags (ex: tag:coleta)
                if (searchTerm.startsWith('tag:')) {
                    const tag = searchTerm.substring(4);
                    whereClause = 'WHERE tags ILIKE $1';
                    queryParams.push(`%${tag}%`);
                } else {
                    // Pesquisa por título, autor e descrição
                    whereClause = 'WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1';
                    queryParams.push(`%${searchTerm}%`);
                }
            }
            
            // Consulta para o total de postagens (para a paginação)
            const totalQuery = `SELECT COUNT(*) FROM memorial_schema.memorial ${whereClause}`;
            const totalResult = await client.query(totalQuery, queryParams);
            const totalPosts = parseInt(totalResult.rows[0].count);

            const allowedSortBy = ['post_date', 'title', 'author'];
            const allowedSortOrder = ['asc', 'desc'];
            
            const sanitizedSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'post_date';
            const sanitizedSortOrder = allowedSortOrder.includes(sortOrder) ? sortOrder : 'desc';

            const dataQuery = `
                SELECT * FROM memorial_schema.memorial
                ${whereClause}
                ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `;
            
            queryParams.push(limit, offset);
            
            const { rows: posts } = await client.query(dataQuery, queryParams);
            response.status(200).json({ posts, total: totalPosts });

        } else if (request.method === 'POST') {
            const { title, image_url, description, author, post_date, tags } = request.body;
            const query = `
                INSERT INTO memorial_schema.memorial (title, image_url, description, author, post_date, tags)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await client.query(query, [title, image_url, description, author, post_date, tags]);
            response.status(201).json({ message: 'Postagem criada com sucesso!' });
        } else if (request.method === 'DELETE') {
            const postId = request.query.id;
            if (!postId) {
                return response.status(400).json({ message: 'ID da postagem não fornecido.' });
            }
            const query = 'DELETE FROM memorial_schema.memorial WHERE id = $1';
            const result = await client.query(query, [postId]);

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