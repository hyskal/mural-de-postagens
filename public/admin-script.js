document.addEventListener('DOMContentLoaded', () => {
    console.log('Script de administração carregado.');

    const API_URL = 'https://mural-de-postagens.vercel.app';
    
    // Seletores do DOM para o painel de administração
    const passwordContainer = document.getElementById('password-container');
    const adminPasswordInput = document.getElementById('admin-password');
    const accessBtn = document.getElementById('access-btn');
    const muralContainer = document.getElementById('mural-container');

    // Funções de Autenticação
    function getCurrentTimePassword() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        // Senha agora é 'mural' + 'hh' + 'mm'
        return `mural${hours}${minutes}`;
    }

    function checkPassword() {
        const correctPassword = getCurrentTimePassword();
        const enteredPassword = adminPasswordInput.value;
        if (enteredPassword === correctPassword) {
            console.log('Senha correta. Acesso concedido.');
            passwordContainer.style.display = 'none';
            muralContainer.classList.remove('hidden');
            fetchPosts();
        } else {
            console.log('Senha incorreta.');
            alert('Senha incorreta. Tente novamente.');
        }
    }

    accessBtn.addEventListener('click', checkPassword);
    adminPasswordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });

    // Funções para manipulação das postagens
    async function fetchPosts() {
        console.log('Buscando postagens para o painel de administração...');
        try {
            const response = await fetch(`${API_URL}/api/posts`);
            if (!response.ok) {
                throw new Error('Erro ao buscar postagens da API');
            }
            const posts = await response.json();
            console.log('Postagens carregadas com sucesso:', posts);
            displayPosts(posts);
        } catch (error) {
            console.error('Erro ao buscar postagens:', error);
            alert('Não foi possível carregar as postagens.');
        }
    }

    function displayPosts(posts) {
        muralContainer.innerHTML = '';
        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.classList.add('post-card');
            postCard.innerHTML = `
                <h3 class="post-title">${post.title}</h3>
                <p class="post-description">${post.description}</p>
                <div class="post-meta">
                    <span class="post-author">Autor: ${post.author}</span>
                    <span class="post-date">Data: ${post.post_date}</span>
                </div>
                <button class="delete-btn" data-id="${post.id}">Excluir</button>
            `;
            muralContainer.appendChild(postCard);
        });

        // Adiciona event listeners aos botões de exclusão
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', deletePost);
        });
    }

    async function deletePost(event) {
        const postId = event.target.dataset.id;
        if (!confirm(`Tem certeza que deseja excluir a postagem com ID ${postId}?`)) {
            return;
        }

        console.log(`Solicitando exclusão da postagem com ID: ${postId}`);
        try {
            const response = await fetch(`${API_URL}/api/posts?id=${postId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir a postagem');
            }

            console.log('Postagem excluída com sucesso!');
            // Recarrega as postagens após a exclusão
            fetchPosts();
        } catch (error) {
            console.error('Erro ao excluir a postagem:', error);
            alert('Erro ao excluir a postagem. Tente novamente.');
        }
    }
});