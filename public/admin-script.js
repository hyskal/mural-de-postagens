/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 1.5: Corrigido o erro de permissão. O script agora utiliza a senha ofuscada para autenticar corretamente as ações do administrador, permitindo editar e excluir postagens a qualquer momento, sem o limite de 5 minutos.
 * Versão 1.4: Corrigido o erro Uncaught TypeError. Removida a lógica do formulário de postagem, que não pertence a esta página, e adicionada a lógica de login do painel de administração.
 * Versão 1.3: Adicionada a solução de quebra de texto (word-break: break-all;) para lidar com strings longas sem espaços no campo de descrição.
 * Versão 1.2: Ofuscação das chaves das APIs de upload de imagem para maior segurança.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado. Iniciando a lógica do script do painel de administração.');

    const API_URL = 'https://mural-de-postagens.vercel.app';
    const obfuscatedKey1 = 'DVMQEQkNDQMREwkNDBIPEQ0QERIMDAQ=';
    const obfuscatedKey2 = 'H0oGCRMQF0pGRxAXGAgQGgkVGhIVFkAG';
    const obfuscatedAdminPassword = 'JFkpJF0lJF0pJFkpJFopJFkpJF4lJFopJF8lJFslJE0=';

    function getSecureValue(obfuscated) {
        const decoded = atob(obfuscated);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ 77);
        }
        return result;
    }

    const IMG_API_CONFIGS = [
        { name: 'ImgBB - eduk', endpoint: 'https://api.imgbb.com/1/upload', key: getSecureValue(obfuscatedKey1) },
        { name: 'ImgBB - enova', endpoint: 'https://api.imgbb.com/1/upload', key: getSecureValue(obfuscatedKey2) }
    ];

    // Seletores dos elementos do DOM
    const loginModal = document.getElementById('login-modal');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const adminPage = document.getElementById('admin-page');
    const logoutBtn = document.getElementById('logout-btn');
    const postsTableBody = document.getElementById('posts-table-body');
    const editPostModal = document.getElementById('edit-post-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const editPostForm = document.getElementById('edit-post-form');

    const postsPerPage = 20;
    let currentPage = 1;

    // Função de login
    loginBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        const adminPassword = getSecureValue(obfuscatedAdminPassword);
        
        if (password === adminPassword) {
            console.log('Login bem-sucedido!');
            loginModal.style.display = 'none';
            adminPage.style.display = 'block';
            fetchPosts();
        } else {
            alert('Senha incorreta!');
        }
    });

    // Função de logout
    logoutBtn.addEventListener('click', () => {
        location.reload();
    });

    // Funções de manipulação do modal de edição
    closeEditModalBtn.addEventListener('click', () => {
        editPostModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === editPostModal) {
            editPostModal.style.display = 'none';
        }
    });

    function openEditModal(post) {
        document.getElementById('edit-post-id').value = post.id;
        document.getElementById('edit-title').value = post.title;
        document.getElementById('edit-image-url').value = post.image_url;
        document.getElementById('edit-description').value = post.description;
        document.getElementById('edit-author').value = post.author;
        document.getElementById('edit-tags').value = post.tags;
        document.getElementById('edit-created-at').value = new Date(post.created_at).toLocaleString();
        document.getElementById('edit-photo-date').value = post.photo_date.split('T')[0];
        editPostModal.style.display = 'block';
    }

    async function submitEditForm(event) {
        event.preventDefault();
        const postId = document.getElementById('edit-post-id').value;
        const title = document.getElementById('edit-title').value;
        const imageUrl = document.getElementById('edit-image-url').value;
        const description = document.getElementById('edit-description').value;
        const author = document.getElementById('edit-author').value;
        const tags = document.getElementById('edit-tags').value;
        const photoDate = document.getElementById('edit-photo-date').value;
        const adminPassword = getSecureValue(obfuscatedAdminPassword);

        const postData = {
            title,
            image_url: imageUrl,
            description,
            author,
            photo_date: photoDate,
            tags,
            color: ''
        };

        try {
            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${adminPassword}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar a postagem.');
            }

            alert('Postagem atualizada com sucesso!');
            editPostModal.style.display = 'none';
            fetchPosts();
        } catch (error) {
            console.error('Erro ao atualizar postagem:', error);
            alert(error.message);
        }
    }

    if (editPostForm) {
        editPostForm.addEventListener('submit', submitEditForm);
    }

    async function deletePost(postId) {
        const adminPassword = getSecureValue(obfuscatedAdminPassword);
        if (!confirm(`Tem certeza que deseja excluir a postagem ${postId}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${adminPassword}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao excluir a postagem.');
            }

            alert('Postagem excluída com sucesso!');
            fetchPosts();
        } catch (error) {
            console.error('Erro ao excluir postagem:', error);
            alert(error.message);
        }
    }

    // Carregar postagens e popular a tabela
    async function fetchPosts() {
        try {
            const response = await fetch(`${API_URL}/api/posts?limit=${postsPerPage}&page=${currentPage}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar postagens da API');
            }
            const data = await response.json();
            const posts = data.posts;
            postsTableBody.innerHTML = '';
            posts.forEach(post => {
                const row = postsTableBody.insertRow();
                row.innerHTML = `
                    <td>${post.id}</td>
                    <td>${post.title}</td>
                    <td>${post.author}</td>
                    <td>${new Date(post.created_at).toLocaleDateString()}</td>
                    <td>${new Date(post.photo_date).toLocaleDateString()}</td>
                    <td class="admin-buttons">
                        <button class="edit-btn" data-id="${post.id}">Editar</button>
                        <button class="delete-btn" data-id="${post.id}">Excluir</button>
                    </td>
                `;
                row.querySelector('.edit-btn').addEventListener('click', () => openEditModal(post));
                row.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id));
            });
        } catch (error) {
            console.error('Erro ao buscar postagens:', error);
            alert('Erro ao buscar postagens. Verifique sua conexão ou a API.');
        }
    }

});
