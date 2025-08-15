document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado. Iniciando a lógica do script.');

    const API_URL = 'https://mural-de-postagens.vercel.app';
    const IMG_BB_API_KEY = '416fe9a25d249378346cacff72f7ef2d';

    const LIMIT_DESCRIPTION = 150;

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

    // Funções de manipulação dos modais
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            console.log('Botão "Nova Postagem" clicado. Exibindo modal.');
            newPostModal.style.display = 'block';
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
            return data.data.url;
        } catch (error) {
            console.error('Erro durante o upload:', error);
            alert('Erro ao enviar a imagem. Por favor, tente novamente.');
            return null;
        }
    }

    // Função para criar o elemento de postagem e adicioná-lo ao mural
    function createPostElement(post) {
        console.log('Criando novo elemento de postagem com os dados:', post);
        const postCard = document.createElement('div');
        postCard.classList.add('post-card');

        // Lógica para limitar a descrição e adicionar "Leia Mais"
        let descriptionText = post.description;
        if (descriptionText && descriptionText.length > LIMIT_DESCRIPTION) {
            descriptionText = descriptionText.substring(0, LIMIT_DESCRIPTION) + '... <a href="#" class="read-more" data-fulltext="' + post.description.replace(/"/g, '&quot;') + '">Leia Mais</a>';
        }
        
        // Exibição de tags
        let tagsHtml = '';
        if (post.tags) {
            const tagsArray = post.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            tagsHtml = '<div class="post-tags">' + tagsArray.map(tag => `<span>#${tag}</span>`).join('') + '</div>';
        }

        postCard.innerHTML = `
            <h3 class="post-title">${post.title}</h3>
            <div class="post-image-container">
                <img src="${post.image_url}" alt="${post.title}" class="post-image" onclick="enlargeImage('${post.image_url}')">
            </div>
            <p class="post-description">${descriptionText}</p>
            ${tagsHtml}
            <div class="post-meta">
                <span class="post-author">Autor: ${post.author}</span>
                <span class="post-date">Data: ${post.post_date}</span>
            </div>
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

    // Evento de envio do formulário
    if (postForm) {
        postForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Formulário de postagem enviado. Coletando dados...');

            const title = document.getElementById('post-title').value;
            const description = document.getElementById('post-description').value;
            const author = document.getElementById('post-author').value;
            const date = document.getElementById('post-date').value;
            const tags = document.getElementById('post-tags').value;
            const imageFile = document.getElementById('post-image').files[0];

            if (!title || !description || !author || !date) {
                console.warn('Alguns campos do formulário estão vazios.');
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            console.log('Dados do formulário:', { title, description, author, date, tags, imageFile });
            
            const imageUrl = await uploadImage(imageFile);
            
            if (imageUrl) {
                const newPost = {
                    title: title,
                    image_url: imageUrl,
                    description: description,
                    author: author,
                    post_date: date,
                    tags: tags // Adicionando tags
                };

                try {
                    const response = await fetch(`${API_URL}/api/posts`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newPost)
                    });

                    if (!response.ok) {
                        throw new Error('Erro ao salvar a postagem na API');
                    }
                    
                    console.log('Postagem salva na API com sucesso!');
                    muralContainer.innerHTML = '';
                    fetchPosts();
                    newPostModal.style.display = 'none';
                    postForm.reset();
                } catch (error) {
                    console.error('Erro ao salvar a postagem na API:', error);
                    alert('Erro ao salvar a postagem. Tente novamente.');
                }
            }
        });
    }

    window.enlargeImage = (imageUrl) => {
        console.log('Imagem clicada. Ampliando imagem:', imageUrl);
        enlargedImage.src = imageUrl;
        enlargedImageModal.style.display = 'block';
    };

    fetchPosts();
});