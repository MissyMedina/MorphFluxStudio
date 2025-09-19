// MorphFlux Studio API Service
class MorphFluxAPI {
    constructor() {
        this.baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://api.morphflux.com/api/v1' 
            : 'http://localhost:8000/api/v1';
        this.token = localStorage.getItem('morphflux_token');
        this.refreshToken = localStorage.getItem('morphflux_refresh_token');
    }

    // Set authentication tokens
    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('morphflux_token', accessToken);
        localStorage.setItem('morphflux_refresh_token', refreshToken);
    }

    // Clear authentication tokens
    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('morphflux_token');
        localStorage.removeItem('morphflux_refresh_token');
    }

    // Get authorization headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Make API request with error handling
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Handle token refresh if needed
            if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the original request with new token
                    config.headers = this.getAuthHeaders();
                    const retryResponse = await fetch(url, config);
                    return await retryResponse.json();
                } else {
                    // Refresh failed, redirect to login
                    this.handleAuthError();
                    throw new Error('Authentication failed');
                }
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Refresh access token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.setTokens(data.data.tokens.access_token, data.data.tokens.refresh_token);
                return true;
            } else {
                this.clearTokens();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            return false;
        }
    }

    // Handle authentication error
    handleAuthError() {
        this.clearTokens();
        window.location.href = '/login.html';
    }

    // Authentication endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success) {
            this.setTokens(response.data.tokens.access_token, response.data.tokens.refresh_token);
        }

        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.clearTokens();
        }
    }

    async verifyEmail(token) {
        return this.request('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async resetPassword(token, password) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password })
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // User management endpoints
    async updateProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
    }

    async getUserUsage() {
        return this.request('/users/usage');
    }

    async getUserActivity(page = 1, limit = 20) {
        return this.request(`/users/activity?page=${page}&limit=${limit}`);
    }

    async deleteAccount(password) {
        return this.request('/users/account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
    }

    // File upload endpoints
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseURL}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    }

    async getImages(page = 1, limit = 20) {
        return this.request(`/upload/images?page=${page}&limit=${limit}`);
    }

    async getImage(imageId) {
        return this.request(`/upload/images/${imageId}`);
    }

    async deleteImage(imageId) {
        return this.request(`/upload/images/${imageId}`, { method: 'DELETE' });
    }

    async getPresignedUploadUrl(filename, contentType, fileSize) {
        return this.request('/upload/presigned-url', {
            method: 'POST',
            body: JSON.stringify({ filename, contentType, fileSize })
        });
    }

    async confirmUpload(fileKey, originalFilename, fileSize, metadata) {
        return this.request('/upload/confirm-upload', {
            method: 'POST',
            body: JSON.stringify({ file_key: fileKey, original_filename: originalFilename, file_size: fileSize, metadata })
        });
    }

    // Transformation endpoints (placeholder for future AI service integration)
    async createTransformation(inputImageId, type, parameters) {
        return this.request('/transformations', {
            method: 'POST',
            body: JSON.stringify({ input_image_id: inputImageId, type, parameters })
        });
    }

    async getTransformations(page = 1, limit = 20) {
        return this.request(`/transformations?page=${page}&limit=${limit}`);
    }

    async getTransformation(transformationId) {
        return this.request(`/transformations/${transformationId}`);
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    async checkAuthStatus() {
        if (!this.token) return false;
        
        try {
            await this.getCurrentUser();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create global API instance
window.morphFluxAPI = new MorphFluxAPI();
