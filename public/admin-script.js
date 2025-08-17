/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 1.9: Corrigida a inconsistência de autenticação entre login e operações de editar/excluir. A senha decodificada agora é armazenada após o login bem-sucedido e reutilizada em todas as operações administrativas, garantindo que o administrador tenha acesso total sem limite de tempo.
 * Versão 1.8: Implementada a ofuscação simples Base64 para as chaves das APIs de upload de imagem, resolvendo os erros de requisição 400. Corrigido o erro de permissão. A senha do administrador agora é armazenada e reutilizada em todas as requisições (edição, exclusão), garantindo que a regra de 5 minutos não seja aplicada.
 * Versão 1.7: Corrigido o erro de permissão. A senha do administrador agora é armazenada e reutilizada em todas as requisições (edição, exclusão), garantindo que a regra de 5 minutos não seja aplicada.
 * Versão 1.6: Corrigido o erro de login. A validação de senha agora é realizada pela API de backend, o que é mais seguro e garante o acesso correto ao painel de administração.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado. Iniciando a lógica do script do painel de administração.');

    const API_URL = 'https://mural-de-postagens.vercel.app';
    const obfuscatedKey1 = 'OGMyMjNmZjljM2MyNjc4MzJjMjZhYWNiMjEwMTQ2MDI=';
    const obfuscatedKey2 = 'ZWNjMjlhYjNhNDZmOGZhODc2MWViZGVlOGExZTg1MGQ=';
    const obfuscatedAdminPassword = 'JCFzYCFsYSFzYCFsJCFvYCFjYCFrJCE=';

    // Variável para armazenar a senha decodificada após login bem-sucedido
    let validatedAdminPassword = null;

    function getSecureValue(obfuscated) {
        return atob(obfuscated);
    }
    
    function getAdminPassword() {
        const decoded = atob(obfuscatedAdminPassword);
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
        const inputPassword = passwordInput.value;
        const decodedPassword = getAdminPassword();

        console.log('🔐 Tentando fazer login...');
        console.log('🔐 Senha inserida pelo usuário:', inputPassword);
        console.log('🔐 Senha decodificada esperada:', decodedPassword);

        try {
            // Testa se a senha inserida é igual à senha decodificada
            if (inputPassword !== decodedPassword) {
                console.error('❌ Senha inserida não confere com a senha decodificada');
                alert('Senha incorreta!');
                return;
            }

            // Testa a autenticação com o backend
            const response = await fetch(`${API_URL}/api/posts?admin_password=${encodeURIComponent(decodedPassword)}`);
            console.log('🔐 Resposta do servidor de autenticação:', response.status);
            
            if (response.ok) {
                console.log('✅ Login bem-sucedido!');
                // Armazena a senha decodificada validada para uso posterior
                validatedAdminPassword = decodedPassword;
                loginModal.style.display = 'none';
                adminPage.style.display = 'block';
                fetchPosts();
            } else {
                console.error('❌ Falha na autenticação com o servidor');
                alert('Erro de autenticação com o servidor!');
            }
        } catch (error) {
            console.error('❌ Erro ao verificar senha:', error);
            alert('Erro ao tentar fazer login. Tente novamente.');
        }
    });

    // Função de logout
    logoutBtn.addEventListener('click', () => {
        validatedAdminPassword = null; // Limpa a senha armazenada
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
        
        if (!validatedAdminPassword) {
            console.error('❌ Senha de administrador não está disponível');
            alert('Erro: Sessão administrativa inválida. Faça login novamente.');
            return;
        }

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

        console.log('📝 Tentando editar postagem:', postId);
        console.log('🔐 Usando senha validada do administrador');

        try {
            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${encodeURIComponent(validatedAdminPassword)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });

            console.log('📝 Resposta da edição:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Erro na resposta:', errorData);
                throw new Error(errorData.message || 'Erro ao atualizar a postagem.');
            }

            console.log('✅ Postagem editada com sucesso');
            alert('Postagem atualizada com sucesso!');
            editPostModal.style.display = 'none';
            fetchPosts();
        } catch (error) {
            console.error('❌ Erro ao atualizar postagem:', error);
            alert(error.message);
        }
    }

    if (editPostForm) {
        editPostForm.addEventListener('submit', submitEditForm);
    }

    async function deletePost(postId) {
        if (!validatedAdminPassword) {
            console.error('❌ Senha de administrador não está disponível');
            alert('Erro: Sessão administrativa inválida. Faça login novamente.');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir a postagem ${postId}?`)) {
            return;
        }

        console.log('🗑️ Tentando excluir postagem:', postId);
        console.log('🔐 Usando senha validada do administrador');

        try {
            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${encodeURIComponent(validatedAdminPassword)}`, {
                method: 'DELETE'
            });

            console.log('🗑️ Resposta da exclusão:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Erro na resposta:', errorData);
                throw new Error(errorData.message || 'Erro ao excluir a postagem.');
            }

            console.log('✅ Postagem excluída com sucesso');
            alert('Postagem excluída com sucesso!');
            fetchPosts();
        } catch (error) {
            console.error('❌ Erro ao excluir postagem:', error);
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
            console.log('📋 Postagens carregadas na tabela administrativa');
        } catch (error) {
            console.error('❌ Erro ao buscar postagens:', error);
            alert('Erro ao buscar postagens. Verifique sua conexão ou a API.');
        }
    }
});
