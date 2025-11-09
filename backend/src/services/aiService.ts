import axios, { AxiosError } from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '10000', 10); // 10 seconds

export interface CategorySuggestion {
  category: string;
  confidence: number;
}

export interface CategorizeResult {
  success: boolean;
  suggestion?: CategorySuggestion;
  message?: string;
  error?: string;
}

export interface TrainResult {
  success: boolean;
  message: string;
  error?: string;
}

export const aiService = {
  /**
   * Get category suggestion for a transaction
   */
  async suggestCategory(
    description: string,
    amount?: number
  ): Promise<CategorizeResult> {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/categorize`,
        {
          description,
          amount
        },
        {
          timeout: AI_SERVICE_TIMEOUT
        }
      );

      if (response.data.success) {
        return {
          success: true,
          suggestion: response.data.suggestion
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to get category suggestion'
        };
      }
    } catch (error) {
      return this.handleAIServiceError(error, 'Category suggestion');
    }
  },

  /**
   * Train the categorization model with user feedback
   */
  async learnFromCorrection(
    description: string,
    category: string,
    amount?: number
  ): Promise<TrainResult> {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/train`,
        {
          description,
          category,
          amount
        },
        {
          timeout: AI_SERVICE_TIMEOUT
        }
      );

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Training successful'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Training failed',
          error: response.data.message
        };
      }
    } catch (error) {
      const errorResult = this.handleAIServiceError(error, 'Training');
      return {
        success: false,
        message: errorResult.error || 'Training failed',
        error: errorResult.error
      };
    }
  },

  /**
   * Check if AI service is available
   */
  async checkAIServiceHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  },

  /**
   * Handle AI service errors with appropriate fallback
   */
  handleAIServiceError(error: unknown, operation: string): CategorizeResult {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      
      if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'AI service is unavailable. Please ensure the service is running.'
        };
      }
      
      if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'AI service request timed out.'
        };
      }
      
      if (axiosError.response) {
        return {
          success: false,
          error: `AI service error: ${axiosError.response.data?.detail || axiosError.message}`
        };
      }
    }

    console.error(`${operation} error:`, error);
    return {
      success: false,
      error: `Failed to ${operation.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
