import { create } from 'zustand';

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Review {
  id: number;
  title: string;
  status: 'pending' | 'parsing' | 'static_analysis' | 'ai_reasoning' | 'completed' | 'failed';
  ai_score: number | null;
  created_at: string;
  project_id: number;
  branch?: string;
  commit_hash?: string;
}

export interface Issue {
  id: number;
  file_path: string;
  line_number: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'security' | 'bug' | 'performance' | 'documentation' | 'refactoring';
  message: string;
  suggestion?: string;
  line_content?: string;
}

export interface WebSocketProgress {
  status: string;
  progress: number;
  message: string;
}

interface ReviewState {
  projects: Project[];
  selectedProjectId: number | null;
  reviews: Review[];
  activeReviewProgress: Record<number, WebSocketProgress>;
  setProjects: (projects: Project[]) => void;
  setSelectedProjectId: (id: number | null) => void;
  setReviews: (reviews: Review[]) => void;
  updateReviewProgress: (reviewId: number, progress: WebSocketProgress) => void;
  clearReviewProgress: (reviewId: number) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  projects: [],
  selectedProjectId: null,
  reviews: [],
  activeReviewProgress: {},
  setProjects: (projects) => set({ projects }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setReviews: (reviews) => set({ reviews }),
  updateReviewProgress: (reviewId, progress) =>
    set((state) => ({
      activeReviewProgress: {
        ...state.activeReviewProgress,
        [reviewId]: progress,
      },
    })),
  clearReviewProgress: (reviewId) =>
    set((state) => {
      const copy = { ...state.activeReviewProgress };
      delete copy[reviewId];
      return { activeReviewProgress: copy };
    }),
}));
