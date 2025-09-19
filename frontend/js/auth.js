// MorphFlux Studio Authentication Manager
class AuthManager {
    constructor() {
        this.api = window.morphFluxAPI;
        this.currentUser = null;
        this.isInitialized = false;
    }

    // Initialize authentication state
    async init() {
        if (this.isInitialized) return;

        try {
            if (this.api.isAuthenticated()) {
                const response = await this.api.getCurrentUser();
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.updateUIForAuthenticatedUser();
                } else {
                    this.api.clearTokens();
                }
            }
        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.api.clearTokens();
        }

        this.isInitialized = true;
        this.updateUIForAuthState();
    }

    // Update UI based on authentication state
    updateUIForAuthState() {
        const isAuthenticated = this.api.isAuthenticated();
        
        // Update navigation
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            if (isAuthenticated) {
                navLinks.innerHTML = `
                    <a href="#features">Features</a>
                    <a href="#examples">Gallery</a>
                    <a href="#pricing">Pricing</a>
                    <div class="user-menu">
                        <button class="btn btn--secondary" onclick="authManager.showUserMenu()">
                            <span class="user-avatar">${this.getUserInitials()}</span>
                            ${this.currentUser?.first_name || 'User'}
                        </button>
                        <div class="user-dropdown hidden" id="userDropdown">
                            <a href="#profile" onclick="authManager.showProfile()">Profile</a>
                            <a href="#usage" onclick="authManager.showUsage()">Usage</a>
                            <a href="#activity" onclick="authManager.showActivity()">Activity</a>
                            <hr>
                            <a href="#" onclick="authManager.logout()">Logout</a>
                        </div>
                    </div>
                `;
            } else {
                navLinks.innerHTML = `
                    <a href="#features">Features</a>
                    <a href="#examples">Gallery</a>
                    <a href="#pricing">Pricing</a>
                    <button class="btn btn--secondary" onclick="authManager.showLoginModal()">Login</button>
                    <button class="btn btn--primary" onclick="authManager.showRegisterModal()">Get Started</button>
                `;
            }
        }

        // Update upload button
        const uploadBtn = document.querySelector('.upload-btn');
        if (uploadBtn) {
            if (isAuthenticated) {
                uploadBtn.innerHTML = `
                    <span class="upload-icon">📸</span>
                    Upload & Transform Your Reality
                `;
            } else {
                uploadBtn.innerHTML = `
                    <span class="upload-icon">🔐</span>
                    Sign Up to Start Transforming
                `;
                uploadBtn.onclick = () => this.showRegisterModal();
            }
        }
    }

    // Update UI for authenticated user
    updateUIForAuthenticatedUser() {
        // Update user-specific elements
        const userElements = document.querySelectorAll('[data-user-name]');
        userElements.forEach(el => {
            el.textContent = this.currentUser?.first_name || 'User';
        });

        // Update usage display if present
        this.updateUsageDisplay();
    }

    // Get user initials for avatar
    getUserInitials() {
        if (!this.currentUser) return 'U';
        const first = this.currentUser.first_name?.charAt(0) || '';
        const last = this.currentUser.last_name?.charAt(0) || '';
        return (first + last).toUpperCase();
    }

    // Show login modal
    showLoginModal() {
        this.showAuthModal('login');
    }

    // Show register modal
    showRegisterModal() {
        this.showAuthModal('register');
    }

    // Show authentication modal
    showAuthModal(type) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = this.getAuthModalHTML(type);
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Bind events
        this.bindAuthModalEvents(modal, type);
    }

    // Get authentication modal HTML
    getAuthModalHTML(type) {
        const isLogin = type === 'login';
        
        return `
            <div class="modal-overlay" onclick="authManager.closeAuthModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="authManager.closeAuthModal()">&times;</button>
                    
                    <div class="auth-header">
                        <h2>${isLogin ? 'Welcome Back' : 'Join MorphFlux Studio'}</h2>
                        <p>${isLogin ? 'Sign in to continue your AI transformation journey' : 'Start transforming your photos with AI'}</p>
                    </div>

                    <form class="auth-form" id="authForm">
                        ${!isLogin ? `
                            <div class="form-group">
                                <label for="firstName">First Name</label>
                                <input type="text" id="firstName" name="first_name" required>
                            </div>
                            <div class="form-group">
                                <label for="lastName">Last Name</label>
                                <input type="text" id="lastName" name="last_name" required>
                            </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" required>
                            ${!isLogin ? '<small>Must contain uppercase, lowercase, number, and special character</small>' : ''}
                        </div>
                        
                        ${isLogin ? `
                            <div class="form-options">
                                <label class="checkbox">
                                    <input type="checkbox" id="rememberMe">
                                    <span>Remember me</span>
                                </label>
                                <a href="#" onclick="authManager.showForgotPasswordModal()">Forgot password?</a>
                            </div>
                        ` : ''}

                        <button type="submit" class="btn btn--primary btn--full">
                            ${isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div class="auth-footer">
                        ${isLogin ? 
                            'Don\'t have an account? <a href="#" onclick="authManager.switchAuthModal(\'register\')">Sign up</a>' :
                            'Already have an account? <a href="#" onclick="authManager.switchAuthModal(\'login\')">Sign in</a>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // Bind authentication modal events
    bindAuthModalEvents(modal, type) {
        const form = modal.querySelector('#authForm');
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthSubmit(e, type);
        });

        closeBtn.addEventListener('click', () => this.closeAuthModal());
        overlay.addEventListener('click', () => this.closeAuthModal());
    }

    // Handle authentication form submission
    async handleAuthSubmit(event, type) {
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.innerHTML = '<span class="spinner"></span>Processing...';
            submitBtn.disabled = true;

            let response;
            if (type === 'login') {
                response = await this.api.login(data.email, data.password);
            } else {
                response = await this.api.register(data);
            }

            if (response.success) {
                this.currentUser = response.data.user;
                this.updateUIForAuthState();
                this.closeAuthModal();
                
                // Show success message
                this.showNotification(
                    type === 'login' ? 'Welcome back!' : 'Account created successfully! Please check your email for verification.',
                    'success'
                );

                // If registration, show email verification notice
                if (type === 'register' && !response.data.user.email_verified) {
                    this.showEmailVerificationNotice();
                }
            } else {
                throw new Error(response.error || 'Authentication failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Switch between login and register modals
    switchAuthModal(type) {
        this.closeAuthModal();
        setTimeout(() => this.showAuthModal(type), 100);
    }

    // Close authentication modal
    closeAuthModal() {
        const modal = document.querySelector('.auth-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }

    // Show forgot password modal
    showForgotPasswordModal() {
        this.closeAuthModal();
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="authManager.closeAuthModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="authManager.closeAuthModal()">&times;</button>
                    
                    <div class="auth-header">
                        <h2>Reset Password</h2>
                        <p>Enter your email address and we'll send you a reset link</p>
                    </div>

                    <form class="auth-form" id="forgotPasswordForm">
                        <div class="form-group">
                            <label for="resetEmail">Email</label>
                            <input type="email" id="resetEmail" name="email" required>
                        </div>

                        <button type="submit" class="btn btn--primary btn--full">
                            Send Reset Link
                        </button>
                    </form>

                    <div class="auth-footer">
                        <a href="#" onclick="authManager.showLoginModal()">Back to login</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Bind events
        const form = modal.querySelector('#forgotPasswordForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('#resetEmail').value;
            
            try {
                await this.api.forgotPassword(email);
                this.closeAuthModal();
                this.showNotification('Password reset link sent to your email', 'success');
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        });
    }

    // Show email verification notice
    showEmailVerificationNotice() {
        const notice = document.createElement('div');
        notice.className = 'verification-notice';
        notice.innerHTML = `
            <div class="notice-content">
                <h3>📧 Check Your Email</h3>
                <p>We've sent a verification link to your email address. Please click the link to verify your account.</p>
                <button class="btn btn--secondary" onclick="this.parentElement.parentElement.remove()">Got it</button>
            </div>
        `;
        
        document.body.appendChild(notice);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notice.parentElement) {
                notice.remove();
            }
        }, 10000);
    }

    // Show user menu
    showUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    // Show profile modal
    showProfile() {
        // Implementation for profile modal
        this.showNotification('Profile management coming soon!', 'info');
    }

    // Show usage modal
    async showUsage() {
        try {
            const response = await this.api.getUserUsage();
            if (response.success) {
                this.showUsageModal(response.data.usage);
            }
        } catch (error) {
            this.showNotification('Failed to load usage data', 'error');
        }
    }

    // Show usage modal
    showUsageModal(usage) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="authManager.closeAuthModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="authManager.closeAuthModal()">&times;</button>
                    
                    <div class="auth-header">
                        <h2>Usage Statistics</h2>
                        <p>Your current usage and limits</p>
                    </div>

                    <div class="usage-stats">
                        <div class="usage-item">
                            <div class="usage-label">Monthly Usage</div>
                            <div class="usage-value">${usage.monthly_usage} / ${usage.monthly_limit === -1 ? '∞' : usage.monthly_limit}</div>
                        </div>
                        <div class="usage-item">
                            <div class="usage-label">Subscription Tier</div>
                            <div class="usage-value">${usage.subscription_tier}</div>
                        </div>
                        <div class="usage-item">
                            <div class="usage-label">Usage Percentage</div>
                            <div class="usage-value">${usage.usage_percentage}%</div>
                        </div>
                    </div>

                    <div class="auth-footer">
                        <button class="btn btn--primary" onclick="authManager.closeAuthModal()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    // Show activity modal
    async showActivity() {
        try {
            const response = await this.api.getUserActivity();
            if (response.success) {
                this.showActivityModal(response.data.activity);
            }
        } catch (error) {
            this.showNotification('Failed to load activity data', 'error');
        }
    }

    // Show activity modal
    showActivityModal(activity) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="authManager.closeAuthModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="authManager.closeAuthModal()">&times;</button>
                    
                    <div class="auth-header">
                        <h2>Recent Activity</h2>
                        <p>Your transformation history</p>
                    </div>

                    <div class="activity-list">
                        ${activity.length > 0 ? 
                            activity.map(item => `
                                <div class="activity-item">
                                    <div class="activity-type">${item.type}</div>
                                    <div class="activity-status">${item.status}</div>
                                    <div class="activity-date">${new Date(item.created_at).toLocaleDateString()}</div>
                                </div>
                            `).join('') :
                            '<p>No activity yet. Start by uploading your first image!</p>'
                        }
                    </div>

                    <div class="auth-footer">
                        <button class="btn btn--primary" onclick="authManager.closeAuthModal()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    // Logout user
    async logout() {
        try {
            await this.api.logout();
            this.currentUser = null;
            this.updateUIForAuthState();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            // Clear tokens anyway
            this.api.clearTokens();
            this.currentUser = null;
            this.updateUIForAuthState();
        }
    }

    // Update usage display
    async updateUsageDisplay() {
        try {
            const response = await this.api.getUserUsage();
            if (response.success) {
                const usage = response.data.usage;
                const usageElements = document.querySelectorAll('[data-usage]');
                usageElements.forEach(el => {
                    el.textContent = `${usage.monthly_usage}/${usage.monthly_limit === -1 ? '∞' : usage.monthly_limit}`;
                });
            }
        } catch (error) {
            console.error('Failed to update usage display:', error);
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Use the existing notification system from the main app
        if (window.morphFlux && window.morphFlux.showNotification) {
            window.morphFlux.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification--${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--color-dark-surface);
                border: 1px solid var(--color-neon-purple);
                border-radius: 8px;
                padding: 16px;
                color: var(--color-text);
                z-index: 3000;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
        }
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();
