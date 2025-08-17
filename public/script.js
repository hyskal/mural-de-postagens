/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 1.6: Implementada uma correção na lógica de upload de imagem para garantir que a barra de progresso seja exibida corretamente mesmo em caso de falha no envio. A barra de carregamento agora completa o progresso e exibe uma mensagem de erro, ao invés de desaparecer abruptamente.
 * Versão 1.5: Correção completa do seletor de cores - adicionada inicialização robusta, logs de depuração e captura correta da cor selecionada.
 * Versão 1.4: Implementada a ofuscação simples Base64 para as chaves das APIs de upload de imagem, resolvendo os erros de requisição 400.
 * Versão 1.3: Adicionada solução de quebra de texto (word-break: break-all;) para lidar com strings longas sem espaços no campo de descrição.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado. Iniciando a lógica do script.');

    const API_URL = 'https://mural-de-postagens.vercel.app';
    const obfuscatedKey1 = 'OGMyMjNmZjljM2MyNjc4MzJjMjZhYWNiMjEwMTQ2MDI=';
    const obfuscatedKey2 = 'ZWNjMjlhYjNhNDZmOGZhODc2MWViZGVlOGExZTg1MGQ=';
    
    function getSecureValue(obfuscated) {
        return atob(obfuscated);
    }

    const IMG_API_CONFIGS = [
        { name: 'ImgBB - eduk', endpoint: 'https://api.imgbb.com/1/upload', key: getSecureValue(obfuscatedKey1) },
        { name: 'ImgBB - enova', endpoint: 'https://api.imgbb.com/1/upload', key: getSecureValue(obfuscatedKey2) }
    ];
    const EDIT_TIME_LIMIT_MINUTES = 5;
    const LIMIT_DESCRIPTION = 300; // Limite de caracteres para o formulário de postagem
    const DISPLAY_LIMIT_DESCRIPTION = 100; // Limite de caracteres para exibição no mural
    const LIMIT_TITLE = 120;

    // Estado da paginação
    let currentPage = 1;
    const postsPerPage = 10;
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

    // Função para inicializar o seletor de cores
    function initializeColorSelector() {
        console.log('🎨 Inicializando seletor de cores...');
        
        const colorSwatches = document.querySelectorAll('.color-selector .color-swatch');
        console.log('🎨 Cores encontradas:', colorSwatches.length);

        // Verifica se as cores foram encontradas
        if (colorSwatches.length === 0) {
            console.error('❌ Nenhuma cor encontrada! Verificando HTML...');
            console.log('🔍 HTML do modal:', document.getElementById('new-post-modal')?.innerHTML);
            return false;
        }

        // Adiciona event listeners para cada cor
        colorSwatches.forEach((swatch, index) => {
            console.log(`🎨 Configurando cor ${index + 1}:`, swatch.dataset.color);
            
            // Remove listeners antigos para evitar duplicação
            swatch.replaceWith(swatch.cloneNode(true));
        });

        // Reseleciona as cores após a clonagem
        const newColorSwatches = document.querySelectorAll('.color-selector .color-swatch');

        newColorSwatches.forEach((swatch, index) => {
            swatch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎨 Cor clicada:', swatch.dataset.color);
                
                // Remove a seleção de todas as cores
                newColorSwatches.forEach(s => s.classList.remove('selected'));
                
                // Adiciona seleção na cor clicada
                swatch.classList.add('selected');
                
                console.log('✅ Cor selecionada atualizada');
            });

            // Adiciona efeitos de hover
            swatch.addEventListener('mouseenter', () => {
                if (!swatch.classList.contains('selected')) {
                    swatch.style.transform = 'scale(1.1)';
                }
            });

            swatch.addEventListener('mouseleave', () => {
                if (!swatch.classList.contains('selected')) {
                    swatch.style.transform = 'scale(1)';
                }
            });
        });

        console.log('✅ Seletor de cores inicializado com sucesso!');
        return true;
    }

    // Função para garantir que a primeira cor esteja selecionada
    function ensureColorSelection() {
        const selectedColor = document.querySelector('.color-swatch.selected');
        if (!selectedColor) {
            console.log('⚠️ Nenhuma cor selecionada, selecionando a primeira...');
            const firstColor = document.querySelector('.color-swatch');
            if (firstColor) {
                firstColor.classList.add('selected');
                console.log('✅ Primeira cor selecionada automaticamente');
            }
        }
    }

    // Funções de manipulação dos modais
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            console.log('📝 Botão "Nova Postagem" clicado. Exibindo modal.');
            newPostModal.style.display = 'block';
            resetPostModal();
            
            // Aguarda um pouco para garantir que o DOM foi atualizado
            setTimeout(() => {
                const success = initializeColorSelector();
                if (success) {
                    ensureColorSelection();
                } else {
                    console.error('❌ Falha ao inicializar seletor de cores');
                }
            }, 150);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('❌ Botão de fechar modal clicado. Ocultando modal.');
            newPostModal.style.display = 'none';
            postForm.reset();
        });
    }

    if (closeEnlargedImageBtn) {
        closeEnlargedImageBtn.addEventListener('click', () => {
            console.log('❌ Botão de fechar imagem ampliada clicado. Ocultando modal.');
            enlargedImageModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === newPostModal) {
            console.log('❌ Clique fora do modal de postagem. Ocultando modal.');
            newPostModal.style.display = 'none';
            postForm.reset();
        }
        if (event.target === enlargedImageModal) {
            console.log('❌ Clique fora do modal de imagem ampliada. Ocultando modal.');
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
        
        // Reset color selection
        setTimeout(() => {
            const colorSwatches = document.querySelectorAll('.color-selector .color-swatch');
            colorSwatches.forEach(swatch => swatch.classList.remove('selected'));
            const firstColor = document.querySelector('.color-selector .color-swatch');
            if (firstColor) {
                firstColor.classList.add('selected');
            }
        }, 50);
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

    // Função assíncrona para upload de imagem nas APIs
    async function uploadImage(imageFile) {
        if (!imageFile) {
            console.warn('Nenhum arquivo de imagem selecionado.');
            return null;
        }

        const formData = new FormData();
        
        for (const config of IMG_API_CONFIGS) {
            try {
                updateLoading(30, `Fazendo upload da imagem usando ${config.name}...`);
                console.log(`Tentando upload com a API: ${config.name}`);

                const formData = new FormData();
                formData.append('key', config.key);
                formData.append('image', imageFile);

                const response = await fetch(config.endpoint, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    console.warn(`Falha no upload com a API ${config.name}. Status: ${response.status}. Tentando a próxima.`);
                    continue;
                }
                
                const data = await response.json();
                console.log(`Resposta JSON da API ${config.name}:`, data);

                let imageUrl = null;
                if (data.success) {
                    imageUrl = data.data.url;
                }

                if (imageUrl) {
                    updateLoading(60, `Imagem enviada com sucesso. Publicando no mural...`);
                    return imageUrl;
                } else {
                    console.warn(`A API ${config.name} não retornou uma URL válida. Tentando a próxima.`);
                    continue;
                }
            } catch (error) {
                console.warn(`Erro de comunicação com a API ${config.name}.`, error);
                continue;
            }
        }
        
        // Se todas as APIs falharem, atualiza o status de carregamento antes de retornar null
        updateLoading(100, 'Falha no upload da imagem.');
        console.error('Todas as chaves de API falharam no upload.');
        return null;
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
        
        const isEditable = createdPostId === post.id && (new Date() - new Date(createdAt)) < (EDIT_TIME_LIMIT_MINUTES * 60 * 1000);
        
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

        newPostModal.style.display = 'block';

        // Aguarda um pouco e então configura a cor
        setTimeout(() => {
            const success = initializeColorSelector();
            if (success) {
                const colorSwatches = document.querySelectorAll('.color-selector .color-swatch');
                colorSwatches.forEach(swatch => {
                    swatch.classList.remove('selected');
                    if (swatch.dataset.color === post.color) {
                        swatch.classList.add('selected');
                        console.log('🎨 Cor da postagem restaurada:', post.color);
                    }
                });
                
                // Se nenhuma cor foi selecionada, seleciona a primeira
                if (!document.querySelector('.color-swatch.selected')) {
                    const firstColor = document.querySelector('.color-swatch');
                    if (firstColor) {
                        firstColor.classList.add('selected');
                    }
                }
            }
        }, 150);
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
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentPage = 1;
            fetchPosts();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                fetchPosts();
            }
        });
    }
    
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
            
            const postId = document.getElementById('post-id').value;
            const title = document.getElementById('post-title').value;
            const description = document.getElementById('post-description').value;
            const author = document.getElementById('post-author').value;
            const photoDate = document.getElementById('photo-date').value;
            const tags = document.getElementById('post-tags').value;
            const imageFile = document.getElementById('post-image').files[0];
            
            // CAPTURA DA COR SELECIONADA - VERSÃO CORRIGIDA
            let selectedColor = 'rgba(255, 255, 255, 0.8)'; // cor padrão
            const selectedColorElement = document.querySelector('.color-swatch.selected');
            
            if (selectedColorElement && selectedColorElement.dataset.color) {
                selectedColor = selectedColorElement.dataset.color;
                console.log('🎨 Cor selecionada para envio:', selectedColor);
            } else {
                console.warn('⚠️ Nenhuma cor selecionada, usando padrão:', selectedColor);
                // Tenta selecionar a primeira cor como fallback
                const firstColor = document.querySelector('.color-swatch');
                if (firstColor) {
                    selectedColor = firstColor.dataset.color;
                    console.log('🎨 Usando primeira cor como fallback:', selectedColor);
                }
            }

            if (!title || !description || !author || !photoDate) {
                console.warn('Alguns campos do formulário estão vazios.');
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            if (title.length > LIMIT_TITLE) {
                alert(`O título deve ter no máximo ${LIMIT_TITLE} caracteres.`);
                return;
            }
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
                    // Após a falha do upload, a função já atualiza o loading bar e retorna.
                    // Apenas alertamos o usuário e saímos.
                    alert('Erro ao enviar a imagem. Por favor, tente novamente.');
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
            
            console.log('📤 Dados da postagem para envio:', postData);
            
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

    // Inicialização
    console.log('🚀 Script inicializado. Carregando postagens...');
    fetchPosts();
});
