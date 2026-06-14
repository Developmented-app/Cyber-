export type UserRole = 'admin' | 'client' | 'guest';

export interface ClientProfile {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  riskScore: number; // 0 to 100
  status: 'active' | 'onboarding' | 'suspended';
  contractValue: number;
}

export interface TicketAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  content: string; // Base64 data URL
}

export interface TicketMessage {
  id: string;
  senderRole: 'admin' | 'client' | 'ai';
  senderName: string;
  text: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  companyName: string;
  subject: string;
  category: 'security_alert' | 'it_support' | 'compliance' | 'incident';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  lastUpdated: string;
  messages: TicketMessage[];
}

export interface ProjectTask {
  id: string;
  nameEn: string;
  nameKh: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  note?: string;
}

export interface SecurityProject {
  id: string;
  titleEn: string;
  titleKh: string;
  clientCompany: string;
  descriptionEn: string;
  descriptionKh: string;
  status: 'planning' | 'active' | 'auditing' | 'deployed';
  progress: number; // 0-100
  startDate: string;
  endDate: string;
  tasks: ProjectTask[];
}

export interface BlogPost {
  id: string;
  titleEn: string;
  titleKh: string;
  contentEn: string;
  contentKh: string;
  authorEn: string;
  authorKh: string;
  categoryEn: string;
  categoryKh: string;
  date: string;
  readTime: string;
  isAdvisory: boolean;
}

export interface Invoice {
  id: string;
  clientCompany: string;
  titleEn: string;
  titleKh: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue';
  createdAt: string;
  billingPeriod: string;
}

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'lead' | 'contacted' | 'negotiation' | 'converted' | 'lost';
  riskScore: number;
  createdAt: string;
}

export interface LanguageContextType {
  language: 'en' | 'kh';
  setLanguage: (lang: 'en' | 'kh') => void;
  t: (key: string) => string;
}
