// MorphFlux Studio - Enhanced Interactive Functionality with Backend Integration

class MorphFluxAppEnhanced {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.indicators = [];
        this.slideInterval = null;
        this.api = window.morphFluxAPI;
        this.auth = window.authManager;
        this.currentFile = null;
        this.uploadProgress = 0;
        
        this.init();
    }
    
    async init() {
        // Initialize authentication first
        await this.auth.init();
        
        this.setupDOM();
        this.bindEvents();
        this.startCarousel();
        this.createParticles();
        this.setupFileUpload();
    }
    
    setupDOM() {
        // Get carousel elements
        this.slides = document.querySelectorAll('.showcase-item');
        this.indicators = document.querySelectorAll('.indicator');
        
        // Get modal elements
        this.modal = document.getElementById('uploadModal');
        this.modalOverlay = this.modal?.querySelector('.modal-overlay');
        this.modalClose = this.modal?.querySelector('.modal-close');
        this.uploadBtn = document.querySelector('.upload-btn');
        this.uploadArea = document.querySelector('.upload-area');
        this.fileInput = document.getElementById('fileInput');
        
        // Get navigation elements
        this.nav = document.querySelector('.nav');
        this.navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    }
    
    bindEvents() {
        // Carousel indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Modal events
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.openModal());
        }
        
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', () => this.closeModal());
        }
        
        // Upload area events
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', () => this.fileInput?.click());
            this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        }
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Navigation smooth scrolling
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Feature card interactions
        this.setupFeatureCards();
        
        // Scroll effects
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Resize handling
        window.addEventListener('resize', () => this.handleResize());
    }

    // Enhanced file upload setup
    setupFileUpload() {
        // Add upload progress indicator
        if (this.uploadArea) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'upload-progress hidden';
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">Uploading...</div>
            `;
            this.uploadArea.appendChild(progressContainer);
        }
    }
    
    // Carousel functionality (unchanged)
    startCarousel() {
        if (this.slides.length === 0) return;
        
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 4000);
        
        // Pause on hover
        const carousel = document.querySelector('.showcase-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => this.pauseCarousel());
            carousel.addEventListener('mouseleave', () => this.resumeCarousel());
        }
    }
    
    pauseCarousel() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
    
    resumeCarousel() {
        if (!this.slideInterval) {
            this.startCarousel();
        }
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateCarousel();
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateCarousel();
        this.pauseCarousel();
        setTimeout(() => this.resumeCarousel(), 2000);
    }
    
    updateCarousel() {
        // Update slides
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
        
        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
    }
    
    // Enhanced modal functionality
    openModal() {
        // Check authentication first
        if (!this.auth.api.isAuthenticated()) {
            this.auth.showRegisterModal();
            return;
        }

        if (this.modal) {
            this.modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Focus management
            setTimeout(() => {
                const firstFocusable = this.modal.querySelector('button, input, [tabindex]');
                if (firstFocusable) firstFocusable.focus();
            }, 100);
        }
    }
    
    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Reset upload area
            this.resetUploadArea();
            
            // Return focus to upload button
            if (this.uploadBtn) {
                this.uploadBtn.focus();
            }
        }
    }

    // Reset upload area to initial state
    resetUploadArea() {
        const preview = document.querySelector('.file-preview');
        if (preview) {
            preview.remove();
        }
        
        const progress = document.querySelector('.upload-progress');
        if (progress) {
            progress.classList.add('hidden');
        }
        
        this.currentFile = null;
        this.uploadProgress = 0;
    }
    
    // Enhanced file handling with backend integration
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.style.borderColor = 'var(--color-neon-purple)';
        this.uploadArea.style.background = 'rgba(139, 92, 246, 0.1)';
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.uploadArea.style.borderColor = '';
        this.uploadArea.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    async processFile(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file.', 'error');
            return;
        }
        
        // Validate file size (max 50MB to match backend)
        if (file.size > 50 * 1024 * 1024) {
            this.showNotification('File size must be less than 50MB.', 'error');
            return;
        }
        
        this.currentFile = file;
        
        // Show success message
        this.showNotification(`Selected: ${file.name}`, 'success');
        
        // Create preview
        this.createImagePreview(file);
    }
    
    createImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview';
            previewContainer.innerHTML = `
                <div class="preview-image">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                </div>
                <div class="preview-info">
                    <p><strong>${file.name}</strong></p>
                    <p>Size: ${this.formatFileSize(file.size)}</p>
                    <div class="preview-actions">
                        <button class="btn btn--secondary btn--sm" onclick="morphFlux.resetUploadArea()">Choose Different File</button>
                        <button class="btn btn--primary btn--sm" onclick="morphFlux.uploadAndTransform()">Upload & Transform</button>
                    </div>
                </div>
            `;
            
            // Replace upload area with preview
            this.uploadArea.parentNode.replaceChild(previewContainer, this.uploadArea);
        };
        reader.readAsDataURL(file);
    }

    // Upload file to backend and start transformation
    async uploadAndTransform() {
        if (!this.currentFile) {
            this.showNotification('No file selected', 'error');
            return;
        }

        try {
            // Show upload progress
            this.showUploadProgress(0);
            
            // Upload file to backend
            const uploadResponse = await this.api.uploadImage(this.currentFile);
            
            if (uploadResponse.success) {
                this.showUploadProgress(100);
                this.showNotification('File uploaded successfully!', 'success');
                
                // Start transformation process
                await this.startTransformation(uploadResponse.data.image.id);
            } else {
                throw new Error(uploadResponse.error || 'Upload failed');
            }
        } catch (error) {
            this.showNotification(`Upload failed: ${error.message}`, 'error');
            this.hideUploadProgress();
        }
    }

    // Show upload progress
    showUploadProgress(percentage) {
        const progress = document.querySelector('.upload-progress');
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progress && progressFill && progressText) {
            progress.classList.remove('hidden');
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = percentage === 100 ? 'Upload complete!' : `Uploading... ${percentage}%`;
        }
    }

    // Hide upload progress
    hideUploadProgress() {
        const progress = document.querySelector('.upload-progress');
        if (progress) {
            progress.classList.add('hidden');
        }
    }

    // Start transformation process
    async startTransformation(imageId) {
        try {
            // For now, we'll simulate the transformation process
            // In the future, this will call the AI service
            this.showNotification('Transformation started! Processing your image...', 'info');
            
            // Simulate processing time
            setTimeout(() => {
                this.showNotification('Transformation complete! Check your gallery for results.', 'success');
                this.closeModal();
            }, 3000);
            
        } catch (error) {
            this.showNotification(`Transformation failed: ${error.message}`, 'error');
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Navigation (unchanged)
    handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const navHeight = this.nav.offsetHeight;
            const targetPosition = targetElement.offsetTop - navHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
    
    handleScroll() {
        // Navigation background effect
        if (window.scrollY > 100) {
            this.nav.style.background = 'rgba(15, 15, 35, 0.95)';
        } else {
            this.nav.style.background = 'rgba(15, 15, 35, 0.9)';
        }
        
        // Parallax effect for hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            const scrolled = window.scrollY;
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
        
        // Animate elements on scroll
        this.animateOnScroll();
    }
    
    animateOnScroll() {
        const elements = document.querySelectorAll('.feature-card, .example-card, .pricing-card');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Feature cards (unchanged)
    setupFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach(card => {
            // Initial state for animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            
            // Hover effects
            card.addEventListener('mouseenter', () => {
                this.animateFeatureCard(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateFeatureCard(card, false);
            });
            
            // Click effect
            card.addEventListener('click', () => {
                this.showFeatureDemo(card);
            });
        });
    }
    
    animateFeatureCard(card, isHover) {
        const icon = card.querySelector('.feature-icon');
        
        if (isHover) {
            icon.style.transform = 'scale(1.2) rotate(5deg)';
            card.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.3)';
        } else {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }
    
    showFeatureDemo(card) {
        const featureName = card.querySelector('h4').textContent;
        this.showNotification(`${featureName} demo - Coming soon!`, 'info');
    }
    
    // Particles animation (unchanged)
    createParticles() {
        const particles = document.querySelector('.particles');
        if (!particles) return;
        
        // Create additional particle elements
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: var(--color-neon-cyan);
                border-radius: 50%;
                animation: particleFloat ${6 + Math.random() * 4}s linear infinite;
                animation-delay: -${Math.random() * 6}s;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                opacity: 0;
            `;
            particles.appendChild(particle);
        }
    }
    
    // Utility functions
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--color-dark-surface);
            border: 1px solid var(--color-neon-purple);
            border-radius: 8px;
            padding: 16px 20px;
            color: var(--color-text);
            z-index: 3000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        `;
        
        // Set border color based on type
        switch (type) {
            case 'error':
                notification.style.borderColor = 'var(--color-red-400)';
                break;
            case 'success':
                notification.style.borderColor = 'var(--color-teal-300)';
                break;
            default:
                notification.style.borderColor = 'var(--color-neon-purple)';
        }
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    handleKeyDown(e) {
        // Close modal with Escape key
        if (e.key === 'Escape' && !this.modal?.classList.contains('hidden')) {
            this.closeModal();
        }
        
        // Carousel navigation with arrow keys
        if (e.key === 'ArrowLeft') {
            this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
            this.updateCarousel();
        } else if (e.key === 'ArrowRight') {
            this.nextSlide();
        }
    }
    
    handleResize() {
        // Recalculate positions if needed
        this.updateCarousel();
    }
}

// Initialize the enhanced application
let morphFlux;

document.addEventListener('DOMContentLoaded', async () => {
    morphFlux = new MorphFluxAppEnhanced();
    
    // Add smooth scroll behavior to all internal links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading animation to buttons
    document.querySelectorAll('.btn--primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Don't add loading state to upload button or if it already has loading
            if (this.classList.contains('upload-btn') || this.classList.contains('loading')) {
                return;
            }
            
            // Add loading state
            this.classList.add('loading');
            const originalText = this.innerHTML;
            this.innerHTML = '<span style="display: flex; align-items: center; gap: 8px;"><span class="spinner"></span>Processing...</span>';
            
            // Add spinner styles
            const style = document.createElement('style');
            style.textContent = `
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            if (!document.querySelector('style[data-spinner]')) {
                style.setAttribute('data-spinner', '');
                document.head.appendChild(style);
            }
            
            // Reset after 2 seconds
            setTimeout(() => {
                this.classList.remove('loading');
                this.innerHTML = originalText;
            }, 2000);
        });
    });
    
    // Add hover effects to pricing cards
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = this.classList.contains('featured') ? 'scale(1.05) translateY(-5px)' : 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = this.classList.contains('featured') ? 'scale(1.05)' : 'translateY(0)';
        });
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .example-card, .tech-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(el);
    });
});

// Expose global functions for HTML onclick handlers
window.morphFlux = {
    uploadAndTransform: () => morphFlux?.uploadAndTransform(),
    resetUploadArea: () => morphFlux?.resetUploadArea()
};

// Add custom cursor effect for interactive elements
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.custom-cursor') || (() => {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, var(--color-neon-purple) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(cursor);
        return cursor;
    })();
    
    cursor.style.left = (e.clientX - 10) + 'px';
    cursor.style.top = (e.clientY - 10) + 'px';
    
    // Show cursor on interactive elements
    const interactive = e.target.closest('button, a, .feature-card, .example-card, .pricing-card');
    cursor.style.opacity = interactive ? '0.6' : '0';
});

// Performance optimization: Throttle scroll events
let ticking = false;
function updateOnScroll() {
    if (morphFlux) {
        morphFlux.handleScroll();
    }
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
});
