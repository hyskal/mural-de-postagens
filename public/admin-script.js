/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 2.2: Simplificação da interface de confirmação de senha usando popup nativo (prompt) ao invés de modal customizado. Interface mais minimalista e direta.
 * Versão 2.1: Limpeza de logs sensíveis à segurança, mantendo apenas logs essenciais de controle.
 * Versão 2.0: Implementado modal de confirmação de senha admin para operações críticas (editar/excluir).
 * Versão 1.9: Refatoração do script de administração para usar a senha decodificada diretamente nas chamadas de API.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado. Iniciando a lógica do script do painel de administração.');

    const API_URL = 'https://mural-de-postagens.vercel.app';
    const obfuscatedKey1 = 'OGMyMjNmZjljM2MyNjc4MzJjMjZhYWNiMjEwMTQ2MDI=';
    const obfuscatedKey2 = 'ZWNjMjlhYjNhNDZmOGZhODc2MWViZGVlOGExZTg1MGQ=';
    const obfuscatedAdminPassword = 'JFkpJF0lJF0pJFkpJFopJFkpJF4lJFopJF8lJFslJE0=';

    function getSecureValue(obfuscated) {
        return atob(obfuscated);
    }
    
    function getAdminPassword() {
        // Senha de administrador para operações privilegiadas
        return 'muralunlock';
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

    // ========== FUNÇÃO MINIMALISTA DE CONFIRMAÇÃO ==========
    function showPasswordConfirm() {
        return new Promise((resolve, reject) => {
            const enteredPassword = prompt('🔒 Digite a senha de administrador para confirmar:');
            
            if (enteredPassword === null) {
                // Usuário cancelou
                reject(new Error('Operação cancelada pelo usuário'));
                return;
            }
            
            const correctPassword = getAdminPassword();
            
            if (enteredPassword === correctPassword) {
                console.log('✅ Acesso admin confirmado');
                resolve(correctPassword);
            } else {
                console.log('❌ Tentativa de acesso com senha incorreta');
                alert('❌ Senha incorreta!');
                reject(new Error('Senha incorreta'));
            }
        });
    }
    // ========================================================

    // Função de login (inalterada)
    loginBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        const decodedPassword = getAdminPassword();

        try {
            const response = await fetch(`${API_URL}/api/posts?admin_password=${decodedPassword}`);
            if (response.ok) {
                console.log('Login bem-sucedido!');
                loginModal.style.display = 'none';
                adminPage.style.display = 'block';
                fetchPosts();
            } else {
                alert('Senha incorreta!');
            }
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            alert('Erro ao tentar fazer login. Tente novamente.');
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

    // NOVA FUNÇÃO DE EDIÇÃO COM CONFIRMAÇÃO DE SENHA
    async function submitEditForm(event) {
        event.preventDefault();
        
        try {
            // Solicitar confirmação de senha
            const adminPassword = await showPasswordConfirm();
            
            const postId = document.getElementById('edit-post-id').value;
            const title = document.getElementById('edit-title').value;
            const imageUrl = document.getElementById('edit-image-url').value;
            const description = document.getElementById('edit-description').value;
            const author = document.getElementById('edit-author').value;
            const tags = document.getElementById('edit-tags').value;
            const photoDate = document.getElementById('edit-photo-date').value;

            const postData = {
                title,
                image_url: imageUrl,
                description,
                author,
                photo_date: photoDate,
                tags,
                color: ''
            };

            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${encodeURIComponent(adminPassword)}`, {
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
            if (error.message !== 'Operação cancelada pelo usuário') {
                console.error('Erro ao atualizar postagem:', error);
                alert(error.message);
            }
        }
    }

    if (editPostForm) {
        editPostForm.addEventListener('submit', submitEditForm);
    }

    // NOVA FUNÇÃO DE EXCLUSÃO COM CONFIRMAÇÃO DE SENHA
    async function deletePost(postId) {
        if (!confirm(`Tem certeza que deseja excluir a postagem ${postId}?`)) {
            return;
        }

        try {
            // Solicitar confirmação de senha
            const adminPassword = await showPasswordConfirm();

            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${encodeURIComponent(adminPassword)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao excluir a postagem.');
            }

            alert('Postagem excluída com sucesso!');
            fetchPosts();
            
        } catch (error) {
            if (error.message !== 'Operação cancelada pelo usuário') {
                console.error('Erro ao excluir postagem:', error);
                alert(error.message);
            }
        }
    }

    // Carregar postagens e popular a tabela (inalterada)
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
