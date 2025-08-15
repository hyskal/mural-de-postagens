document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://mural-de-postagens.vercel.app';
    
    // Função para obter a senha dinâmica (hora e minuto atuais)
    const getDynamicPassword = () => {
        const date = new Date();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `mural${hours}${minutes}`;
    };

    // Seletores de elementos
    const loginModal = document.getElementById('login-modal');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const adminPage = document.getElementById('admin-page');
    const postsTableBody = document.getElementById('posts-table-body');
    const logoutBtn = document.getElementById('logout-btn');

    const editPostModal = document.getElementById('edit-post-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const editPostForm = document.getElementById('edit-post-form');
    const editPostId = document.getElementById('edit-post-id');
    const editTitle = document.getElementById('edit-title');
    const editImageUrl = document.getElementById('edit-image-url');
    const editDescription = document.getElementById('edit-description');
    const editAuthor = document.getElementById('edit-author');
    const editTags = document.getElementById('edit-tags');
    const editPhotoDate = document.getElementById('edit-photo-date');

    // Validação de senha
    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === getDynamicPassword()) {
            loginModal.style.display = 'none';
            adminPage.style.display = 'block';
            fetchPosts();
        } else {
            alert('Senha incorreta!');
            passwordInput.value = '';
        }
    });

    logoutBtn.addEventListener('click', () => {
        adminPage.style.display = 'none';
        loginModal.style.display = 'flex';
        passwordInput.value = '';
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

    // Função para carregar as postagens
    async function fetchPosts() {
        try {
            const response = await fetch(`${API_URL}/api/posts`);
            if (!response.ok) {
                throw new Error('Erro ao buscar postagens da API');
            }
            const data = await response.json();
            const posts = data.posts;
            
            postsTableBody.innerHTML = '';
            posts.forEach(post => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${post.id.substring(0, 8)}...</td>
                    <td>${post.title}</td>
                    <td>${post.author}</td>
                    <td>${post.created_at ? post.created_at.split('T')[0] : ''}</td>
                    <td>${post.photo_date ? post.photo_date.split('T')[0] : ''}</td>
                    <td>
                        <button class="edit-btn" data-id="${post.id}">Editar</button>
                        <button class="delete-btn" data-id="${post.id}">Excluir</button>
                    </td>
                `;
                postsTableBody.appendChild(row);
            });

            // Adiciona eventos aos botões de ação
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const postId = e.target.dataset.id;
                    const postToEdit = posts.find(p => p.id === postId);
                    openEditModal(postToEdit);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const postId = e.target.dataset.id;
                    if (confirm(`Tem certeza que deseja excluir a postagem com ID: ${postId}?`)) {
                        deletePost(postId);
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao buscar postagens:', error);
            alert('Erro ao buscar postagens. Verifique sua conexão ou a API.');
        }
    }

    function openEditModal(post) {
        editPostId.value = post.id;
        editTitle.value = post.title;
        editImageUrl.value = post.image_url;
        editDescription.value = post.description;
        editAuthor.value = post.author;
        editTags.value = post.tags;
        // Adiciona um tratamento para valores nulos antes de chamar split()
        editPhotoDate.value = post.photo_date ? post.photo_date.split('T')[0] : '';
        editPostModal.style.display = 'block';
    }

    // Evento de envio do formulário de edição
    editPostForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const postId = editPostId.value;
        const postData = {
            title: editTitle.value,
            image_url: editImageUrl.value,
            description: editDescription.value,
            author: editAuthor.value,
            tags: editTags.value,
            photo_date: editPhotoDate.value,
        };

        try {
            const dynamicPassword = getDynamicPassword();
            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${dynamicPassword}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar as alterações da postagem');
            }

            alert('Postagem atualizada com sucesso!');
            editPostModal.style.display = 'none';
            fetchPosts();
        } catch (error) {
            console.error('Erro ao atualizar postagem:', error);
            alert('Erro ao salvar as alterações. Tente novamente.');
        }
    });

    // Função para excluir postagem
    async function deletePost(postId) {
        try {
            const dynamicPassword = getDynamicPassword();
            const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${dynamicPassword}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir a postagem');
            }

            alert('Postagem excluída com sucesso!');
            fetchPosts();
        } catch (error) {
            console.error('Erro ao excluir postagem:', error);
            alert('Erro ao excluir a postagem. Tente novamente.');
        }
    }
});
