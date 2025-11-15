import api from './api';
import { Feedback } from './ideaService';

export interface CreateFeedbackData {
  content: string;
}

export const feedbackService = {
  async createFeedback(ideaId: string, data: CreateFeedbackData): Promise<Feedback> {
    const response = await api.post<{ feedback: Feedback }>(`/ideas/${ideaId}/feedback`, data);
    return response.data.feedback;
  },

  async getFeedbackByIdea(ideaId: string): Promise<Feedback[]> {
    const response = await api.get<{ feedback: Feedback[] }>(`/ideas/${ideaId}/feedback`);
    return response.data.feedback;
  },
};
