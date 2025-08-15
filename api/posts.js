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
                if (