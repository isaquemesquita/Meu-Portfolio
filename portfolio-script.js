// ===== CONFIGURAÇÕES GERAIS =====
"use strict";

let audioContext = null;

function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(frequency, type = 'sine', duration = 0.25) {
    try {
        if (!audioContext) initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Ambiente sem WebAudio - silencioso
    }
}

// ===== LIGHT SWITCH MODULE =====
const LightSwitch = {
    state: {
        isDragging: false,
        startY: 0,
        currentY: 0,
        isLightOn: false,
        animationFrame: null
    },

    config: {
        maxPull: 150,
        swayAmount: 3,
        swaySpeed: 2000
    },

        // physics state for spring
        physics: {
            velocity: 0,
            mass: 1,
            stiffness: 0.08, // spring strength
            damping: 0.85
        },

            // painel de ajustes para desenvolvimento (toggle com tecla K)
            debugPanel: null,

    elements: {},

    init() {
        this.elements.chain = document.querySelector('.chain');
        this.elements.handle = document.querySelector('.chain-handle');
        this.elements.overlay = document.getElementById('darkOverlay');
        this.elements.handleLight = document.querySelector('.handle-light');

        this.bindEvents();
        this.updateSwing();
            this.createDebugPanel();
    },

        createDebugPanel() {
            // painel simples para ajustar parâmetros
            const panel = document.createElement('div');
            panel.style.cssText = 'position:fixed;left:10px;bottom:10px;background:rgba(0,0,0,0.75);color:#fff;padding:10px;border-radius:8px;z-index:10001;font-size:13px;display:none;min-width:220px';
            panel.innerHTML = `
                <div style="margin-bottom:6px;font-weight:600">Physics Tuner</div>
                <label>stiffness <span id="_stiff">${this.physics.stiffness}</span></label>
                <input id="inp_stiff" type="range" min="0.01" max="0.3" step="0.01" value="${this.physics.stiffness}" style="width:100%" />
                <label>damping <span id="_damp">${this.physics.damping}</span></label>
                <input id="inp_damp" type="range" min="0.7" max="0.99" step="0.01" value="${this.physics.damping}" style="width:100%" />
                <label>maxPull <span id="_maxp">${this.config.maxPull}</span></label>
                <input id="inp_maxp" type="range" min="60" max="300" step="1" value="${this.config.maxPull}" style="width:100%" />
                <div style="text-align:right;margin-top:6px"><button id="closeTun" style="background:#2563eb;border:none;color:#fff;padding:6px 8px;border-radius:4px;cursor:pointer">Fechar</button></div>
            `;

            document.body.appendChild(panel);
            this.debugPanel = panel;

            const inpSt = panel.querySelector('#inp_stiff');
            const inpDp = panel.querySelector('#inp_damp');
            const inpMp = panel.querySelector('#inp_maxp');
            const spanSt = panel.querySelector('#_stiff');
            const spanDp = panel.querySelector('#_damp');
            const spanMp = panel.querySelector('#_maxp');
            const btnClose = panel.querySelector('#closeTun');

            inpSt.addEventListener('input', (e) => {
                this.physics.stiffness = parseFloat(e.target.value);
                spanSt.textContent = this.physics.stiffness.toFixed(2);
            });
            inpDp.addEventListener('input', (e) => {
                this.physics.damping = parseFloat(e.target.value);
                spanDp.textContent = this.physics.damping.toFixed(2);
            });
            inpMp.addEventListener('input', (e) => {
                this.config.maxPull = parseInt(e.target.value, 10);
                spanMp.textContent = this.config.maxPull;
            });

            btnClose.addEventListener('click', () => panel.style.display = 'none');

            // toggle com K
            document.addEventListener('keydown', (ev) => {
                if (ev.key.toLowerCase() === 'k') {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            });
        },

    bindEvents() {
        if (this.elements.handle) {
            this.elements.handle.addEventListener('mousedown', this.handleStart.bind(this));
            this.elements.handle.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        }

        document.addEventListener('mousemove', (e) => {
            this.handleMove(e);
            this.updateHandleLight(e);
        });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        document.addEventListener('touchend', this.handleEnd.bind(this));
    },

    updateChainPosition() {
            if (!this.elements.chain || !this.elements.handle) return;
            const rotation = this.state.currentY * 0.08; // leve rotação baseada no pull
            const translateY = this.state.currentY;
            // Aplicar both translateY e rotation para que a corrente suba junto com a maçaneta
            this.elements.chain.style.transform = `translateX(-50%) translateY(${translateY}px) rotate(${rotation}deg)`;
            this.elements.handle.style.transform = `translateY(${translateY}px)`;
    },

        // Atualiza física da mola a cada frame para suavizar movimentos
        updatePhysics() {
            // target é a posição atual desejada (state.currentY), pos é posição atual visual armazenada em physics.pos
            if (typeof this.physics.pos === 'undefined') this.physics.pos = 0;
            const target = this.state.currentY || 0;
            const displacement = target - this.physics.pos;
            // apply spring force
            const force = displacement * this.physics.stiffness;
            const accel = force / this.physics.mass;
            this.physics.velocity = (this.physics.velocity + accel) * this.physics.damping;
            this.physics.pos += this.physics.velocity;

            // aplicar ao DOM
            const rot = this.physics.pos * 0.06;
            if (this.elements.chain) this.elements.chain.style.transform = `translateX(-50%) translateY(${this.physics.pos}px) rotate(${rot}deg)`;
            if (this.elements.handle) this.elements.handle.style.transform = `translateY(${this.physics.pos}px)`;
        },

    resetChainPosition() {
        if (!this.elements.chain || !this.elements.handle) return;
        playSound(180, 'sine', 0.25);
        this.elements.handle.style.transition = 'transform 0.5s ease';
        this.elements.handle.style.transform = 'translateY(0)';
        this.elements.chain.style.transition = 'transform 0.5s ease';
            this.elements.chain.style.transform = 'translateX(-50%) translateY(0px) rotate(0deg)';
        setTimeout(() => {
            if (this.elements.handle) this.elements.handle.style.transition = '';
            if (this.elements.chain) this.elements.chain.style.transition = '';
        }, 500);
    },

    createLightEffect() {
        const flash = document.createElement('div');
        flash.style.cssText = 'position: fixed;top:0;left:0;width:100%;height:100%;background:#fff;opacity:0;z-index:9999;pointer-events:none;transition:opacity 0.12s ease;';
        document.body.appendChild(flash);
        requestAnimationFrame(() => {
            flash.style.opacity = '0.85';
            setTimeout(() => {
                flash.style.opacity = '0';
                if (this.elements.overlay) this.elements.overlay.style.opacity = '0';
                setTimeout(() => flash.remove(), 900);
                // revela o site
                initAllFeatures();
            }, 120);
        });
    },

    turnOnLights() {
        if (this.state.isLightOn) return;
        this.state.isLightOn = true;
        playSound(220, 'triangle', 0.35);
        this.createLightEffect();
    },

    handleStart(e) {
        if (this.state.isLightOn) return;
        e.preventDefault();
        this.state.isDragging = true;
        this.state.startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        this.state.currentY = 0;
        if (this.elements.handle) this.elements.handle.style.cursor = 'grabbing';
        playSound(140, 'triangle', 0.18);
            // desativar animação CSS para o JS controlar o transform
            if (this.elements.chain) {
                this.elements.chain.style.animation = 'none';
                this.elements.chain.style.transition = '';
            }
    },

    handleMove(e) {
        if (!this.state.isDragging || this.state.isLightOn) return;
        e.preventDefault();
        const y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const deltaY = y - this.state.startY;
        this.state.currentY = Math.max(0, Math.min(deltaY, this.config.maxPull));
        this.updateChainPosition();
        if (this.state.currentY >= this.config.maxPull - 20) this.turnOnLights();
    },

    handleEnd() {
        if (!this.state.isDragging) return;
        this.state.isDragging = false;
        if (this.elements.handle) this.elements.handle.style.cursor = 'grab';
        if (!this.state.isLightOn) this.resetChainPosition();
            // reativar animação CSS após soltar
            if (this.elements.chain) {
                // pequeno delay para permitir a transição de retorno
                setTimeout(() => {
                    this.elements.chain.style.animation = '';
                }, 50);
            }
    },

    updateHandleLight(e) {
        if (!this.elements.handleLight || !this.elements.handle || !e) return;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const handle = this.elements.handle.getBoundingClientRect();
        const cx = handle.left + handle.width / 2;
        const cy = handle.top + handle.height / 2;
        const angle = Math.atan2(mouseY - cy, mouseX - cx);
        const distance = Math.min(100, Math.hypot(mouseX - cx, mouseY - cy));
        this.elements.handleLight.style.background = `radial-gradient(circle at ${50 + Math.cos(angle) * 20}% ${50 + Math.sin(angle) * 20}%, rgba(255,255,255,${0.8 - distance/200}) 0%, rgba(255,255,255,${0.2 - distance/200}) 50%, transparent 70%)`;
    },

    updateSwing() {
            // Physics-driven update when dragging; otherwise simple sway
            if (this.state.isDragging) {
                this.updatePhysics();
            } else {
                if (this.elements.chain) {
                    const time = Date.now() / this.config.swaySpeed;
                    const swayAngle = Math.sin(time) * this.config.swayAmount;
                    const translateY = this.physics.pos || 0;
                    this.elements.chain.style.transform = `translateX(-50%) translateY(${translateY}px) rotate(${swayAngle}deg)`;
                }
                // apply small decay to physics.pos when not dragging so it returns smoothly
                if (this.physics.pos && Math.abs(this.physics.pos) > 0.01) {
                    this.physics.velocity *= 0.9;
                    this.physics.pos += this.physics.velocity;
                } else {
                    this.physics.pos = 0;
                    this.physics.velocity = 0;
                }
            }
            this.state.animationFrame = requestAnimationFrame(this.updateSwing.bind(this));
    }
};

// Inicializar o interruptor quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    LightSwitch.init();
});

// ===== FUNÇÕES DE INICIALIZAÇÃO E UTILITÁRIOS =====
function initAllFeatures() {
    initAOS();
    initScrollSpy();
    initSmoothScroll();
    initNavbarScroll();
    initBackToTop();
    initTypingEffect();
    initParticleEffect();
    initContactAnimations();
}


// ===== INICIALIZAR AOS (Animate On Scroll) =====
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }
}

// ===== SCROLL SPY PARA NAVEGAÇÃO =====
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
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
                const offsetTop = targetSection.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Fechar menu mobile se estiver aberto
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    navbarToggler.click();
                }
            }
        });
    });
}

// ===== EFEITO DE SCROLL NA NAVBAR =====
function initNavbarScroll() {
    const navbar = document.querySelector('.custom-navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
    });
}

// ===== BOTÃO VOLTAR AO TOPO =====
function initBackToTop() {
    // Criar botão
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.className = 'back-to-top';
    backToTopButton.setAttribute('aria-label', 'Voltar ao topo');
    document.body.appendChild(backToTopButton);
    
    // Mostrar/esconder botão
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
    
    // Ação do botão
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== EFEITO DE DIGITAÇÃO =====
function initTypingEffect() {
    const typingElement = document.querySelector('.hero-subtitle');
    if (!typingElement) return;
    
    const originalText = typingElement.innerHTML;
    const texts = [
        'Desenvolvedor. Visionário. Futuro founder.',
        'Transformando ideias em realidade, um projeto por vez.',
        'Criando soluções digitais que fazem a diferença.',
        'Desenvolvimento web moderno e responsivo.'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function typeText() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingElement.innerHTML = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.innerHTML = currentText.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000; // Pausa no final
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
        }
        
        setTimeout(typeText, typeSpeed);
    }
    
    // Iniciar efeito após 2 segundos
    setTimeout(typeText, 2000);
}

// ===== EFEITO DE PARTÍCULAS =====
function initParticleEffect() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    // Criar canvas para partículas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    heroSection.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = heroSection.offsetWidth;
        canvas.height = heroSection.offsetHeight;
    }
    
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        };
    }
    
    function initParticles() {
        particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push(createParticle());
        }
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(37, 99, 235, ${particle.opacity})`;
            ctx.fill();
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    resizeCanvas();
    initParticles();
    animateParticles();
    
    window.addEventListener('resize', resizeCanvas);
}

// ===== ANIMAÇÕES DE CONTATO =====
function initContactAnimations() {
    const contactItems = document.querySelectorAll('.contact-item');
    
    contactItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ===== EFEITO DE HOVER NOS CARDS =====
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.skill-card, .project-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });
    });
}

// ===== CONTADOR DE ESTATÍSTICAS =====
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 segundos
                const increment = target / (duration / 16); // 60fps
                let current = 0;
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

// ===== VALIDAÇÃO DE FORMULÁRIO =====
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Validação básica
            if (!data.nome || !data.email || !data.mensagem) {
                showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }
            
            if (!isValidEmail(data.email)) {
                showNotification('Por favor, insira um email válido.', 'error');
                return;
            }
            
            // Simular envio
            showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
            form.reset();
        });
    });
}

// ===== VALIDAÇÃO DE EMAIL =====
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== SISTEMA DE NOTIFICAÇÕES =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// ===== LAZY LOADING DE IMAGENS =====
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

// ===== PERFORMANCE =====
// Debounce para otimizar eventos de scroll
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

// Otimizar scroll events
const optimizedScrollHandler = debounce(function() {
    // Código de scroll otimizado aqui
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);

// ===== INICIALIZAR FUNCIONALIDADES ADICIONAIS =====
document.addEventListener('DOMContentLoaded', function() {
    initCardHoverEffects();
    initCounters();
    initFormValidation();
    initLazyLoading();
});

// ===== UTILITÁRIOS =====
function smoothScrollTo(element, duration = 1000) {
    const targetPosition = element.offsetTop - 80;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    requestAnimationFrame(animation);
}

// ===== DETECÇÃO DE DISPOSITIVO MÓVEL =====
function isMobile() {
    return window.innerWidth <= 768;
}

// ===== PRELOADER (OPCIONAL) =====
function initPreloader() {
    const preloader = document.createElement('div');
    preloader.id = 'preloader';
    preloader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
    `;
    
    preloader.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 50px; height: 50px; border: 3px solid #e2e8f0; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="color: #64748b; font-weight: 500;">Carregando...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(preloader);
    
    window.addEventListener('load', function() {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.remove();
        }, 500);
    });
}

// Inicializar preloader se necessário
// initPreloader();
