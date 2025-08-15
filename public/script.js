document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado. Iniciando a lógica do script.');

    // Configuração da API de back-end
    const API_URL = 'https://mural-de-postagens.vercel.app';
    const IMG_BB_API_KEY = '416fe9a25d249378346cacff72f7ef2d';

    // Seletores de elementos do DOM
    const openModalBtn = document.getElementById('open-post-modal');
    const newPostModal = document.getElementById('new-post-modal');
    const closeModalBtn = document.getElementById('close-post-modal');
    const postForm = document.getElementById('post-form');
    const muralContainer = document.getElementById('mural-container');
    const enlargedImageModal = document.getElementById('enlarged-image-modal');
    const enlargedImage = document.getElementById('enlarged-image');
    const closeEnlargedImageBtn = document.getElementById('close-enlarged-image-modal');

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

        postCard.innerHTML = `
            <h3 class="post-title">${post.title}</h3>
            <div class="post-image-container">
                <img src="${post.image_url}" alt="${post.title}" class="post-image" onclick="enlargeImage('${post.image_url}')">
            </div>
            <p class="post-description">${post.description}</p>
            <div class="post-meta">
                <span class="post-author">Autor: ${post.author}</span>
                <span class="post-date">Data: ${post.post_date}</span>
            </div>
        `;
        muralContainer.prepend(postCard);
    }
    
    // Função para carregar as postagens da nova API
    async function fetchPosts() {
        console.log('Buscando postagens da nova API...');
        try {
            const response = await fetch(`${API_URL}/api/posts`);
            if (!response.ok) {
                throw new Error('Erro ao buscar postagens da API');
            }
            const posts = await response.json();
            console.log('Postagens carregadas com sucesso:', posts);
            posts.forEach(post => createPostElement(post));
        } catch (error) {
            console.error('Erro ao buscar postagens:', error);
        }
    }

    // Evento de envio do formulário
    if (postForm) {
        postForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Formulário de postagem enviado. Coletando dados...');

            const title = document.getElementById('post-title').value;
            const description = document.getElementById('post-description').value;
            const author = document.getElementById('post-author').value;
            const date = document.getElementById('post-date').value;
            const imageFile = document.getElementById('post-image').files[0];

            if (!title || !description || !author || !date) {
                console.warn('Alguns campos do formulário estão vazios.');
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            console.log('Dados do formulário:', { title, description, author, date, imageFile });
            
            // Upload da imagem primeiro
            const imageUrl = await uploadImage(imageFile);
            
            if (imageUrl) {
                const newPost = {
                    title: title,
                    image_url: imageUrl,
                    description: description,
                    author: author,
                    post_date: date
                };

                try {
                    // Insere a nova postagem na nova API
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
                    // Recarrega as postagens para mostrar a nova
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

    // Carrega as postagens da nova API quando a página é carregada
    fetchPosts();
});