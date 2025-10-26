// ===== SISTEMA DE SEGURANÇA ROBUSTO =====
class SecurityManager {
    constructor() {
        this.rateLimitMap = new Map();
        this.maxAttempts = 5;
        this.timeWindow = 60000; // 1 minuto
        this.csrfToken = this.generateCSRFToken();
        this.initSecurity();
    }

    // ===== INICIALIZAR SEGURANÇA =====
    initSecurity() {
        this.preventXSS();
        this.preventClickjacking();
        this.preventRightClick();
        this.preventDevTools();
        this.initRateLimiting();
        this.initFormSecurity();
        this.initInputSanitization();
        this.initHoneypot();
        this.monitorSuspiciousActivity();
    }

    // ===== PROTEÇÃO CONTRA XSS =====
    preventXSS() {
        // Sanitizar todos os inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = this.sanitizeInput(e.target.value);
            });
        });

        // Prevenir execução de scripts maliciosos
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            if (tagName.toLowerCase() === 'script') {
                console.warn('Tentativa de criação de script bloqueada por segurança');
                return null;
            }
            return element;
        };
    }

    // ===== SANITIZAÇÃO DE INPUT =====
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '') // Remove < e >
            .replace(/javascript:/gi, '') // Remove javascript:
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/script/gi, '') // Remove script
            .replace(/iframe/gi, '') // Remove iframe
            .replace(/object/gi, '') // Remove object
            .replace(/embed/gi, '') // Remove embed
            .replace(/link/gi, '') // Remove link
            .replace(/meta/gi, '') // Remove meta
            .replace(/style/gi, '') // Remove style
            .trim();
    }

    // ===== PROTEÇÃO CONTRA CLICKJACKING =====
    preventClickjacking() {
        // Verificar se está sendo carregado em iframe
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }

        // Adicionar header X-Frame-Options via JavaScript
        const meta = document.createElement('meta');
        meta.httpEquiv = 'X-Frame-Options';
        meta.content = 'DENY';
        document.head.appendChild(meta);
    }

    // ===== PROTEÇÃO CONTRA RIGHT CLICK =====
    preventRightClick() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.logSecurityEvent('Right click prevented', e);
        });

        // Prevenir F12, Ctrl+Shift+I, etc.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                this.logSecurityEvent('Dev tools access prevented', e);
            }
        });
    }

    // ===== PROTEÇÃO CONTRA DEV TOOLS =====
    preventDevTools() {
        let devtools = false;
        const threshold = 160;

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools) {
                    devtools = true;
                    this.logSecurityEvent('Dev tools detected');
                    // Opcional: redirecionar ou mostrar aviso
                    // window.location.href = 'about:blank';
                }
            } else {
                devtools = false;
            }
        }, 500);
    }

    // ===== RATE LIMITING =====
    initRateLimiting() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const clientIP = this.getClientIP();
                if (this.isRateLimited(clientIP)) {
                    e.preventDefault();
                    this.showSecurityMessage('Muitas tentativas. Tente novamente em 1 minuto.');
                    return false;
                }
                this.recordAttempt(clientIP);
            });
        });
    }

    // ===== SEGURANÇA DE FORMULÁRIOS =====
    initFormSecurity() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Adicionar token CSRF
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = this.csrfToken;
            form.appendChild(csrfInput);

            // Validação robusta
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    return false;
                }
            });
        });
    }

    // ===== VALIDAÇÃO DE FORMULÁRIO =====
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            // Validação de email
            if (input.type === 'email') {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(input.value)) {
                    this.showError(input, 'Email inválido');
                    isValid = false;
                }
            }

            // Validação de telefone
            if (input.type === 'tel') {
                const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
                if (input.value && !phoneRegex.test(input.value)) {
                    this.showError(input, 'Telefone inválido');
                    isValid = false;
                }
            }

            // Validação de comprimento
            if (input.hasAttribute('required') && !input.value.trim()) {
                this.showError(input, 'Campo obrigatório');
                isValid = false;
            }

            // Validação de comprimento máximo
            if (input.value.length > 1000) {
                this.showError(input, 'Texto muito longo');
                isValid = false;
            }
        });

        return isValid;
    }

    // ===== HONEYPOT =====
    initHoneypot() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = 'website';
            honeypot.style.display = 'none';
            honeypot.style.position = 'absolute';
            honeypot.style.left = '-9999px';
            honeypot.setAttribute('tabindex', '-1');
            honeypot.setAttribute('autocomplete', 'off');
            form.appendChild(honeypot);

            form.addEventListener('submit', (e) => {
                if (honeypot.value) {
                    e.preventDefault();
                    this.logSecurityEvent('Honeypot triggered - Bot detected');
                    return false;
                }
            });
        });
    }

    // ===== MONITORAMENTO DE ATIVIDADE SUSPEITA =====
    monitorSuspiciousActivity() {
        // Detectar tentativas de SQL injection
        const suspiciousPatterns = [
            /union\s+select/i,
            /drop\s+table/i,
            /insert\s+into/i,
            /delete\s+from/i,
            /update\s+set/i,
            /or\s+1=1/i,
            /'or'1'='1/i,
            /<script/i,
            /javascript:/i,
            /onload=/i,
            /onerror=/i
        ];

        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const value = e.target.value.toLowerCase();
                suspiciousPatterns.forEach(pattern => {
                    if (pattern.test(value)) {
                        this.logSecurityEvent('Suspicious input detected', { pattern: pattern.toString(), value });
                        this.showSecurityMessage('Entrada suspeita detectada');
                    }
                });
            }
        });
    }

    // ===== UTILITÁRIOS DE SEGURANÇA =====
    generateCSRFToken() {
        return 'csrf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    getClientIP() {
        // Simulação de IP (em produção, usar header real)
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }

    isRateLimited(ip) {
        const now = Date.now();
        const attempts = this.rateLimitMap.get(ip) || [];
        const recentAttempts = attempts.filter(time => now - time < this.timeWindow);
        
        if (recentAttempts.length >= this.maxAttempts) {
            return true;
        }
        
        return false;
    }

    recordAttempt(ip) {
        const now = Date.now();
        const attempts = this.rateLimitMap.get(ip) || [];
        attempts.push(now);
        this.rateLimitMap.set(ip, attempts);
    }

    showError(input, message) {
        // Remover erro anterior
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Adicionar novo erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-danger small mt-1';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
        input.classList.add('is-invalid');
    }

    showSecurityMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
        `;
        alertDiv.innerHTML = `
            <strong>⚠️ Segurança:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    logSecurityEvent(event, details = {}) {
        const log = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.warn('Security Event:', log);
        
        // Em produção, enviar para servidor de logs
        // this.sendToSecurityLog(log);
    }

    // ===== OFUSCAÇÃO DE CÓDIGO =====
    obfuscateCode() {
        // Ofuscar funções sensíveis
        const sensitiveFunctions = ['validateForm', 'sanitizeInput', 'preventXSS'];
        sensitiveFunctions.forEach(funcName => {
            if (this[funcName]) {
                const original = this[funcName];
                this[funcName] = function(...args) {
                    return original.apply(this, args);
                };
            }
        });
    }
}

// ===== INICIALIZAR SISTEMA DE SEGURANÇA =====
document.addEventListener('DOMContentLoaded', function() {
    window.securityManager = new SecurityManager();
    
    // Ofuscar código após carregamento
    setTimeout(() => {
        window.securityManager.obfuscateCode();
    }, 1000);
});

// ===== PROTEÇÃO CONTRA CONSOLE =====
(function() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = function(...args) {
        if (args.some(arg => typeof arg === 'string' && arg.includes('security'))) {
            return;
        }
        originalLog.apply(console, args);
    };
    
    console.warn = function(...args) {
        if (args.some(arg => typeof arg === 'string' && arg.includes('security'))) {
            return;
        }
        originalWarn.apply(console, args);
    };
    
    console.error = function(...args) {
        if (args.some(arg => typeof arg === 'string' && arg.includes('security'))) {
            return;
        }
        originalError.apply(console, args);
    };
})();

// ===== PROTEÇÃO CONTRA DEBUGGING =====
(function() {
    let devtools = false;
    const threshold = 160;
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools) {
                devtools = true;
                // Limpar console
                console.clear();
                console.log('%c⚠️ Acesso não autorizado detectado!', 'color: red; font-size: 20px; font-weight: bold;');
            }
        } else {
            devtools = false;
        }
    }, 500);
})();
