import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Project, 
  Message, 
  Review, 
  LoginCredentials,
  RegisterData,
  Subscription
} from "@shared/schema";

// Auth API
export async function login(credentials: LoginCredentials) {
  const res = await apiRequest("POST", "/api/auth/login", credentials);
  return await res.json();
}

export async function register(data: RegisterData) {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return await res.json();
}

export async function logout() {
  const res = await apiRequest("POST", "/api/auth/logout");
  return await res.json();
}

export async function getCurrentUser() {
  const res = await apiRequest("GET", "/api/auth/user");
  return await res.json();
}

// Subscription API
export async function getUserSubscription() {
  const res = await apiRequest("GET", "/api/subscriptions");
  return await res.json();
}

export async function createSubscription(tier: 'basic' | 'pro' | 'enterprise') {
  const res = await apiRequest("POST", "/api/create-subscription", { tier });
  return await res.json();
}

export async function cancelSubscription() {
  const res = await apiRequest("POST", "/api/cancel-subscription");
  return await res.json();
}

// Project API
export async function getProjects() {
  const res = await apiRequest("GET", "/api/projects");
  return await res.json();
}

export async function getProject(id: number) {
  const res = await apiRequest("GET", `/api/projects/${id}`);
  return await res.json();
}

export async function createProject(project: Partial<Project>) {
  const res = await apiRequest("POST", "/api/projects", project);
  return await res.json();
}

export async function updateProject(id: number, updates: Partial<Project>) {
  const res = await apiRequest("PATCH", `/api/projects/${id}`, updates);
  return await res.json();
}

export async function assignProject(id: number) {
  const res = await apiRequest("POST", `/api/projects/${id}/assign`);
  return await res.json();
}

// Message API
export async function getProjectMessages(projectId: number) {
  const res = await apiRequest("GET", `/api/projects/${projectId}/messages`);
  return await res.json();
}

export async function sendMessage(projectId: number, content: string) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/messages`, { content });
  return await res.json();
}

// Review API
export async function getProjectReviews(projectId: number) {
  const res = await apiRequest("GET", `/api/projects/${projectId}/reviews`);
  return await res.json();
}

export async function getUserReviews(userId: number) {
  const res = await apiRequest("GET", `/api/users/${userId}/reviews`);
  return await res.json();
}

export async function createReview(projectId: number, rating: number, comment?: string) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/reviews`, { rating, comment });
  return await res.json();
}

export async function toggleReviewVisibility(reviewId: number) {
  const res = await apiRequest("PATCH", `/api/reviews/${reviewId}/toggle-visibility`);
  return await res.json();
}
