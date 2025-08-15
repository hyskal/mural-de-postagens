const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEON_CONNECTION_STRING,
});

export default async function handler(request, response) {
    try {
        const client = await pool.connect();

        if (request.method === 'GET') {
            const { rows } = await client.query('SELECT * FROM memorial_schema.memorial ORDER BY post_date DESC');
            response.status(200).json(rows);
        } else if (request.method === 'POST') {
            const { title, image_url, description, author, post_date } = request.body;
            const query = `
                INSERT INTO memorial_schema.memorial (title, image_url, description, author, post_date)
                VALUES ($1, $2, $3, $4, $5)
            `;
            await client.query(query, [title, image_url, description, author, post_date]);
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