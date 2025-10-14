import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const API_KEY = process.env.REACT_APP_API_KEY || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY,
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const api = {
  // Request presigned URL for upload
  async requestUploadUrl(fileName, fileSize, contentType, description) {
    try {
      const response = await apiClient.post('/files/upload', {
        fileName,
        fileSize,
        contentType,
        description,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to request upload URL');
    }
  },

  // Upload file to S3 using presigned URL
  async uploadToS3(presignedUrl, file, onProgress) {
    try {
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
    } catch (error) {
      throw new Error('Failed to upload file to S3');
    }
  },

  // Confirm upload completion
  async confirmUpload(fileId) {
    try {
      const response = await apiClient.post('/files/confirm', { fileId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to confirm upload');
    }
  },

  // List all files
  async listFiles() {
    try {
      const response = await apiClient.get('/files');
      return response.data.files;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to list files');
    }
  },

  // Get download URL for a file
  async getDownloadUrl(fileId) {
    try {
      const response = await apiClient.get(`/files/${fileId}/download`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get download URL');
    }
  },

  // Download file
  async downloadFile(fileId, fileName) {
    try {
      const { presignedUrl } = await this.getDownloadUrl(fileId);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = presignedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw new Error('Failed to download file');
    }
  },

  // Delete file
  async deleteFile(fileId) {
    try {
      const response = await apiClient.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete file');
    }
  },

  // Complete upload flow (request URL, upload to S3, confirm)
  async completeUpload(file, description, onProgress) {
    try {
      // Step 1: Request presigned URL
      const { presignedUrl, fileId } = await this.requestUploadUrl(
        file.name,
        file.size,
        file.type,
        description
      );

      // Step 2: Upload to S3
      await this.uploadToS3(presignedUrl, file, onProgress);

      // Step 3: Confirm upload
      await this.confirmUpload(fileId);

      return { fileId, message: 'Upload completed successfully' };
    } catch (error) {
      throw error;
    }
  },
};

export default api;
