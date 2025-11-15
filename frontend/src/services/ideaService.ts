import api from './api';

export interface Idea {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  username?: string;
  averageRating?: number;
  ratingCount?: number;
  feedbackCount?: number;
}

export interface IdeaWithDetails extends Idea {
  feedback: Feedback[];
}

export interface Feedback {
  id: string;
  ideaId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface CreateIdeaData {
  title: string;
  description: string;
}

export interface IdeasResponse {
  ideas: Idea[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface IdeaFilters {
  minRating?: number;
  maxRating?: number;
  search?: string;
}

export const ideaService = {
  async createIdea(data: CreateIdeaData): Promise<Idea> {
    const response = await api.post<{ idea: Idea }>('/ideas', data);
    return response.data.idea;
  },

  async getIdeas(
    page = 1,
    limit = 10,
    sortBy: 'date' | 'rating' | 'engagement' = 'date',
    filters?: IdeaFilters
  ): Promise<IdeasResponse> {
    const params: any = { page, limit, sortBy };
    
    if (filters?.minRating !== undefined) {
      params.minRating = filters.minRating;
    }
    if (filters?.maxRating !== undefined) {
      params.maxRating = filters.maxRating;
    }
    if (filters?.search) {
      params.search = filters.search;
    }

    const response = await api.get<IdeasResponse>('/ideas', { params });
    return response.data;
  },

  async getIdeaById(id: string): Promise<IdeaWithDetails> {
    const response = await api.get<{ idea: IdeaWithDetails }>(`/ideas/${id}`);
    return response.data.idea;
  },

  async getUserIdeas(userId: string): Promise<Idea[]> {
    const response = await api.get<{ ideas: Idea[] }>(`/users/${userId}/ideas`);
    return response.data.ideas;
  },
};
