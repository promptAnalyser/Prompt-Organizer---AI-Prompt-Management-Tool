// Sample prompts to preload on first use
const samplePrompts = [
    {
        id: '1',
        title: 'Creative Story Starter',
        text: 'Write a short story about a time traveler who accidentally changes one small event in the past and returns to find the present completely altered. Focus on the emotional impact of seeing familiar people and places transformed.',
        category: 'Creative',
        tags: ['fiction', 'time travel', 'emotional']
    },
    {
        id: '2',
        title: 'Python Code Debugger',
        text: 'I have this Python code that\'s not working as expected: [paste code here]. Can you analyze it, explain what\'s wrong, and provide a corrected version with comments explaining the changes?',
        category: 'Technical',
        tags: ['python', 'debugging', 'coding']
    },
    {
        id: '3',
        title: 'Business Email Draft',
        text: 'Compose a professional email to a client explaining that their project deadline needs to be extended by two weeks due to unforeseen circumstances. The tone should be apologetic but confident, emphasizing our commitment to quality and offering a small discount or bonus for the inconvenience.',
        category: 'Business',
        tags: ['communication', 'client relations']
    },
    {
        id: '4',
        title: 'Science Lesson Plan',
        text: 'Create a 45-minute lesson plan for 8th grade students about photosynthesis. Include an engaging opening activity, clear explanations of key concepts, a hands-on experiment or demonstration, and a formative assessment to check for understanding.',
        category: 'Education',
        tags: ['teaching', 'biology', 'lesson planning']
    },
    {
        id: '5',
        title: 'Fitness Motivation',
        text: 'I\'m struggling to stay motivated with my workout routine. Generate a personalized pep talk that addresses common excuses (too tired, not enough time, not seeing results) and provides practical strategies to overcome each one, tailored to someone with a busy office job.',
        category: 'Other',
        tags: ['health', 'motivation', 'self-improvement']
    }
];

// DOM Elements
const promptsList = document.getElementById('prompts-list');
const newPromptBtn = document.getElementById('new-prompt-btn');
const promptModal = document.getElementById('prompt-modal');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const promptForm = document.getElementById('prompt-form');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');

// Form fields
const promptIdField = document.getElementById('prompt-id');
const promptTitleField = document.getElementById('prompt-title');
const promptTextField = document.getElementById('prompt-text');
const promptCategoryField = document.getElementById('prompt-category');
const promptTagsField = document.getElementById('prompt-tags');

// Current state
let prompts = [];
let isEditMode = false;

// Initialize the app
function init() {
    loadPrompts();
    renderPrompts();
    setupEventListeners();
    trackAdImpression();
}

// Load prompts from localStorage or initialize with sample prompts
function loadPrompts() {
    try {
        const savedPrompts = localStorage.getItem('aiPrompts');
        
        if (savedPrompts) {
            prompts = JSON.parse(savedPrompts);
            // Validate loaded prompts
            if (!Array.isArray(prompts)) {
                throw new Error('Invalid prompts format in localStorage');
            }
        } else {
            prompts = [...samplePrompts];
            savePrompts();
        }
    } catch (error) {
        console.error('Error loading prompts:', error);
        // Reset to sample prompts if there's an error
        prompts = [...samplePrompts];
        savePrompts();
    }
}

// Save prompts to localStorage
function savePrompts() {
    try {
        localStorage.setItem('aiPrompts', JSON.stringify(prompts));
    } catch (error) {
        console.error('Error saving prompts:', error);
        showToast('Error saving prompts', 'error');
    }
}

// Render prompts to the DOM
function renderPrompts(filteredPrompts = null) {
    const promptsToRender = filteredPrompts || prompts;
    
    if (!promptsToRender || !Array.isArray(promptsToRender)) {
        promptsList.innerHTML = '<p class="no-prompts">Error loading prompts. Please refresh the page.</p>';
        return;
    }
    
    if (promptsToRender.length === 0) {
        promptsList.innerHTML = '<p class="no-prompts">No prompts found. Create your first prompt!</p>';
        return;
    }
    
    promptsList.innerHTML = promptsToRender.map(prompt => {
        // Validate prompt structure before rendering
        const isValidPrompt = prompt.id && prompt.title && prompt.text && prompt.category;
        if (!isValidPrompt) return '';
        
        return `
            <div class="prompt-card" data-id="${prompt.id}">
                <span class="category">${prompt.category}</span>
                <h3>${prompt.title}</h3>
                <p>${prompt.text}</p>
                <div class="tags">
                    ${(prompt.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="prompt-actions">
                    <button class="btn primary edit-btn">Edit</button>
                    <button class="btn danger delete-btn">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Set up event listeners
function setupEventListeners() {
    newPromptBtn.addEventListener('click', openNewPromptModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    promptForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', filterPrompts);
    categoryFilter.addEventListener('change', filterPrompts);
    exportBtn.addEventListener('click', exportPrompts);
    importBtn.addEventListener('click', triggerImport);
    
    promptsList.addEventListener('click', (e) => {
        const promptCard = e.target.closest('.prompt-card');
        if (!promptCard) return;
        
        const promptId = promptCard.dataset.id;
        
        if (e.target.classList.contains('edit-btn')) {
            editPrompt(promptId);
        } else if (e.target.classList.contains('delete-btn')) {
            deletePrompt(promptId);
        }
    });
}

// Modal functions
function openNewPromptModal() {
    isEditMode = false;
    document.getElementById('modal-title').textContent = 'New Prompt';
    promptForm.reset();
    promptIdField.value = '';
    promptModal.style.display = 'block';
}

function openEditPromptModal(prompt) {
    if (!prompt) return;
    
    isEditMode = true;
    document.getElementById('modal-title').textContent = 'Edit Prompt';
    promptIdField.value = prompt.id;
    promptTitleField.value = prompt.title || '';
    promptTextField.value = prompt.text || '';
    promptCategoryField.value = prompt.category || 'Other';
    promptTagsField.value = (prompt.tags || []).join(', ');
    promptModal.style.display = 'block';
}

function closeModal() {
    promptModal.style.display = 'none';
}

// Form handling
function handleFormSubmit(e) {
    e.preventDefault();
    
    const promptData = {
        title: promptTitleField.value.trim(),
        text: promptTextField.value.trim(),
        category: promptCategoryField.value,
        tags: promptTagsField.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    // Basic validation
    if (!promptData.title || !promptData.text) {
        showToast('Title and prompt text are required', 'error');
        return;
    }
    
    try {
        if (isEditMode) {
            updatePrompt(promptIdField.value, promptData);
            showToast('Prompt updated successfully', 'success');
        } else {
            createPrompt(promptData);
            showToast('Prompt created successfully', 'success');
        }
        closeModal();
    } catch (error) {
        console.error('Error saving prompt:', error);
        showToast('Error saving prompt', 'error');
    }
}

// CRUD operations
function createPrompt(promptData) {
    const newPrompt = {
        ...promptData,
        id: Date.now().toString()
    };
    
    prompts.unshift(newPrompt);
    savePrompts();
    renderPrompts();
}

function editPrompt(promptId) {
    const promptToEdit = prompts.find(p => p.id === promptId);
    if (promptToEdit) {
        openEditPromptModal(promptToEdit);
    }
}

function updatePrompt(promptId, updatedData) {
    const promptIndex = prompts.findIndex(p => p.id === promptId);
    
    if (promptIndex !== -1) {
        prompts[promptIndex] = {
            ...prompts[promptIndex],
            ...updatedData
        };
        
        savePrompts();
        renderPrompts();
    }
}

function deletePrompt(promptId) {
    if (confirm('Are you sure you want to delete this prompt?')) {
        prompts = prompts.filter(p => p.id !== promptId);
        savePrompts();
        renderPrompts();
        showToast('Prompt deleted', 'success');
    }
}

// Filtering and searching
function filterPrompts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    let filtered = [...prompts];
    
    if (selectedCategory) {
        filtered = filtered.filter(prompt => prompt.category === selectedCategory);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(prompt => 
            (prompt.title && prompt.title.toLowerCase().includes(searchTerm)) ||
            (prompt.text && prompt.text.toLowerCase().includes(searchTerm)) ||
            (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    )}
    
    renderPrompts(filtered);
}

// Export/import functionality
function exportPrompts() {
    try {
        const dataStr = JSON.stringify(prompts, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `ai-prompts-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Prompts exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting prompts:', error);
        showToast('Error exporting prompts', 'error');
    }
}

function triggerImport() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedPrompts = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedPrompts)) {
                    throw new Error('File should contain an array of prompts');
                }
                
                // Validate each prompt in the imported file
                const validPrompts = importedPrompts.filter(prompt => 
                    prompt.id && prompt.title && prompt.text && prompt.category
                );
                
                if (validPrompts.length === 0) {
                    throw new Error('No valid prompts found in the file');
                }
                
                if (validPrompts.length !== importedPrompts.length) {
                    console.warn('Some prompts were invalid and not imported');
                }
                
                const importMessage = `Found ${validPrompts.length} valid prompts to import. Add to existing prompts?`;
                
                if (confirm(importMessage)) {
                    prompts = [...validPrompts, ...prompts];
                    savePrompts();
                    renderPrompts();
                    showToast(`Imported ${validPrompts.length} prompts successfully`, 'success');
                }
            } catch (error) {
                console.error('Error importing prompts:', error);
                showToast(`Import failed: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = () => {
            showToast('Error reading the file', 'error');
        };
        
        reader.readAsText(file);
    });
    
    fileInput.click();
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast styles dynamically
function addToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            background-color: #333;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1000;
        }
        .toast.show {
            opacity: 1;
        }
        .toast-success {
            background-color: #28a745;
        }
        .toast-error {
            background-color: #dc3545;
        }
        .toast-info {
            background-color: #17a2b8;
        }
    `;
    document.head.appendChild(style);
}

// Monetization tracking
function trackAdImpression() {
    // In a real app, you would send this to your analytics
    console.log('Ad impression tracked');
}

// Add toast styles when the page loads
addToastStyles();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
