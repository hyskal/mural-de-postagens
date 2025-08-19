this.reset();
            this.updateProgress(0, 'Preparando envio...', 'Validando dados');
        }

        hide() {
            console.log('✅ Escondendo loading...');
            
            if (elements.loadingModal) {
                elements.loadingModal.classList.add('hide');
                this.isShowing = false;
                
                setTimeout(() => {
                    elements.loadingModal.style.display = 'none';
                    elements.loadingModal.classList.remove('show', 'hide');
                    
                    // Restaura o formulário
                    if (elements.postForm) {
                        elements.postForm.style.display = 'block';
                    }
                    
                    // Restaura estado do body se for mobile
                    if (DeviceDetector.isMobile()) {
                        this.restoreBodyState();
                    }
                }, 300);
            }
        }

        reset() {
            // Reset dos indicadores de etapa
            Object.values(elements.steps).forEach(step => {
                if (step) {
                    step.classList.remove('active', 'completed');
                }
            });
            
            // Mostra ícone de upload, esconde sucesso
            if (elements.uploadIcon) {
                elements.uploadIcon.style.display = 'block';
            }
            
            if (elements.successCheck) {
                elements.successCheck.style.display = 'none';
                elements.successCheck.classList.remove('show');
            }
            
            // Reset do círculo de progresso
            if (elements.progressCircle) {
                elements.progressCircle.style.strokeDashoffset = this.circumference;
            }
            
            // Reset de estados de erro
            const container = document.querySelector('.loading-container');
            if (container) {
                container.classList.remove('error-state');
            }
        }

        updateProgress(percent, message, submessage = '') {
            console.log(`📊 Progresso: ${percent}% - ${message}`);
            
            // Atualiza círculo de progresso
            if (elements.progressCircle) {
                const offset = this.circumference - (percent / 100) * this.circumference;
                elements.progressCircle.style.strokeDashoffset = offset;
            }
            
            // Atualiza textos
            if (elements.progressText) {
                elements.progressText.textContent = Math.round(percent) + '%';
            }
            
            if (elements.statusText) {
                elements.statusText.textContent = message;
            }
            
            if (elements.substatusText) {
                elements.substatusText.textContent = submessage;
            }
            
            // Atualiza indicadores de etapa
            this.updateSteps(percent);
            
            // Garante que o modal permaneça centralizado em mobile
            if (DeviceDetector.isMobile() && this.isShowing && (percent === 0 || percent >= 95)) {
                setTimeout(() => {
                    this.repositionModal();
                }, 100);
            }
        }

        updateSteps(percent) {
            // Etapa 1: Preparação (0-20%)
            if (percent >= 10 && elements.steps[1]) {
                elements.steps[1].classList.add('active');
            }
            
            // Etapa 2: Upload/Processamento (20-70%)
            if (percent >= 40 && elements.steps[2]) {
                if (elements.steps[1]) {
                    elements.steps[1].classList.replace('active', 'completed');
                }
                elements.steps[2].classList.add('active');
            }
            
            // Etapa 3: Finalização (70-100%)
            if (percent >= 80 && elements.steps[3]) {
                if (elements.steps[2]) {
                    elements.steps[2].classList.replace('active', 'completed');
                }
                elements.steps[3].classList.add('active');
            }
        }

        showSuccess(message = 'Postagem publicada com sucesso!') {
            console.log('🎉 Mostrando sucesso:', message);
            
            // Completa última etapa
            if (elements.steps[3]) {
                elements.steps[3].classList.replace('active', 'completed');
            }
            
            // Esconde upload, mostra sucesso
            if (elements.uploadIcon) {
                elements.uploadIcon.style.display = 'none';
            }
            
            if (elements.successCheck) {
                elements.successCheck.style.display = 'block';
                
                // Pequeno delay para garantir que o display seja aplicado
                setTimeout(() => {
                    elements.successCheck.classList.add('show');
                }, 50);
            }
            
            // Atualiza textos
            if (elements.statusText) {
                elements.statusText.textContent = message;
            }
            
            if (elements.substatusText) {
                elements.substatusText.textContent = 'Redirecionando...';
            }
            
            // Garante progresso 100%
            this.updateProgress(100, message, 'Concluído');
            
            // Reposiciona para garantir visibilidade em mobile
            if (DeviceDetector.isMobile()) {
                setTimeout(() => {
                    this.repositionModal();
                }, 100);
            }
        }

        showError(message = 'Erro durante o processo') {
            console.error('❌ Mostrando erro:', message);
            
            // Atualiza textos de erro
            if (elements.statusText) {
                elements.statusText.textContent = message;
            }
            
            if (elements.substatusText) {
                elements.substatusText.textContent = DeviceDetector.isMobile() ? 
                    'Toque para tentar novamente' : 'Tente novamente';
            }
            
            // Adiciona estado de erro
            const container = document.querySelector('.loading-container');
            if (container) {
                container.classList.add('error-state');
            }
            
            // Auto-hide após 3 segundos
            setTimeout(() => {
                this.hide();
            }, 3000);
        }
        
        // Método utilitário para debounce
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Método público para forçar correção
        forceRepositioning() {
            if (this.isShowing && DeviceDetector.isMobile()) {
                this.repositionModal();
            }
        }

        // Cleanup method
        destroy() {
            this.restoreBodyState();
            
            if (DeviceDetector.isMobile()) {
                // Remove event listeners específicos
                document.removeEventListener('touchmove', this.preventBounce);
                window.removeEventListener('orientationchange', this.handleOrientationChange);
            }
            
            console.log('📱 Loading Manager destruído');
        }
    }

    const loadingManager = new LoadingManager();

    // ===== SISTEMA DE EXPANSÃO DE CARDS =====
    function createExpandedCardStructure(post, postElement) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-expanded-card';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Fechar');
        
        const expandIndicator = document.createElement('div');
        expandIndicator.className = 'expand-indicator';
        expandIndicator.innerHTML = '+';
        
        postElement.appendChild(closeBtn);
        postElement.appendChild(expandIndicator);
        
        return { closeBtn, expandIndicator };
    }

    function expandCard(cardElement, post) {
        if (expandedCard) {
            collapseCard(expandedCard.element);
        }

        cardElement.classList.add('expanded');
        postOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        expandedCard = { element: cardElement, post: post };
        updateExpandedContent(cardElement, post);
        
        cardElement.setAttribute('tabindex', '-1');
        cardElement.focus();
    }

    function collapseCard(cardElement) {
        if (!cardElement) return;
        
        cardElement.classList.remove('expanded');
        postOverlay.classList.remove('active');
        document.body.style.overflow = '';
        expandedCard = null;
        cardElement.removeAttribute('tabindex');
    }

    function updateExpandedContent(cardElement, post) {
        const description = cardElement.querySelector('.post-description');
        if (description && post.description) {
            description.style.webkitLineClamp = 'unset';
            description.textContent = post.description;
        }

        const tags = cardElement.querySelectorAll('.post-tags span');
        tags.forEach(tag => {
            tag.style.cursor = 'pointer';
            tag.onclick = (e) => {
                e.stopPropagation();
                const tagText = tag.textContent.substring(1);
                elements.searchInput.value = `tag:${tagText}`;
                collapseCard(cardElement);
                currentPage = 1;
                fetchPosts();
            };
        });

        const editDeleteButtons = cardElement.querySelector('.edit-delete-buttons');
        if (editDeleteButtons) {
            editDeleteButtons.style.opacity = '1';
        }
    }

    // ===== SELETOR DE CORES =====
    function initializeColorSelector() {
        console.log('🎨 Inicializando seletor de cores...');
        const colorSwatches = document.querySelectorAll('.color-selector .color-swatch');
        
        if (colorSwatches.length === 0) {
            console.error('❌ Nenhuma cor encontrada!');
            return false;
        }

        colorSwatches.forEach((swatch) => {
            // Remove listeners antigos clonando o elemento
            const newSwatch = swatch.cloneNode(true);
            swatch.parentNode.replaceChild(newSwatch, swatch);
        });

        // Adiciona novos listeners
        const newColorSwatches = document.querySelectorAll('.color-selector .color-swatch');
        newColorSwatches.forEach((swatch) => {
            swatch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                newColorSwatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });

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

    function ensureColorSelection() {
        const selectedColor = document.querySelector('.color-swatch.selected');
        if (!selectedColor) {
            const firstColor = document.querySelector('.color-swatch');
            if (firstColor) {
                firstColor.classList.add('selected');
            }
        }
    }

    // ===== FUNÇÕES AUXILIARES =====
    const formatarDataExibicao = (data) => {
        if (!data) return 'N/A';
        const partes = data.split('T')[0].split('-');
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    };

    function resetPostModal() {
        document.getElementById('modal-title').textContent = 'Nova Postagem';
        document.getElementById('submit-post-btn').textContent = 'Postar';
        document.getElementById('post-id').value = '';
        document.getElementById('post-image').required = true;
        document.getElementById('image-info').style.display = 'none';
        elements.postForm.style.display = 'block';
        elements.postForm.reset();
        
        setTimeout(() => {
            const colorSwatches = document.querySelectorAll('.color-selector .color-swatch');
            colorSwatches.forEach(swatch => swatch.classList.remove('selected'));
            const firstColor = document.querySelector('.color-selector .color-swatch');
            if (firstColor) {
                firstColor.classList.add('selected');
            }
        }, 50);
    }

    // ===== UPLOAD DE IMAGEM =====
    async function uploadImage(imageFile) {
        if (!imageFile) {
            console.warn('Nenhum arquivo de imagem selecionado.');
            return null;
        }
        
        for (let i = 0; i < IMG_API_CONFIGS.length; i++) {
            const config = IMG_API_CONFIGS[i];
            try {
                loadingManager.updateProgress(20 + (i * 10), `Enviando imagem via ${config.name}...`, 'Fazendo upload');
                
                const formData = new FormData();
                formData.append('key', config.key);
                formData.append('image', imageFile);

                const response = await fetch(config.endpoint, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        loadingManager.updateProgress(60, 'Imagem enviada com sucesso!', 'Preparando postagem');
                        return data.data.url;
                    }
                }
            } catch (error) {
                console.warn(`Erro de comunicação com a API ${config.name}.`, error);
                if (i === IMG_API_CONFIGS.length - 1) {
                    loadingManager.showError('Falha no upload da imagem');
                    return null;
                }
            }
        }
        
        loadingManager.showError('Todas as APIs de imagem falharam');
        return null;
    }

    // ===== CRIAÇÃO DE ELEMENTOS POST =====
    function createPostElement(post) {
        const postCard = document.createElement('div');
        postCard.classList.add('post-card', 'compact');
        postCard.style.backgroundColor = post.color || 'rgba(255, 255, 255, 0.8)';
        
        // Descrição truncada para modo compacto
        let descriptionText = post.description || '';
        const isLongDescription = descriptionText.length > DISPLAY_LIMIT_DESCRIPTION;
        let truncatedDescription = isLongDescription ? 
            descriptionText.substring(0, DISPLAY_LIMIT_DESCRIPTION) + '...' : 
            descriptionText;

        // Tags HTML
        let tagsHtml = '';
        if (post.tags) {
            const tagsArray = post.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            tagsHtml = '<div class="post-tags">' + tagsArray.map(tag => `<span>#${tag}</span>`).join('') + '</div>';
        }

        // Verificar se é editável
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
            <div class="post-card-content">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-image-container">
                    <img src="${post.image_url}" alt="${post.title}" class="post-image">
                </div>
                <p class="post-description">${truncatedDescription}</p>
                ${tagsHtml}
                <div class="post-meta">
                    <span class="post-author">Autor: ${post.author}</span>
                    <span class="post-date">Foto: ${formattedPhotoDate}</span>
                    <span class="post-date">Postagem: ${formattedPostDate}</span>
                </div>
                ${editDeleteButtons}
            </div>
        `;

        // Adicionar estrutura de expansão
        const { closeBtn, expandIndicator } = createExpandedCardStructure(post, postCard);

        // Event listeners
        postCard.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn') || 
                e.target.classList.contains('delete-btn') ||
                e.target.classList.contains('post-image') ||
                e.target.classList.contains('close-expanded-card')) {
                return;
            }
            expandCard(postCard, post);
        });

        // Clique na imagem para ampliar
        const postImage = postCard.querySelector('.post-image');
        postImage.addEventListener('click', (e) => {
            e.stopPropagation();
            enlargeImage(post.image_url);
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            collapseCard(postCard);
        });

        // Event listeners para botões de edição/exclusão
        if (isEditable) {
            const editBtn = postCard.querySelector('.edit-btn');
            const deleteBtn = postCard.querySelector('.delete-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(post);
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deletePost(post.id, post.created_at);
                });
            }
        }

        elements.muralContainer.appendChild(postCard);
    }

    // ===== MODAL DE EDIÇÃO =====
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
        elements.newPostModal.style.display = 'block';
        
        if (expandedCard) {
            collapseCard(expandedCard.element);
        }
        
        setTimeout(() => {
            const success = initializeColorSelector();
            if (success) {
                const colorSwatches = document.querySelectorAll('.color-selector .color-swatch');
                colorSwatches.forEach(swatch => {
                    swatch.classList.remove('selected');
                    if (swatch.dataset.color === post.color) {
                        swatch.classList.add('selected');
                    }
                });
                if (!document.querySelector('.color-swatch.selected')) {
                    const firstColor = document.querySelector('.color-swatch');
                    if (firstColor) {
                        firstColor.classList.add('selected');
                    }
                }
            }
        }, 150);
    }

    // ===== BUSCAR POSTS =====
    async function fetchPosts() {
        const sortBy = elements.sortBySelect.value;
        const sortOrder = elements.sortOrderSelect.value;
        const searchTerm = elements.searchInput.value;
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
            
            elements.muralContainer.innerHTML = '';
            
            if (posts.length === 0) {
                const noPostsMessage = document.createElement('div');
                noPostsMessage.className = 'no-posts';
                noPostsMessage.textContent = searchTerm ? 
                    `Nenhuma postagem encontrada para "${searchTerm}"` : 
                    'Nenhuma postagem encontrada';
                elements.muralContainer.appendChild(noPostsMessage);
            } else {
                posts.forEach(post => createPostElement(post));
            }
            
            updatePaginationControls();
        } catch (error) {
            console.error('Erro ao buscar postagens:', error);
            alert('Erro ao buscar postagens. Verifique sua conexão ou a API.');
        }
    }

    // ===== CONTROLES DE PAGINAÇÃO =====
    function updatePaginationControls() {
        const totalPages = Math.ceil(totalPosts / postsPerPage);
        elements.pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages}`;
        elements.prevPageBtn.disabled = currentPage === 1;
        elements.nextPageBtn.disabled = currentPage * postsPerPage >= totalPosts;
    }

    // ===== DELETAR POST =====
    async function deletePost(postId, createdAt) {
        const fiveMinutesAgo = new Date(new Date() - (EDIT_TIME_LIMIT_MINUTES * 60 * 1000));
        if (new Date(createdAt) < fiveMinutesAgo) {
            alert('Não é possível excluir esta postagem. O limite de 5 minutos foi excedido.');
            return;
        }
        if (!confirm(`Tem certeza que deseja excluir a postagem?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/posts?id=${postId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir a postagem');
            }
            localStorage.removeItem('createdPostId');
            localStorage.removeItem('createdPostTime');
            
            if (expandedCard && expandedCard.post.id === postId) {
                collapseCard(expandedCard.element);
            }
            
            fetchPosts();
        } catch (error) {
            console.error('Erro ao excluir postagem:', error);
            alert('Erro ao excluir a postagem. Tente novamente.');
        }
    }

    // ===== FUNÇÃO GLOBAL PARA AMPLIAR IMAGEM =====
    window.enlargeImage = (imageUrl) => {
        elements.enlargedImage.src = imageUrl;
        elements.enlargedImageModal.style.display = 'block';
    };

    // ===== EVENT LISTENERS PRINCIPAIS =====
    
    // Modal de nova postagem
    if (elements.openModalBtn) {
        elements.openModalBtn.addEventListener('click', () => {
            elements.newPostModal.style.display = 'block';
            resetPostModal();
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

    if (elements.closeModalBtn) {
        elements.closeModalBtn.addEventListener('click', () => {
            elements.newPostModal.style.display = 'none';
            elements.postForm.reset();
        });
    }

    if (elements.closeEnlargedImageBtn) {
        elements.closeEnlargedImageBtn.addEventListener('click', () => {
            elements.enlargedImageModal.style.display = 'none';
        });
    }

    // Clicks fora dos modais
    window.addEventListener('click', (event) => {
        if (event.target === elements.newPostModal) {
            elements.newPostModal.style.display = 'none';
            elements.postForm.reset();
        }
        if (event.target === elements.enlargedImageModal) {
            elements.enlargedImageModal.style.display = 'none';
        }
        
        // Clique no loading em estado de erro (mobile)
        if (event.target === elements.loadingModal && 
            elements.loadingModal.querySelector('.loading-container.error-state')) {
            loadingManager.hide();
        }
    });

    // Overlay de cards expandidos
    postOverlay.addEventListener('click', () => {
        if (expandedCard) {
            collapseCard(expandedCard.element);
        }
    });

    // Busca e filtros
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                fetchPosts();
            }
        });

        elements.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                fetchPosts();
            }, 500);
        });
    }
    
    elements.sortBySelect.addEventListener('change', () => { 
        currentPage = 1; 
        fetchPosts(); 
    });
    
    elements.sortOrderSelect.addEventListener('change', () => { 
        currentPage = 1; 
        fetchPosts(); 
    });
    
    // Paginação
    elements.prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPosts();
        }
    });
    
    elements.nextPageBtn.addEventListener('click', () => {
        if (currentPage * postsPerPage < totalPosts) {
            currentPage++;
            fetchPosts();
        }
    });

    // ===== FORM SUBMISSION =====
    if (elements.postForm) {
        elements.postForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const postId = document.getElementById('post-id').value;
            const title = document.getElementById('post-title').value;
            const description = document.getElementById('post-description').value;
            const author = document.getElementById('post-author').value;
            const photoDate = document.getElementById('photo-date').value;
            const tags = document.getElementById('post-tags').value;
            const imageFile = document.getElementById('post-image').files[0];
            
            let selectedColor = 'rgba(255, 255, 255, 0.8)';
            const selectedColorElement = document.querySelector('.color-swatch.selected');
            if (selectedColorElement && selectedColorElement.dataset.color) {
                selectedColor = selectedColorElement.dataset.color;
            } else {
                const firstColor = document.querySelector('.color-swatch');
                if (firstColor) {
                    selectedColor = firstColor.dataset.color;
                }
            }

            // Validações
            if (!title || !description || !author || !photoDate) {
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
            
            const today = new Date().toISOString().split('T')[0];
            if (photoDate > today) {
                alert('A data da foto não pode ser futura.');
                return;
            }

            // Iniciar loading
            loadingManager.show();
            loadingManager.updateProgress(10, 'Validando dados...', 'Verificando informações');

            let imageUrl = null;
            
            // Upload de imagem se fornecida
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
                if (!imageUrl) {
                    loadingManager.hide();
                    alert('Erro ao enviar a imagem. Por favor, tente novamente.');
                    return;
                }
            }

            // Preparar dados da postagem
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
                loadingManager.updateProgress(80, 'Salvando postagem...', 'Conectando ao banco de dados');
                
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
                
                // Armazenar informações da postagem criada
                if (result.id) {
                    localStorage.setItem('createdPostId', result.id);
                    localStorage.setItem('createdPostTime', result.created_at);
                }

                loadingManager.updateProgress(95, 'Finalizando...', 'Quase pronto');
                
                // Mostrar sucesso
                setTimeout(() => {
                    loadingManager.showSuccess(postId ? 'Postagem atualizada!' : 'Postagem publicada!');
                    
                    setTimeout(() => {
                        loadingManager.hide();
                        window.location.reload();
                    }, 2000);
                }, 500);
                
            } catch (error) {
                console.error('Erro ao salvar a postagem na API:', error);
                loadingManager.showError('Erro ao salvar postagem');
                setTimeout(() => {
                    alert('Erro ao salvar a postagem. Tente novamente.');
                }, 1000);
            }
        });
    }

    // ===== EVENT LISTENERS GLOBAIS =====
    
    // ESC para fechar card expandido
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && expandedCard) {
            collapseCard(expandedCard.element);
        }
    });

    // Touch events para dispositivos móveis
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        
        // Swipe down para fechar card expandido
        if (expandedCard && touchEndY > touchStartY + 50) {
            collapseCard(expandedCard.element);
        }
    });

    // ===== EVENT LISTENERS ESPECÍFICOS PARA MOBILE =====
    
    if (DeviceDetector.isMobile()) {
        console.log('📱 Dispositivo móvel detectado - configurando event listeners específicos...');
        
        // Handler para visibilitychange (volta do background)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && loadingManager.isShowing) {
                setTimeout(() => {
                    loadingManager.forceRepositioning();
                }, 100);
            }
        });
        
        // Handler global para mudanças de orientação
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Recalcula layout de todos os modais abertos
                const openModals = document.querySelectorAll('.modal[style*="display: block"], #loading-modal.show');
                openModals.forEach(modal => {
                    if (modal.style.display !== 'none') {
                        modal.style.display = 'none';
                        modal.offsetHeight; // Force reflow
                        modal.style.display = modal.id === 'loading-modal' ? 'flex' : 'block';
                    }
                });
                
                // Reposiciona cards expandidos
                if (expandedCard) {
                    setTimeout(() => {
                        const cardElement = expandedCard.element;
                        if (cardElement) {
                            cardElement.style.transform = 'translate(-50%, -50%)';
                        }
                    }, 100);
                }
            }, 200);
        });
        
        // Previne zoom indesejado em inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                // Scroll para o elemento em foco
                setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }

    // ===== INICIALIZAÇÃO =====
    console.log('🚀 Iniciando aplicação com sistema de cards expansíveis...');
    fetchPosts();
    
    // Log de inicialização com informações do dispositivo e grid
    setTimeout(() => {
        const deviceInfo = {
            isMobile: DeviceDetector.isMobile(),
            isIOS: DeviceDetector.isIOS(),
            isAndroid: DeviceDetector.isAndroid(),
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            orientation: DeviceDetector.isLandscapePhone() ? 'landscape' : 'portrait',
            grid: window.innerWidth >= 1200 ? '4 colunas' : window.innerWidth >= 768 ? '3 colunas' : '2 colunas'
        };
        
        console.log('✅ Aplicação iniciada com sucesso!', deviceInfo);
        console.log('🎯 Sistema de cards expansíveis ativo!');
        
        if (DeviceDetector.isMobile()) {
            console.log('📱 Correções mobile aplicadas:', {
                loadingFix: '✅ Ativo',
                touchEvents: '✅ Configurados',
                orientationFix: '✅ Ativo',
                scrollPrevention: '✅ Ativo'
            });
        }
    }, 1000);
    
    // ===== CLEANUP NO UNLOAD =====
    window.addEventListener('beforeunload', () => {
        if (loadingManager && typeof loadingManager.destroy === 'function') {
            loadingManager.destroy();
        }
    });
});/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 2.2: Correção completa do sistema de loading para mobile - detecção automática de dispositivos, prevenção de scroll, reposicionamento inteligente, compatibilidade iOS/Android garantida.
 * Versão 2.1: Código JavaScript completamente reorganizado - removidos duplicados, lógica otimizada, sistema de cards expansíveis funcionando perfeitamente.
 * Versão 2.0: Implementado sistema completo de cards expansíveis - cards compactos no grid que expandem em modal overlay com todas as informações, suporte a 4 colunas no desktop e 2 no mobile.
 * Versão 1.9: Sistema de loading completamente renovado - implementado design moderno com círculo de progresso animado, indicadores de etapa, animações suaves e feedback visual aprimorado durante todo o processo de envio.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado - Iniciando aplicação do Mural de Postagens...');

    // ===== CONFIGURAÇÕES E CONSTANTES =====
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
    const LIMIT_DESCRIPTION = 300;
    const DISPLAY_LIMIT_DESCRIPTION = 100;
    const LIMIT_TITLE = 120;

    // ===== VARIÁVEIS GLOBAIS =====
    let currentPage = 1;
    const postsPerPage = 20;
    let totalPosts = 0;
    let expandedCard = null;
    let searchTimeout;
    let touchStartY = 0;
    let touchEndY = 0;

    // ===== DETECÇÃO DE DISPOSITIVOS =====
    const DeviceDetector = {
        isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: () => /Android/.test(navigator.userAgent),
        isSmallScreen: () => window.innerWidth <= 480 || window.innerHeight <= 640,
        isLandscapePhone: () => window.innerWidth > window.innerHeight && window.innerHeight <= 500 && DeviceDetector.isMobile()
    };

    // ===== ELEMENTOS DOM =====
    const elements = {
        openModalBtn: document.getElementById('open-post-modal'),
        newPostModal: document.getElementById('new-post-modal'),
        closeModalBtn: document.getElementById('close-post-modal'),
        postForm: document.getElementById('post-form'),
        muralContainer: document.getElementById('mural-container'),
        enlargedImageModal: document.getElementById('enlarged-image-modal'),
        enlargedImage: document.getElementById('enlarged-image'),
        closeEnlargedImageBtn: document.getElementById('close-enlarged-image-modal'),
        searchInput: document.getElementById('search-input'),
        sortBySelect: document.getElementById('sort-by'),
        sortOrderSelect: document.getElementById('sort-order'),
        prevPageBtn: document.getElementById('prev-page-btn'),
        nextPageBtn: document.getElementById('next-page-btn'),
        pageInfoSpan: document.getElementById('page-info'),
        loadingModal: document.getElementById('loading-modal'),
        progressCircle: document.getElementById('progressCircle'),
        progressText: document.getElementById('progressText'),
        statusText: document.getElementById('statusText'),
        substatusText: document.getElementById('substatusText'),
        uploadIcon: document.querySelector('.upload-icon'),
        successCheck: document.getElementById('successCheck'),
        steps: {
            1: document.getElementById('step1'),
            2: document.getElementById('step2'),
            3: document.getElementById('step3')
        }
    };

    // ===== OVERLAY PARA CARDS EXPANDIDOS =====
    const postOverlay = document.createElement('div');
    postOverlay.className = 'post-overlay';
    document.body.appendChild(postOverlay);

    // ===== CLASSE LOADING MANAGER CORRIGIDA PARA MOBILE =====
    class LoadingManager {
        constructor() {
            this.circumference = 2 * Math.PI * 54;
            this.isShowing = false;
            this.originalScrollY = 0;
            this.originalBodyStyles = {};
            
            if (elements.progressCircle) {
                elements.progressCircle.style.strokeDasharray = this.circumference;
                elements.progressCircle.style.strokeDashoffset = this.circumference;
            }
            
            // Bind dos métodos para manter contexto
            this.show = this.show.bind(this);
            this.hide = this.hide.bind(this);
            this.handleOrientationChange = this.handleOrientationChange.bind(this);
            this.preventBounce = this.preventBounce.bind(this);
            
            // Event listeners para dispositivos móveis
            if (DeviceDetector.isMobile()) {
                this.setupMobileEventListeners();
            }
        }
        
        setupMobileEventListeners() {
            // Previne bounce scroll no iOS durante loading
            document.addEventListener('touchmove', this.preventBounce, { passive: false });
            
            // Event listener para mudanças de orientação
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 200);
            });
            
            // Resize handler
            window.addEventListener('resize', this.debounce(() => {
                this.handleResize();
            }, 250));
        }
        
        preventBounce(e) {
            if (this.isShowing) {
                // Permite scroll apenas dentro do container de loading
                const target = e.target;
                const loadingContainer = elements.loadingModal?.querySelector('.loading-container');
                
                if (!loadingContainer || !loadingContainer.contains(target)) {
                    e.preventDefault();
                    return false;
                }
            }
        }
        
        handleOrientationChange() {
            if (this.isShowing) {
                console.log('🔄 Mudança de orientação durante loading');
                setTimeout(() => {
                    this.adjustLoadingForMobile();
                    this.repositionModal();
                }, 300);
            }
        }
        
        handleResize() {
            if (this.isShowing) {
                this.adjustLoadingForMobile();
            }
        }
        
        repositionModal() {
            const modal = elements.loadingModal;
            const container = modal?.querySelector('.loading-container');
            
            if (modal && container && this.isShowing) {
                // Força recalculo do layout
                modal.style.display = 'none';
                modal.offsetHeight; // Trigger reflow
                modal.style.display = 'flex';
                
                // Garante centralização
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                
                console.log('📍 Loading reposicionado para mobile');
            }
        }
        
        adjustLoadingForMobile() {
            const loadingModal = elements.loadingModal;
            const loadingContainer = loadingModal?.querySelector('.loading-container');
            
            if (!loadingModal || !loadingContainer) return;
            
            // Força hardware acceleration
            loadingModal.style.transform = 'translate3d(0, 0, 0)';
            loadingContainer.style.transform = 'translate3d(0, 0, 0)';
            
            // Ajustes específicos para telas pequenas
            if (DeviceDetector.isSmallScreen()) {
                loadingContainer.style.maxWidth = 'calc(100vw - 30px)';
                loadingContainer.style.maxHeight = 'calc(100vh - 60px)';
                loadingContainer.style.padding = '24px 20px';
            }
            
            // Ajustes para orientação landscape em mobile
            if (DeviceDetector.isLandscapePhone()) {
                loadingContainer.style.maxHeight = 'calc(100vh - 40px)';
                loadingContainer.style.padding = '20px 24px';
            }
        }
        
        saveCurrentState() {
            // Salva posição de scroll atual
            this.originalScrollY = window.scrollY || document.documentElement.scrollTop;
            
            // Salva estilos originais do body
            const body = document.body;
            this.originalBodyStyles = {
                position: body.style.position,
                top: body.style.top,
                width: body.style.width,
                overflow: body.style.overflow,
                height: body.style.height
            };
        }
        
        lockBody() {
            const body = document.body;
            
            // Aplica lock de scroll
            body.style.position = 'fixed';
            body.style.top = `-${this.originalScrollY}px`;
            body.style.width = '100%';
            body.style.overflow = 'hidden';
            body.style.height = '100%';
            
            // Adiciona classe
            body.classList.add('loading-active');
            
            // Específico para iOS
            if (DeviceDetector.isIOS()) {
                body.style.webkitOverflowScrolling = 'touch';
                body.style.touchAction = 'none';
            }
        }
        
        restoreBodyState() {
            const body = document.body;
            
            // Remove classe
            body.classList.remove('loading-active');
            
            // Restaura estilos originais
            Object.keys(this.originalBodyStyles).forEach(prop => {
                if (this.originalBodyStyles[prop]) {
                    body.style[prop] = this.originalBodyStyles[prop];
                } else {
                    body.style[prop] = '';
                }
            });
            
            // Restaura posição de scroll
            window.scrollTo(0, this.originalScrollY);
            
            // Limpa propriedades específicas do iOS
            if (DeviceDetector.isIOS()) {
                body.style.webkitOverflowScrolling = '';
                body.style.touchAction = '';
            }
        }

        show() {
            console.log('🔄 Mostrando loading...');
            
            // Salva estado atual se for mobile
            if (DeviceDetector.isMobile()) {
                this.saveCurrentState();
                this.lockBody();
            }
            
            // Esconde o formulário
            if (elements.postForm) {
                elements.postForm.style.display = 'none';
            }
            
            // Mostra o modal
            if (elements.loadingModal) {
                elements.loadingModal.style.display = 'flex';
                elements.loadingModal.classList.add('show');
                this.isShowing = true;
                
                // Ajustes específicos para mobile
                if (DeviceDetector.isMobile()) {
                    setTimeout(() => {
                        this.adjustLoadingForMobile();
                        this.repositionModal();
                    }, 50);
                }
            }
            
            this.reset();
            this.updateProgress(0, 'Preparando envio...
