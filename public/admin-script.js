/**
 * CHANGELOG
 *
 * Instruções para Revisores:
 * Este bloco de comentários registra as modificações significativas do arquivo.
 * Cada nova modificação deve ser adicionada no topo da lista.
 * Use o formato "Versão [número]: [Descrição da modificação]".
 * Mantenha a lista limitada às 4 últimas alterações para clareza e concisão.
 *
 * Versão 2.3: Implementação completa do sistema de seleção múltipla com checkbox "selecionar todas", exclusão em massa com confirmação de senha, reorganização das colunas (autor, link da foto, datas, ações), remoção da coluna ID e adição da funcionalidade de exportação CSV com todos os dados das postagens.
 * Versão 2.2: Simplificação da interface de confirmação de senha usando popup nativo (prompt) ao invés de modal customizado. Interface mais minimalista e direta.
 * Versão 2.1: Limpeza de logs sensíveis à segurança, mantendo apenas logs essenciais de controle.
 * Versão 2.0: Implementado modal de confirmação de senha admin para operações críticas (editar/excluir).
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

    // Novos elementos para funcionalidades adicionais
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const selectedCountSpan = document.querySelector('.selected-count');

    const postsPerPage = 20;
    let currentPage = 1;
    let allPosts = []; // Array para armazenar todas as postagens para exportação

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

    // ========== FUNÇÕES DE SELEÇÃO MÚLTIPLA ==========
    function updateBulkDeleteButton() {
        const selectedCheckboxes = document.querySelectorAll('.post-checkbox:checked');
        const count = selectedCheckboxes.length;
        
        selectedCountSpan.textContent = count;
        
        if (count > 0) {
            bulkDeleteBtn.style.display = 'block';
        } else {
            bulkDeleteBtn.style.display = 'none';
        }
    }

    function handleSelectAll() {
        const isChecked = selectAllCheckbox.checked;
        const postCheckboxes = document.querySelectorAll('.post-checkbox');
        
        postCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        
        updateBulkDeleteButton();
    }

    function handleIndividualCheckbox() {
        const postCheckboxes = document.querySelectorAll('.post-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.post-checkbox:checked');
        
        // Atualizar o estado do checkbox "selecionar todas"
        if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (checkedCheckboxes.length === postCheckboxes.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
        
        updateBulkDeleteButton();
    }

    // Event listeners para seleção múltipla
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }

    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', handleBulkDelete);
    }
    // ================================================

    // ========== FUNÇÕES DE EXCLUSÃO EM MASSA ==========
    async function handleBulkDelete() {
        const selectedCheckboxes = document.querySelectorAll('.post-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0) {
            alert('Nenhuma postagem selecionada.');
            return;
        }
        
        const confirmMessage = `Tem certeza que deseja excluir ${selectedIds.length} postagem(ns) selecionada(s)?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Solicitar confirmação de senha
            const adminPassword = await showPasswordConfirm();
            
            // Executar exclusões
            let successCount = 0;
            let errorCount = 0;
            
            for (const postId of selectedIds) {
                try {
                    const response = await fetch(`${API_URL}/api/posts?id=${postId}&admin_password=${encodeURIComponent(adminPassword)}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Erro ao excluir postagem ${postId}:`, error);
                    errorCount++;
                }
            }
            
            // Mostrar resultado
            if (errorCount === 0) {
                alert(`✅ ${successCount} postagem(ns) excluída(s) com sucesso!`);
            } else {
                alert(`⚠️ ${successCount} postagem(ns) excluída(s), ${errorCount} falha(s).`);
            }
            
            // Recarregar lista
            fetchPosts();
            
        } catch (error) {
            if (error.message !== 'Operação cancelada pelo usuário') {
                console.error('Erro na exclusão em massa:', error);
                alert(error.message);
            }
        }
    }
    // =================================================

    // ========== FUNÇÃO DE EXPORTAÇÃO CSV ==========
    async function exportToCSV() {
        try {
            // Buscar todas as postagens (sem paginação)
            const response = await fetch(`${API_URL}/api/posts?limit=1000`);
            if (!response.ok) {
                throw new Error('Erro ao buscar postagens para exportação');
            }
            
            const data = await response.json();
            const posts = data.posts;
            
            if (posts.length === 0) {
                alert('Não há postagens para exportar.');
                return;
            }
            
            // Criar cabeçalho CSV
            const headers = [
                'ID',
                'Título',
                'Descrição',
                'Autor',
                'Data da Foto',
                'Data da Postagem',
                'Tags',
                'URL da Imagem',
                'Cor'
            ];
            
            // Função para escapar campos CSV
            function escapeCSVField(field) {
                if (field === null || field === undefined) return '';
                const str = String(field);
                if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            }
            
            // Converter dados para CSV
            const csvRows = [headers.join(',')];
            
            posts.forEach(post => {
                const row = [
                    escapeCSVField(post.id),
                    escapeCSVField(post.title),
                    escapeCSVField(post.description),
                    escapeCSVField(post.author),
                    escapeCSVField(post.photo_date?.split('T')[0]),
                    escapeCSVField(post.created_at?.split('T')[0]),
                    escapeCSVField(post.tags),
                    escapeCSVField(post.image_url),
                    escapeCSVField(post.color)
                ];
                csvRows.push(row.join(','));
            });
            
            const csvContent = csvRows.join('\n');
            
            // Criar e baixar arquivo
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const today = new Date();
            const dateString = today.toISOString().split('T')[0];
            const fileName = `mural_postagens_${dateString}.csv`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`✅ CSV exportado: ${posts.length} postagens`);
            
        } catch (error) {
            console.error('Erro na exportação CSV:', error);
            alert('Erro ao exportar CSV. Tente novamente.');
        }
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }
    // ===============================================

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

    // Função para formatar data no formato brasileiro
    function formatDateToBR(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Função para truncar URL longa
    function truncateUrl(url, maxLength = 30) {
        if (!url) return 'N/A';
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    // Carregar postagens e popular a tabela (ATUALIZADA)
    async function fetchPosts() {
        try {
            const response = await fetch(`${API_URL}/api/posts?limit=${postsPerPage}&page=${currentPage}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar postagens da API');
            }
            const data = await response.json();
            const posts = data.posts;
            allPosts = posts; // Armazenar para referência
            
            postsTableBody.innerHTML = '';
            
            posts.forEach(post => {
                const row = postsTableBody.insertRow();
                row.innerHTML = `
                    <td class="checkbox-column">
                        <input type="checkbox" class="post-checkbox" value="${post.id}">
                    </td>
                    <td class="author-column">${post.author || 'N/A'}</td>
                    <td class="image-column">
                        <a href="${post.image_url}" target="_blank" class="image-link" title="${post.image_url}">
                            ${truncateUrl(post.image_url)}
                        </a>
                    </td>
                    <td class="date-column">${formatDateToBR(post.created_at)}</td>
                    <td class="date-column">${formatDateToBR(post.photo_date)}</td>
                    <td class="admin-buttons">
                        <button class="edit-btn" data-id="${post.id}">Editar</button>
                        <button class="delete-btn" data-id="${post.id}">Excluir</button>
                    </td>
                `;
                
                // Adicionar event listeners
                const checkbox = row.querySelector('.post-checkbox');
                checkbox.addEventListener('change', handleIndividualCheckbox);
                
                row.querySelector('.edit-btn').addEventListener('click', () => openEditModal(post));
                row.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id));
            });
            
            // Resetar estados de seleção
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            updateBulkDeleteButton();
            
        } catch (error) {
            console.error('Erro ao buscar postagens:', error);
            alert('Erro ao buscar postagens. Verifique sua conexão ou a API.');
        }
    }
});
