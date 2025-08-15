document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado. Iniciando a lógica do script.');

    const API_URL = 'https://mural-de-postagens.vercel.app';
    const IMG_BB_API_KEY = '416fe9a25d249378346cacff72f7ef2d';
    const EDIT_TIME_LIMIT_MINUTES = 5;
    const LIMIT_DESCRIPTION = 300; // Limite de caracteres para o formulário de postagem
    const DISPLAY_LIMIT_DESCRIPTION = 100; // Limite de caracteres para exibição no mural
    const LIMIT_TITLE = 120;

    // Estado da paginação
    let currentPage = 1;
    const postsPerPage = 20;
    let totalPosts = 0;

    // Seletores de elementos do DOM
    const openModalBtn = document.getElementById('open-post-modal');
    const newPostModal = document.getElementById('new-post-modal');
    const closeModalBtn = document.getElementById('close-post-modal');
    const postForm = document.getElementById('post-form');
    const muralContainer = document.getElementById('mural-container');
    const enlargedImageModal = document.getElementById('enlarged-image-modal');
    const enlargedImage = document.getElementById('enlarged-image');
    const closeEnlargedImageBtn = document.getElementById('close-enlarged-image-modal');
    
    // Controles de pesquisa e ordenação
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');

    // Controles de paginação
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');

    // Elementos do loading
    const loadingModal = document.getElementById('loading-modal');
    const loadingBarFill = document.querySelector('.loading-bar-fill');
    const loadingPercent = document.getElementById('loading-percent');
    const loadingStatus = document.getElementById('loading-status');

    // Seletor de cores
    const colorSwatches = document.querySelectorAll('.color-selector .color-swatch');

    // Funções de manipulação dos modais
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            console.log('Botão "Nova Postagem" clicado. Exibindo modal.');
            newPostModal.style.display = 'block';
            resetPostModal();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('Botão de fechar modal clicado. Ocultando modal.');
            newPostModal.style.display = 'none';
            postForm.reset();
        });
    }

    if (closeEnlargedImageBtn) {
        closeEnlargedImageBtn.addEventListener('click', () => {
            console.log('Botão de fechar imagem ampliada clicado. Ocultando modal.');
            enlargedImageModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === newPostModal) {
            console.log('Clique fora do modal de postagem. Ocultando modal.');
            newPostModal.style.display = 'none';
            postForm.reset();
        }
        if (event.target === enlargedImageModal) {
            console.log('Clique fora do modal de imagem ampliada. Ocultando modal.');
            enlargedImageModal.style.display = 'none';
        }
    });

    function resetPostModal() {
        document.getElementById('modal-title').textContent = 'Nova Postagem';
        document.getElementById('submit-post-btn').textContent = 'Postar';
        document.getElementById('post-id').value = '';
        document.getElementById('post-image').required = true;
        document.getElementById('image-info').style.display = 'none';
        postForm.style.display = 'block';
        loadingModal.classList.add('hidden');
        postForm.reset();
    }

    // Funções do loading modal
    function showLoading() {
        postForm.style.display = 'none';
        loadingModal.classList.remove('hidden');
        updateLoading(0, 'Iniciando...');
    }

    function updateLoading(percent, status) {
        loadingBarFill.style.width = `${percent}%`;
        loadingPercent.textContent = `${percent}%`;
        loadingStatus.textContent = status;
    }

    // Função assíncrona para upload de imagem no ImgBB
    async function uploadImage(imageFile) {
        if (!imageFile) {
            console.warn('Nenhum arquivo de imagem selecionado.');
            return null;
        }

        const formData = new FormData();
        formData.append('image', imageFile);
        console.log('FormData preparado para envio.');

        try {
            updateLoading(30, 'Fazendo upload da imagem...');
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error('Falha na resposta do ImgBB. Status:', response.status, 'Status Text:', response.statusText);
                throw new Error('Erro no upload da imagem para o ImgBB');
            }

            const data = await response.json();
            console.log('Upload bem-sucedido. URL da imagem:', data.data.url);
            updateLoading(60, 'Imagem enviada. Publicando no mural...');
            return data.data.url;
        } catch (error) {
            console.error('Erro durante o upload:', error);
            alert('Erro ao enviar a imagem. Por favor, tente novamente.');
            return null;
        }
    }
    
    // Função para formatar a data para o formato dd-mm-aaaa
    const formatarDataExibicao = (data) => {
        if (!data) return 'N/A';
        const partes = data.split('T')[0].split('-');
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    };

    // Função para criar o elemento de postagem e adicioná-lo ao mural
    function createPostElement(post) {
        console.log('Criando novo elemento de postagem com os dados:', post);
        const postCard = document.createElement('div');
        postCard.classList.add('post-card');
        
        postCard.style.backgroundColor = post.color || 'rgba(255, 255, 255, 0.8)';

        // Lógica para limitar a descrição para exibição (100 caracteres)
        let descriptionText = post.description;
        if (descriptionText && descriptionText.length > DISPLAY_LIMIT_DESCRIPTION) {
            descriptionText = descriptionText.substring(0, DISPLAY_LIMIT_DESCRIPTION) + '... <a href="#" class="read-more" data-fulltext="' + post.description.replace(/"/g, '&quot;') + '">Leia Mais</a>';
        }
        
        // Exibição de tags
        let tagsHtml = '';
        if (post.tags) {
            const tagsArray = post.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            tagsHtml = '<div class="post-tags">' + tagsArray.map(tag => `<span>#${tag}</span>`).join('') + '</div>';
        }

        const createdPostId = localStorage.getItem('createdPostId');
        const createdAt = localStorage.getItem('createdPostTime');
        
        // Log de depuração
        console.log(`Verificando post ID: ${post.id}`);
        console.log(`ID do post no localStorage: ${createdPostId}`);
        console.log(`Data do post no localStorage: ${createdAt}`);

        const isEditable = createdPostId === post.id && (new Date() - new Date(createdAt)) < (EDIT_TIME_LIMIT_MINUTES * 60 * 1000);
        
        // Log de depuração
        console.log(`isEditable: ${isEditable}`);
        
        const editDeleteButtons = isEditable ? `
            <div class="edit-delete-buttons">
                <button class="edit-btn" data-id="${post.id}">Editar</button>
                <button class="delete-btn" data-id="${post.id}">Excluir</button>
            </div>
        ` : '';

        const formattedPostDate = formatarDataExibicao(post.created_at);
        const formattedPhotoDate = formatarDataExibicao(post.photo_date);

        postCard.innerHTML = `
            <h3 class="post-title">${post.title}</h3>
            <div class="post-image-container">
                <img src="${post.image_url}" alt="${post.title}" class="post-image" onclick="enlargeImage('${post.image_url}')">
            </div>
            <p class="post-description">${descriptionText}</p>
            ${tagsHtml}
            <div class="post-meta">
                <span class="post-author">Autor: ${post.author}</span>
                <span class="post-date">Data da Foto: ${formattedPhotoDate}</span>
                <span class="post-date">Data da Postagem: ${formattedPostDate}</span>
            </div>
            ${editDeleteButtons}
        `;
        muralContainer.appendChild(postCard);

        // Adiciona evento para o "Leia Mais"
        const readMoreBtn = postCard.querySelector('.read-more');
        if (readMoreBtn) {
            readMoreBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.target.parentNode.textContent = event.target.dataset.fulltext;
            });
        }
        
        // Adiciona evento para o clique nas tags
        postCard.querySelectorAll('.post-tags span').forEach(tagSpan => {
            tagSpan.addEventListener('click', (event) => {
                searchInput.value = `tag:${event.target.textContent.substring(1)}`;
                fetchPosts();
            });
        });

        // Adiciona eventos para os botões de editar e excluir
        if (isEditable) {
            postCard.querySelector('.edit-btn').addEventListener('click', () => openEditModal(post));
            postCard.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id, post.created_at));
        }
    }

    function openEditModal(post) {
        document.getElementById('modal-title').textContent = 'Editar Postagem';
        document.getElementById('submit-post-btn').textContent = 'Salvar Alterações';
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-description').value = post.description;
        document.getElementById('post-author').value = post.author;
        document.getElementById('post-tags').value = post.tags;
        document.getElementById('photo-date').value = post.photo_date ? post.photo_date.split('T')[0] : '';
        document.getElementById('post-image').required = false;
        document.getElementById('image-info').style.display = 'block';

        colorSwatches.forEach(swatch => {
            swatch.classList.remove('selected');
            if (swatch.dataset.color === post.color) {
                swatch.classList.add('selected');
            }
        });

        newPostModal.style.display = 'block';
    }

    // Função para carregar as postagens da nova API
    async function fetchPosts() {
        console.log('Buscando postagens da nova API...');
        
        const sortBy = sortBySelect.value;
        const sortOrder = sortOrderSelect.value;
        const searchTerm = searchInput.value;
        
        const queryParams = new URLSearchParams({
            limit: postsPerPage,
            page: currentPage,
            sortBy,
            sortOrder,
            searchTerm
        });

        try {
            const response = await fetch(`${API_URL}/api/posts?${queryParams}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar postagens da API');
            }
            const data = await response.json();
            const posts = data.posts;
            totalPosts = data.total;
            
            console.log('Postagens carregadas com sucesso:', posts);
            muralContainer.innerHTML = '';
            posts.forEach(post => createPostElement(post));
            
            updatePaginationControls();

        } catch (error) {
            console.error('Erro ao buscar postagens:', error);
            alert('Erro ao buscar postagens. Verifique sua conexão ou a API.');
        }
    }
    
    function updatePaginationControls() {
        pageInfoSpan.textContent = `Página ${currentPage} de ${Math.ceil(totalPosts / postsPerPage)}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage * postsPerPage >= totalPosts;
    }

    // Eventos de pesquisa, ordenação e paginação
    searchBtn.addEventListener('click', () => {
        currentPage = 1;
        fetchPosts();
    });
    sortBySelect.addEventListener('change', () => {
        currentPage = 1;
        fetchPosts();
    });
    sortOrderSelect.addEventListener('change', () => {
        currentPage = 1;
        fetchPosts();
    });
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPosts();
        }
    });
    nextPageBtn.addEventListener('click', () => {
        if (currentPage * postsPerPage < totalPosts) {
            currentPage++;
            fetchPosts();
        }
    });

    // Evento de seleção de cor
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
    });

    // Evento de envio do formulário
    if (postForm) {
        postForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const postId = document.getElementById('post-id').value;
            const title = document.getElementById('post-title').value;
            const description = document.getElementById('post-description').value;
            const author = document.getElementById('post-author').value;
            const photoDate = document.getElementById('photo-date').value;
            const tags = document.getElementById('post-tags').value;
            const imageFile = document.getElementById('post-image').files[0];
            const selectedColor = document.querySelector('.color-swatch.selected').dataset.color;

            if (!title || !description || !author || !photoDate) {
                console.warn('Alguns campos do formulário estão vazios.');
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            if (title.length > LIMIT_TITLE) {
                alert(`O título deve ter no máximo ${LIMIT_TITLE} caracteres.`);
                return;
            }
            // A validação do formulário deve ser feita com o limite de 300 caracteres
            if (description.length > LIMIT_DESCRIPTION) {
                alert(`A descrição deve ter no máximo ${LIMIT_DESCRIPTION} caracteres.`);
                return;
            }
            
            // Validação de data futura
            const today = new Date().toISOString().split('T')[0];
            if (photoDate > today) {
                alert('A data da foto não pode ser futura.');
                return;
            }

            showLoading();
            
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
                if (!imageUrl) {
                    loadingModal.classList.add('hidden');
                    postForm.style.display = 'block';
                    return;
                }
            }

            const postData = {
                title,
                image_url: imageUrl,
                description,
                author,
                photo_date: photoDate,
                tags,
                color: selectedColor
            };
            
            const method = postId ? 'PUT' : 'POST';
            const endpoint = postId ? `${API_URL}/api/posts?id=${postId}` : `${API_URL}/api/posts`;
            
            try {
                updateLoading(80, 'Conectando ao banco de dados...');
                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(postData)
                });

                if (!response.ok) {
                    throw new Error('Erro ao salvar a postagem na API');
                }
                
                const result = await response.json();

                // Log de depuração
                console.log('Postagem criada com sucesso. Dados do servidor:', result);

                // Salva o ID e a data de criação no localStorage para permitir edição temporária
                localStorage.setItem('createdPostId', result.id);
                localStorage.setItem('createdPostTime', result.created_at);

                updateLoading(100, 'Publicando...');
                setTimeout(() => {
                    alert('Postagem realizada com sucesso!');
                    window.location.reload();
                }, 1000);
            } catch (error) {
                console.error('Erro ao salvar a postagem na API:', error);
                alert('Erro ao salvar a postagem. Tente novamente.');
                loadingModal.classList.add('hidden');
                postForm.style.display = 'block';
            }
        });
    }

    async function deletePost(postId, createdAt) {
        const fiveMinutesAgo = new Date(new Date() - (EDIT_TIME_LIMIT_MINUTES * 60 * 1000));
        if (new Date(createdAt) < fiveMinutesAgo) {
            alert('Não é possível excluir esta postagem. O limite de 5 minutos foi excedido.');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir a postagem?`)) {
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
            localStorage.removeItem('createdPostId');
            localStorage.removeItem('createdPostTime');
            fetchPosts();
        } catch (error) {
            console.error('Erro ao excluir postagem:', error);
            alert('Erro ao excluir a postagem. Tente novamente.');
        }
    }

    window.enlargeImage = (imageUrl) => {
        console.log('Imagem clicada. Ampliando imagem:', imageUrl);
        enlargedImage.src = imageUrl;
        enlargedImageModal.style.display = 'block';
    };

    fetchPosts();
});
