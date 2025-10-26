// ===== CONFIGURAÇÕES GERAIS =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas as funcionalidades
    initScrollSpy();
    initSmoothScroll();
    initGalleryModal();
    initContactForm();
    initNavbarScroll();
    initAnimations();
});

// ===== SCROLL SPY PARA NAVEGAÇÃO =====
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

// ===== SCROLL SUAVE ENTRE SEÇÕES =====
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Ajuste para navbar fixa
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== MODAL DA GALERIA =====
function initGalleryModal() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                modalImage.src = img.src;
                modalImage.alt = img.alt;
            }
        });
    });
}

// ===== FORMULÁRIO DE CONTATO =====
function initContactForm() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Coletar dados do formulário
            const formData = new FormData(form);
            const data = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value,
                assunto: document.getElementById('assunto').value,
                mensagem: document.getElementById('mensagem').value
            };
            
            // Validação básica
            if (!data.nome || !data.email || !data.mensagem) {
                showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
                return;
            }
            
            if (!isValidEmail(data.email)) {
                showAlert('Por favor, insira um email válido.', 'warning');
                return;
            }
            
            // Simular envio (aqui você integraria com um backend real)
            showAlert('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
            form.reset();
        });
    }
}

// ===== VALIDAÇÃO DE EMAIL =====
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== SISTEMA DE ALERTAS =====
function showAlert(message, type = 'info') {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Criar novo alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// ===== NAVBAR SCROLL EFFECT =====
function initNavbarScroll() {
    const navbar = document.querySelector('.custom-navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'linear-gradient(135deg, rgba(0, 180, 216, 0.95), rgba(0, 119, 182, 0.95))';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, #00B4D8, #0077B6)';
            navbar.style.backdropFilter = 'none';
        }
    });
}

// ===== ANIMAÇÕES AO SCROLL =====
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animação
    const animatedElements = document.querySelectorAll('.card, .gallery-item, .section-title');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// ===== CARROSSEL CUSTOMIZADO =====
function initCustomCarousel() {
    const carousel = document.getElementById('heroCarousel');
    if (carousel) {
        // Adicionar autoplay
        const carouselInstance = new bootstrap.Carousel(carousel, {
            interval: 5000,
            wrap: true
        });
        
        // Pausar autoplay no hover
        carousel.addEventListener('mouseenter', function() {
            carouselInstance.pause();
        });
        
        carousel.addEventListener('mouseleave', function() {
            carouselInstance.cycle();
        });
    }
}

// ===== MÁSCARA PARA TELEFONE =====
function initPhoneMask() {
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            e.target.value = value;
        });
    }
}

// ===== CONTADOR DE CARACTERES =====
function initCharacterCounter() {
    const textarea = document.getElementById('mensagem');
    if (textarea) {
        const maxLength = 500;
        const counter = document.createElement('small');
        counter.className = 'text-muted';
        counter.style.float = 'right';
        textarea.parentNode.appendChild(counter);
        
        function updateCounter() {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} caracteres restantes`;
            
            if (remaining < 50) {
                counter.className = 'text-warning';
            } else {
                counter.className = 'text-muted';
            }
        }
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
    }
}

// ===== LAZY LOADING PARA IMAGENS =====
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ===== BOTÃO VOLTAR AO TOPO =====
function initBackToTop() {
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.className = 'back-to-top';
    backToTopButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00B4D8, #0077B6);
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(backToTopButton);
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.opacity = '1';
            backToTopButton.style.visibility = 'visible';
        } else {
            backToTopButton.style.opacity = '0';
            backToTopButton.style.visibility = 'hidden';
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== INICIALIZAR FUNCIONALIDADES ADICIONAIS =====
document.addEventListener('DOMContentLoaded', function() {
    initCustomCarousel();
    initPhoneMask();
    initCharacterCounter();
    initLazyLoading();
    initBackToTop();
});

// ===== UTILITÁRIOS =====
function debounce(func, wait) {
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

// ===== PERFORMANCE =====
// Otimizar scroll events
const optimizedScrollHandler = debounce(function() {
    // Código de scroll otimizado aqui
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);
