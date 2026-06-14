import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, Terminal, Server, Key, PhoneCall, 
  Building2, Send, Laptop, Sparkles, CheckCircle2, Sun, Moon, FileText, 
  Globe, Users, Plus, Check, DollarSign, TrendingUp, BarChart2, Lock, 
  Unlock, MessageSquare, LogOut, Filter, Activity, Clock, RefreshCw, ChevronRight, X,
  Paperclip, Download, File, ArrowUpRight, GripVertical, Search, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import confetti from 'canvas-confetti';

import { translations } from './locales';
import LandingView from './components/LandingView';
import ChatWidget from './components/ChatWidget';
import { 
  UserRole, ClientProfile, SupportTicket, SecurityProject, 
  BlogPost, Invoice, CRMContact 
} from './types';

export default function App() {
  // Theme & Language
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('aegis-theme') as 'light' | 'dark') || 'dark';
  });
  const [language, setLanguage] = useState<'en' | 'kh'>(() => {
    return (localStorage.getItem('aegis-lang') as 'en' | 'kh') || 'en';
  });

  // Toast notifications state block
  interface ToastItem {
    id: string;
    type: 'ticket' | 'invoice' | 'info';
    message: string;
    timestamp: Date;
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: 'ticket' | 'invoice' | 'info' = 'info') => {
    const newToast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date()
    };
    setToasts(prev => [...prev, newToast]);
    // Auto remove in 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 6000);
  };

  // Navigation: 'home' | 'portal' | 'admin-desk'
  const [currentTab, setCurrentTab] = useState<'home' | 'portal' | 'admin-desk'>('home');

  // Auth/User State
  const [user, setUser] = useState<{ id: string; email: string; role: UserRole; companyName: string; contactName: string; phone: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCompanyName, setAuthCompanyName] = useState('');
  const [authContactName, setAuthContactName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Domain Datasets from API
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [projects, setProjects] = useState<SecurityProject[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [crmLeads, setCrmLeads] = useState<CRMContact[]>([]);

  // Task note editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [taskNoteText, setTaskNoteText] = useState<string>('');

  // Ticket & Reply attachments upload buffers
  const [newTicketAttachments, setNewTicketAttachments] = useState<any[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<any[]>([]);

  // Drag and drop task reordering state
  const [draggedTaskIdx, setDraggedTaskIdx] = useState<number | null>(null);
  const [draggedProjId, setDraggedProjId] = useState<string | null>(null);
  const [isDraggingOverIdx, setIsDraggingOverIdx] = useState<number | null>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [projectViewMode, setProjectViewMode] = useState<'list' | 'gantt'>('list');

  const handleDragStart = (e: React.DragEvent, projId: string, index: number) => {
    setDraggedTaskIdx(index);
    setDraggedProjId(projId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTaskIdx !== null && draggedTaskIdx !== index) {
      setIsDraggingOverIdx(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskIdx(null);
    setDraggedProjId(null);
    setIsDraggingOverIdx(null);
  };

  const handleDrop = async (e: React.DragEvent, projId: string, targetIndex: number) => {
    e.preventDefault();
    setIsDraggingOverIdx(null);
    if (draggedTaskIdx === null || draggedProjId !== projId || draggedTaskIdx === targetIndex) {
      return;
    }

    // Find the project
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    // Create a reordered copy of tasks
    const updatedTasks = [...proj.tasks];
    const [draggedItem] = updatedTasks.splice(draggedTaskIdx, 1);
    updatedTasks.splice(targetIndex, 0, draggedItem);

    // Optimistically update state
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === projId ? { ...p, tasks: updatedTasks } : p
      )
    );

    // Save to server
    try {
      const res = await fetch(`/api/projects/${projId}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      if (!res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  // Gantt Chart Date formatting helpers
  const getMinifiedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'km-KH', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getIntermediateDate = (startStr: string, endStr: string, fraction: number) => {
    try {
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      if (isNaN(start) || isNaN(end)) return '';
      const target = start + (end - start) * fraction;
      return new Date(target).toLocaleDateString(language === 'en' ? 'en-US' : 'km-KH', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // CSV Export Utility Functions
  const downloadCsv = (headers: string[], rows: string[][], filename: string) => {
    const escapeField = (field: any) => {
      const stringified = field === null || field === undefined ? '' : String(field);
      return `"${stringified.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(escapeField).join(','),
      ...rows.map(row => row.map(escapeField).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLeadsCsv = () => {
    const headers = ['Lead ID', 'Company', 'Inquiry Point Name', 'Email', 'Phone', 'Risk Score', 'Pipeline Mode', 'Created At'];
    const rows = crmLeads.map(lead => [
      lead.id,
      lead.company,
      lead.name,
      lead.email,
      lead.phone,
      String(lead.riskScore),
      lead.status,
      lead.createdAt
    ]);
    downloadCsv(headers, rows, 'crm_leads_export.csv');
  };

  const handleExportInvoicesCsv = () => {
    const headers = ['Invoice ID', 'Client Company', 'Title (EN)', 'Title (KH)', 'Amount (USD)', 'Due Date', 'Status', 'Created At', 'Billing Period'];
    const rows = invoices.map(inv => [
      inv.id,
      inv.clientCompany,
      inv.titleEn,
      inv.titleKh,
      String(inv.amount),
      inv.dueDate,
      inv.status,
      inv.createdAt,
      inv.billingPeriod
    ]);
    downloadCsv(headers, rows, 'invoices_export.csv');
  };

  const handleExportTicketsCsv = () => {
    const headers = [
      'Ticket ID', 
      'User ID', 
      'User Email', 
      'Company Name', 
      'Subject', 
      'Category', 
      'Priority', 
      'Status', 
      'Created At', 
      'Last Updated', 
      'Total Messages'
    ];
    const rows = tickets.map(tk => [
      tk.id,
      tk.userId || '',
      tk.userEmail || '',
      tk.companyName || '',
      tk.subject || '',
      tk.category || '',
      tk.priority || '',
      tk.status || '',
      tk.createdAt || '',
      tk.lastUpdated || '',
      String(tk.messages ? tk.messages.length : 0)
    ]);
    downloadCsv(headers, rows, 'support_tickets_export.csv');
  };

  // Base64 file converter helper
  const processFiles = (files: FileList, callback: (processed: any[]) => void) => {
    const promises = Array.from(files).map((file) => {
      return new Promise<any>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
          if (file.size > 1024 * 1024) {
            sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          }
          resolve({
            id: `att-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: sizeStr,
            type: file.type || 'application/octet-stream',
            content: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(promises).then((results) => {
      callback(results);
    });
  };

  // Loading indicator for lists refresh
  const [isLoading, setIsLoading] = useState(false);

  // Active Ticket Sub-view
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // Ticket creation form
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'security_alert' | 'it_support' | 'compliance' | 'incident'>('it_support');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newTicketMsg, setNewTicketMsg] = useState('');

  // Admin invoice builder form
  const [newInvClient, setNewInvClient] = useState('');
  const [newInvTitle, setNewInvTitle] = useState('');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvDue, setNewInvDue] = useState('');
  const [newInvPeriod, setNewInvPeriod] = useState('');

  // Admin Project Builder
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjTitleEn, setNewProjTitleEn] = useState('');
  const [newProjTitleKh, setNewProjTitleKh] = useState('');
  const [newProjDescEn, setNewProjDescEn] = useState('');
  const [newProjDescKh, setNewProjDescKh] = useState('');

  // Admin Blog Builder
  const [newBlogTitleEn, setNewBlogTitleEn] = useState('');
  const [newBlogTitleKh, setNewBlogTitleKh] = useState('');
  const [newBlogContentEn, setNewBlogContentEn] = useState('');
  const [newBlogContentKh, setNewBlogContentKh] = useState('');
  const [newBlogCategoryEn, setNewBlogCategoryEn] = useState('');
  const [newBlogCategoryKh, setNewBlogCategoryKh] = useState('');
  const [newBlogAdvisory, setNewBlogAdvisory] = useState(false);
  const [blogSuccess, setBlogSuccess] = useState(false);

  // Localization translator
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const getPriorityBadge = (p?: 'low' | 'medium' | 'high' | 'critical') => {
    const priority = p || 'low';
    let styling = '';
    switch (priority) {
      case 'critical':
        styling = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        break;
      case 'high':
        styling = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        break;
      case 'medium':
        styling = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        break;
      default:
        styling = 'bg-slate-500/10 text-slate-400 border-slate-800';
    }
    return (
      <span className={`text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border inline-flex items-center shrink-0 tracking-wider ${styling}`}>
        {t(`priority.${priority}`)}
      </span>
    );
  };

  // Sync Class list on dark theme changes
  useEffect(() => {
    localStorage.setItem('aegis-theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync Lang
  useEffect(() => {
    localStorage.setItem('aegis-lang', language);
  }, [language]);

  // Read initial data from REST API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const companyQuery = user ? `?company=${encodeURIComponent(user.companyName)}` : '';
      
      // Fetch Blogs
      const blogRes = await fetch('/api/blog');
      if (blogRes.ok) {
        const data = await blogRes.json();
        setBlogPosts(data);
      }

      // Fetch Tickets
      const tickRes = await fetch(`/api/tickets${companyQuery}`);
      if (tickRes.ok) {
        const data = await tickRes.json();
        
        // Notify of new support responses compared to previously loaded tickets
        if (tickets.length > 0) {
          data.forEach((newTick: SupportTicket) => {
            const oldTick = tickets.find((tk) => tk.id === newTick.id);
            if (oldTick && newTick.messages.length > oldTick.messages.length) {
              const latestMsg = newTick.messages[newTick.messages.length - 1];
              // Support response condition: message sent by someone other than 'client' (e.g., 'admin' or 'ai')
              if (latestMsg.senderRole !== 'client') {
                addToast(
                  language === 'en'
                    ? `Support ticket response: "${newTick.subject}" by ${latestMsg.senderName}`
                    : `ការឆ្លើយតបគាំទ្រថ្មី៖ "${newTick.subject}" ដោយ ${latestMsg.senderName}`,
                  'ticket'
                );
              }
            }
          });
        }

        setTickets(data);
        // Sync selected ticket
        if (selectedTicket) {
          const updated = data.find((tk: SupportTicket) => tk.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }

      // Fetch Projects
      const projRes = await fetch(`/api/projects${companyQuery}`);
      if (projRes.ok) {
        const data = await projRes.json();
        setProjects(data);
      }

      // Fetch Invoices
      const invRes = await fetch(`/api/invoices${companyQuery}`);
      if (invRes.ok) {
        const data = await invRes.json();
        
        // Notify of invoice status updating to paid
        if (invoices.length > 0) {
          data.forEach((newInv: Invoice) => {
            const oldInv = invoices.find((inv) => inv.id === newInv.id);
            if (oldInv && oldInv.status !== 'paid' && newInv.status === 'paid') {
              addToast(
                language === 'en'
                  ? `Invoice PAID: $${newInv.amount.toLocaleString()} for "${newInv.titleEn}"`
                  : `វិក្កយបត្របានទូទាត់រួចរាល់៖ $${newInv.amount.toLocaleString()} សម្រាប់ "${newInv.titleKh || newInv.titleEn}"`,
                'invoice'
              );
            }
          });
        }

        setInvoices(data);
      }

      // Fetch CRM Leads if Admin
      if (user && user.role === 'admin') {
        const leadsRes = await fetch('/api/crm/leads');
        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setCrmLeads(data);
        }
      }
    } catch (err) {
      console.error('API Sync failure:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial fetch
  useEffect(() => {
    fetchData();
  }, [user]);

  // Auto poll status updates every 10 seconds for real SOC alerts updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(timer);
  }, [user, selectedTicket]);

  // Authentication Submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'login') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || 'Authentication failed');
        } else {
          setUser(data.user);
          localStorage.setItem('aegis-token', data.token);
          setAuthSuccess(t('auth.welcomeBack'));
          setAuthEmail('');
          setAuthPassword('');
          // Re-route appropriately
          if (data.user.role === 'admin') {
            setCurrentTab('admin-desk');
          } else {
            setCurrentTab('portal');
          }
        }
      } catch (err) {
        setAuthError('Connection target offline.');
      }
    } else {
      // Register
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            companyName: authCompanyName,
            contactName: authContactName,
            phone: authPhone,
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || 'Registration failed');
        } else {
          setAuthSuccess(t('auth.registered'));
          setAuthMode('login');
        }
      } catch (err) {
        setAuthError('Connection target offline.');
      }
    }
  };

  // Sign out
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aegis-token');
    setCurrentTab('home');
  };

  // Ticket create action
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketMsg || !user) return;

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          companyName: user.companyName,
          subject: newTicketSubject,
          category: newTicketCategory,
          priority: newTicketPriority,
          message: newTicketMsg,
          senderName: user.contactName,
          attachments: newTicketAttachments
        })
      });
      if (res.ok) {
        setNewTicketSubject('');
        setNewTicketMsg('');
        setNewTicketAttachments([]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ticket reply submission
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || !user) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyText,
          senderRole: user.role,
          senderName: user.contactName,
          attachments: replyAttachments
        })
      });
      if (res.ok) {
        setReplyText('');
        setReplyAttachments([]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Ticket status update
  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Client toggle project task
  const handleToggleTask = async (projectId: string, taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      if (res.ok) {
        if (completed) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#3b82f6', '#059669', '#f59e0b', '#ef4444']
          });
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Client update task note
  const handleUpdateTaskNote = async (projectId: string, taskId: string, note: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      if (res.ok) {
        setEditingTaskId(null);
        setEditingProjId(null);
        setTaskNoteText('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pay invoice
  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin issue invoice
  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvClient || !newInvTitle || !newInvAmount) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCompany: newInvClient,
          titleEn: newInvTitle,
          amount: newInvAmount,
          dueDate: newInvDue,
          billingPeriod: newInvPeriod
        })
      });
      if (res.ok) {
        setNewInvClient('');
        setNewInvTitle('');
        setNewInvAmount('');
        setNewInvDue('');
        setNewInvPeriod('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin launch project
  const handleLaunchProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjClient || !newProjTitleEn) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCompany: newProjClient,
          titleEn: newProjTitleEn,
          titleKh: newProjTitleKh,
          descriptionEn: newProjDescEn,
          descriptionKh: newProjDescKh
        })
      });
      if (res.ok) {
        setNewProjClient('');
        setNewProjTitleEn('');
        setNewProjTitleKh('');
        setNewProjDescEn('');
        setNewProjDescKh('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin submit newsletter blog advisory
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitleEn || !newBlogTitleKh || !newBlogContentEn || !newBlogContentKh) return;

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn: newBlogTitleEn,
          titleKh: newBlogTitleKh,
          contentEn: newBlogContentEn,
          contentKh: newBlogContentKh,
          categoryEn: newBlogCategoryEn,
          categoryKh: newBlogCategoryKh,
          isAdvisory: newBlogAdvisory
        })
      });
      if (res.ok) {
        setNewBlogTitleEn('');
        setNewBlogTitleKh('');
        setNewBlogContentEn('');
        setNewBlogContentKh('');
        setNewBlogCategoryEn('');
        setNewBlogCategoryKh('');
        setNewBlogAdvisory(false);
        setBlogSuccess(true);
        setTimeout(() => setBlogSuccess(false), 5000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin update CRM lead status pipeline
  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Stats Calculation helpers
  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalUnpaid = invoices.filter(inv => inv.status !== 'paid').reduce((acc, curr) => acc + curr.amount, 0);

  // Charts data formatters
  const industryStatsData = [
    { name: 'Critical Inf', value: crmLeads.filter(l => l.riskScore >= 75).length, color: '#f43f5e' },
    { name: 'Technology', value: crmLeads.filter(l => l.riskScore >= 40 && l.riskScore < 75).length, color: '#f59e0b' },
    { name: 'Commercial', value: crmLeads.filter(l => l.riskScore < 40).length, color: '#10b981' },
  ];

  const leadsPipelineData = [
    { stage: 'Leads', cnt: crmLeads.filter(l => l.status === 'lead').length },
    { stage: 'Contacted', cnt: crmLeads.filter(l => l.status === 'contacted').length },
    { stage: 'Negotiation', cnt: crmLeads.filter(l => l.status === 'negotiation').length },
    { stage: 'Converted', cnt: crmLeads.filter(l => l.status === 'converted').length },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* GLOBAL BACKGROUND ELEMENTS (sleek grids) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute inset-0 opacity-[0.03] lg:opacity-[0.05] ${
          theme === 'dark' ? 'bg-[radial-gradient(#ffffff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000000_1px,transparent_1px)]'
        } [background-size:16px_16px]`}></div>
      </div>

      {/* TOP HEADER NAVIGATION */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/15 group-hover:scale-105 transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase block">{t('nav.brand')}</span>
              <span className="text-[9px] text-emerald-500 font-mono tracking-widest block uppercase">Secure Network SOC</span>
            </div>
          </button>

          {/* Links and Actions controls */}
          <div className="flex items-center gap-4">
            
            {/* Bilingual Translation Trigger */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
              className={`p-1.5 rounded-lg border text-xs font-mono font-bold tracking-wider cursor-pointer flex items-center gap-1 transition-all ${
                theme === 'dark' ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="Change Language / ប្តូរភាសា"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              {language === 'en' ? 'KH 🇰🇭' : 'EN 🇺🇸'}
            </button>

            {/* Dark & Light Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                theme === 'dark' ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Terminal Access Route links */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => user.role === 'admin' ? setCurrentTab('admin-desk') : setCurrentTab('portal')}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-emerald-500/10 cursor-pointer hidden sm:block"
                >
                  {user.role === 'admin' ? t('nav.admin') : t('nav.portal')}
                </button>
                <button
                  onClick={handleLogout}
                  className={`p-1.5 rounded-lg border text-xs hover:text-white hover:bg-rose-500 hover:border-rose-500 cursor-pointer transition-all ${
                    theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('portal')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                {t('nav.portal')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CORE CONTENT SWITCH ROUTER */}
      <main className="relative z-10 px-6 max-w-7xl mx-auto pt-6">
        
        {currentTab === 'home' && (
          <LandingView 
            language={language} 
            t={t} 
            onNavigateToPortal={() => {
              if (user) {
                setCurrentTab(user.role === 'admin' ? 'admin-desk' : 'portal');
              } else {
                setCurrentTab('portal');
              }
            }}
            blogPosts={blogPosts}
          />
        )}

        {/* AUTHENTICATION OR PORTAL TERMINAL CONTAINER */}
        {currentTab === 'portal' && (
          <div className="py-6">
            {!user ? (
              /* AUTH CONSOLE SCREEN */
              <div className="max-w-md mx-auto my-12 p-8 rounded-3xl border shadow-xl text-left transition-colors bg-slate-900 border-slate-800">
                <div className="text-center space-y-2 mb-8">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30 mx-auto">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{t('auth.title')}</h2>
                  <p className="text-[11px] text-slate-400 font-mono tracking-wider leading-relaxed">
                    {t('auth.subtitle')}
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs rounded-xl mb-4 font-mono">
                    ⚠️ {authError}
                  </div>
                )}
                
                {authSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs rounded-xl mb-4 font-mono">
                    ✓ {authSuccess}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase tracking-widest text-[9px]">{t('auth.email')} *</label>
                    <input 
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="corporate@domain.kh"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 uppercase tracking-widest text-[9px]">{t('auth.password')} *</label>
                    <input 
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  {authMode === 'register' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="text-slate-400 uppercase tracking-widest text-[9px]">Organization Company Name *</label>
                        <input 
                          type="text"
                          required
                          value={authCompanyName}
                          onChange={(e) => setAuthCompanyName(e.target.value)}
                          placeholder="Acme International Plc"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 uppercase tracking-widest text-[9px]">Contact Person Name *</label>
                        <input 
                          type="text"
                          required
                          value={authContactName}
                          onChange={(e) => setAuthContactName(e.target.value)}
                          placeholder="Roth Vannak"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 uppercase tracking-widest text-[9px]">Corporate Contact Number</label>
                        <input 
                          type="text"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          placeholder="+855 12 345 678"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all font-mono uppercase tracking-widest mt-4 cursor-pointer shadow-lg shadow-emerald-950"
                  >
                    {authMode === 'login' ? t('auth.login') : t('auth.signup')}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthError('');
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono tracking-wide underline cursor-pointer"
                  >
                    {authMode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
                  </button>
                </div>
              </div>
            ) : (
              /* CLIENT PORTAL INTERACTIVE */
              <div className="space-y-8 text-left">
                {/* Header Welcome Card */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-500 uppercase font-bold tracking-wider">Kimsan Secure Portal Area</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>
                    <h2 className="text-2xl mt-1 font-extrabold text-white">
                      {user.companyName}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Officer: <strong className="text-slate-200">{user.contactName}</strong> ({user.email}) | Secure Workspace Session Active.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl">
                    <button 
                      onClick={fetchData} 
                      disabled={isLoading}
                      className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => setCurrentTab('admin-desk')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        {t('nav.admin')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono tracking-wider text-emerald-400 block uppercase">Infrastructure Posture</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">SECURE</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Threat hunting operations 24/7/365 active.</span>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Support Tickets</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">{tickets.length}</span>
                      <span className="text-xs text-slate-500 font-mono">Active Cases</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 block">
                      {tickets.filter(t => t.status === 'open').length} critical unassigned action.
                    </span>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Managed Invoices</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">${invoices.filter(i => i.status !== 'paid').reduce((a,c) => a+c.amount, 0)}</span>
                      <span className="text-xs text-slate-500 font-mono">Due USD</span>
                    </div>
                    <span className="text-[10px] text-amber-500 block">
                      {invoices.filter(i => i.status !== 'paid').length} unpaid corporate receipts.
                    </span>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Project Deployments</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">{projects.length}</span>
                      <span className="text-xs text-slate-500 font-mono">Operational Grid</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Continuous pipeline compliance reporting.</span>
                  </div>
                </div>

                {/* Subsections: Project checkpoints and Incident filing */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Projects & Invoices */}
                  <div className="lg:col-span-7 space-y-8">
                    
                    {/* Projects Deployments card array */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                          <Laptop className="w-5 h-5 text-emerald-500" />
                          {t('portal.projects')}
                        </h3>
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                          <button
                            type="button"
                            onClick={() => setProjectViewMode('list')}
                            className={`px-3 py-1 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                              projectViewMode === 'list' 
                                ? 'bg-emerald-600/90 text-white font-bold' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {language === 'en' ? 'LIST VIEW' : 'បញ្ជីភារកិច្ច'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setProjectViewMode('gantt')}
                            className={`px-3 py-1 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                              projectViewMode === 'gantt' 
                                ? 'bg-emerald-600/90 text-white font-bold' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {language === 'en' ? 'GANTT TIMELINE' : 'គំនូសតាង GANTT'}
                          </button>
                        </div>
                      </div>

                      {projects.length > 0 && (
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <input
                            type="text"
                            value={taskSearchQuery}
                            onChange={(e) => setTaskSearchQuery(e.target.value)}
                            placeholder={language === 'en' ? "Search tasks by name..." : "ស្វែងរកភារកិច្ចតាមឈ្មោះ..."}
                            className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800/80 hover:border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                          />
                          {taskSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTaskSearchQuery('')}
                              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {projects.length === 0 ? (
                        <div className="p-6 bg-slate-950/45 text-slate-400 font-mono text-xs rounded-xl border border-slate-800 text-center">
                          NO ACTIVE DEPLOYMENT CONTRACTS ASSIGNED
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {projects.map((proj) => (
                            <div key={proj.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-sm font-bold text-white">
                                    {language === 'en' ? proj.titleEn : proj.titleKh}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    {language === 'en' ? proj.descriptionEn : proj.descriptionKh}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded capitalize">
                                  {proj.status}
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                  <span>{t('portal.progress')}</span>
                                  <span className="text-emerald-400 font-bold">{proj.progress}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${proj.progress}%` }}></div>
                                </div>
                              </div>

                              {/* Conditional View: List vs Gantt */}
                              {projectViewMode === 'list' ? (
                                /* Interactive checklists */
                                <div className="space-y-2 pt-2 border-t border-slate-900">
                                  <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">{t('portal.tasks')}</span>
                                  <div className="space-y-1.5">
                                    {(() => {
                                      const filteredTasks = proj.tasks.filter((task) => {
                                        const query = taskSearchQuery.toLowerCase().trim();
                                        if (!query) return true;
                                        const nameEn = (task.nameEn || '').toLowerCase();
                                        const nameKh = (task.nameKh || '').toLowerCase();
                                        return nameEn.includes(query) || nameKh.includes(query);
                                      });

                                      if (filteredTasks.length === 0) {
                                        return (
                                          <div className="p-4 bg-slate-950/45 text-slate-500 font-mono text-[10px] rounded-xl border border-slate-800 border-dashed text-center">
                                            {language === 'en' ? 'NO MATCHING TASKS FOUND' : 'រកមិនឃើញភារកិច្ចដែលត្រូវគ្នាទេ'}
                                          </div>
                                        );
                                      }

                                      return filteredTasks.map((task) => {
                                        const originalIdx = proj.tasks.indexOf(task);
                                        const isEditing = editingTaskId === task.id && editingProjId === proj.id;
                                        const isDragging = draggedTaskIdx === originalIdx && draggedProjId === proj.id;
                                        const isOver = isDraggingOverIdx === originalIdx && draggedProjId === proj.id;
                                        return (
                                          <div
                                            key={task.id}
                                            draggable={!isEditing}
                                            onDragStart={(e) => handleDragStart(e, proj.id, originalIdx)}
                                            onDragOver={(e) => handleDragOver(e, originalIdx)}
                                            onDragEnd={handleDragEnd}
                                            onDrop={(e) => handleDrop(e, proj.id, originalIdx)}
                                            className={`w-full p-2.5 bg-slate-900/60 border rounded-xl flex flex-col gap-1.5 transition-all duration-200 ${
                                              isDragging 
                                                ? 'opacity-25 border-dashed border-slate-700 bg-slate-950/20 scale-95 select-none pointer-events-none' 
                                                : isOver 
                                                  ? 'border-emerald-500 bg-slate-850 shadow-md shadow-emerald-500/10 -translate-y-0.5 scale-[1.01]' 
                                                  : 'border-slate-800/80 hover:border-slate-700/80'
                                            }`}
                                          >
                                          <div className="flex justify-between items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-left flex-1 min-w-0">
                                              {/* Drag Handle */}
                                              <div 
                                                className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-0.5 transition-colors shrink-0 select-none touch-none" 
                                                title="Drag to reorder"
                                              >
                                                <GripVertical className="w-3.5 h-3.5" />
                                              </div>
                                            <button
                                              type="button"
                                              onClick={() => handleToggleTask(proj.id, task.id, !task.completed)}
                                              className="flex items-center gap-2.5 text-left flex-1 cursor-pointer group"
                                            >
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                                                task.completed 
                                                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                                                  : 'border-slate-700 text-transparent group-hover:border-slate-500'
                                              }`}>
                                                <Check className="w-3 h-3" />
                                              </div>
                                              <span className={`text-[11px] font-mono leading-tight flex items-center gap-1.5 flex-wrap ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                                <span>{language === 'en' ? task.nameEn : task.nameKh}</span>
                                                {getPriorityBadge(task.priority)}
                                              </span>
                                            </button>
                                          </div>

                                          {/* Trigger note editor button */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (isEditing) {
                                                  setEditingTaskId(null);
                                                  setEditingProjId(null);
                                                } else {
                                                  setEditingTaskId(task.id);
                                                  setEditingProjId(proj.id);
                                                  setTaskNoteText(task.note || '');
                                                }
                                              }}
                                              className={`p-1 rounded opacity-70 hover:opacity-100 hover:bg-slate-800 transition-all cursor-pointer text-xs flex items-center gap-1 ${
                                                task.note ? 'text-emerald-400' : 'text-slate-500'
                                              }`}
                                              title={task.note ? t('task.editNote') : t('task.addNote')}
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                              {task.note && <span className="text-[9px] font-mono font-medium hidden sm:inline">{t('task.editNote')}</span>}
                                              {!task.note && <span className="text-[9px] font-mono font-medium hidden sm:inline">{t('task.addNote')}</span>}
                                            </button>
                                          </div>

                                          {/* Inline note edit form */}
                                          {isEditing ? (
                                            <div className="mt-1 p-2 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
                                              <textarea
                                                value={taskNoteText}
                                                onChange={(e) => setTaskNoteText(e.target.value)}
                                                placeholder={t('task.notePlaceholder')}
                                                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-[10px] font-mono text-slate-200 outline-none resize-none h-14"
                                                autoFocus
                                              />
                                              <div className="flex justify-end gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingTaskId(null);
                                                    setEditingProjId(null);
                                                  }}
                                                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded font-mono transition-colors cursor-pointer"
                                                >
                                                  {t('task.cancel')}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateTaskNote(proj.id, task.id, taskNoteText)}
                                                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded font-mono font-medium transition-colors cursor-pointer flex items-center gap-1"
                                                >
                                                  <CheckCircle2 className="w-3 h-3" />
                                                  {t('task.saveNote')}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            // Render existing note text if present
                                            task.note && (
                                              <div className="mt-1 text-[10px] font-mono text-amber-500/90 bg-amber-500/5 px-2 py-1 border border-amber-500/10 rounded-lg flex items-start gap-1.5">
                                                <span className="text-amber-500 select-none">💬</span>
                                                <p className="whitespace-pre-wrap flex-1 italic leading-relaxed">{task.note}</p>
                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateTaskNote(proj.id, task.id, '')}
                                                  className="text-slate-500 hover:text-rose-400 font-bold px-1 transition-colors leading-none align-middle cursor-pointer"
                                                  title="Delete note"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                /* Gantt Timeline View */
                                <div className="space-y-4 pt-2 border-t border-slate-900">
                                  {(() => {
                                    const filteredTasks = proj.tasks.filter((task) => {
                                      const query = taskSearchQuery.toLowerCase().trim();
                                      if (!query) return true;
                                      const nameEn = (task.nameEn || '').toLowerCase();
                                      const nameKh = (task.nameKh || '').toLowerCase();
                                      return nameEn.includes(query) || nameKh.includes(query);
                                    });

                                    if (filteredTasks.length === 0) {
                                      return (
                                        <div className="p-4 bg-slate-950/45 text-slate-500 font-mono text-[10px] rounded-xl border border-slate-800 border-dashed text-center">
                                          {language === 'en' ? 'NO MATCHING TASKS FOUND' : 'រកមិនឃើញភារកិច្ចដែលត្រូវគ្នាទេ'}
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="space-y-2.5">
                                        {/* Timeline Header Scale */}
                                        <div className="flex text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider border-b border-slate-900/60 pb-1.5 px-1">
                                          <div className="w-[35%] shrink-0">
                                            {language === 'en' ? 'PHASE CHECKPOINT' : 'ចំណុចត្រួតពិនិត្យ'}
                                          </div>
                                          <div className="w-[65%] flex justify-between text-right pl-3 relative pr-1">
                                            <span className="text-left w-14 shrink-0 truncate">{getMinifiedDate(proj.startDate)}</span>
                                            <span className="text-center w-14 shrink-0 truncate">{getIntermediateDate(proj.startDate, proj.endDate, 0.33)}</span>
                                            <span className="text-center w-14 shrink-0 truncate">{getIntermediateDate(proj.startDate, proj.endDate, 0.66)}</span>
                                            <span className="text-right w-14 shrink-0 truncate">{getMinifiedDate(proj.endDate)}</span>
                                          </div>
                                        </div>

                                        {/* Gantt rows */}
                                        <div className="space-y-2">
                                          {filteredTasks.map((task, idx) => {
                                            const originalIdx = proj.tasks.indexOf(task);
                                            const isEditing = editingTaskId === task.id && editingProjId === proj.id;
                                            
                                            // Compute horizontal spacing
                                            const startPercent = (originalIdx / proj.tasks.length) * 100;
                                            const widthPercent = (1 / proj.tasks.length) * 100;

                                            // Highlight first incomplete task as active
                                            const firstIncompleteIdx = proj.tasks.findIndex(t => !t.completed);
                                            const isActive = firstIncompleteIdx === originalIdx;

                                            return (
                                              <div key={task.id} className="space-y-1.5 border-b border-slate-900/20 pb-2 last:border-0 last:pb-0">
                                                <div className="group/gantt flex items-center p-0.5 hover:bg-slate-900/20 rounded-xl transition-all">
                                                  
                                                  {/* Left column: Check, name, note handle */}
                                                  <div className="w-[35%] flex items-center gap-1.5 shrink-0 pr-2 min-w-0">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleToggleTask(proj.id, task.id, !task.completed)}
                                                      className="w-3.5 h-3.5 rounded border border-slate-800 hover:border-slate-600 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                                                      style={{
                                                        borderColor: task.completed ? '#10b981' : undefined,
                                                        backgroundColor: task.completed ? '#10b981' : undefined,
                                                        color: '#ffffff'
                                                      }}
                                                    >
                                                      {task.completed && <Check className="w-2.5 h-2.5" />}
                                                    </button>
                                                    <span 
                                                      title={`${language === 'en' ? task.nameEn : task.nameKh} (Click to toggle)`}
                                                      className={`text-[10px] font-mono leading-tight truncate flex-1 min-w-0 cursor-pointer flex items-center gap-1.5 ${
                                                        task.completed ? 'line-through text-slate-500' : 'text-slate-300 group-hover/gantt:text-emerald-400'
                                                      }`}
                                                      onClick={() => handleToggleTask(proj.id, task.id, !task.completed)}
                                                    >
                                                      <span className="truncate">{language === 'en' ? task.nameEn : task.nameKh}</span>
                                                      {getPriorityBadge(task.priority)}
                                                    </span>

                                                    {/* Edit note trigger */}
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        if (isEditing) {
                                                          setEditingTaskId(null);
                                                          setEditingProjId(null);
                                                        } else {
                                                          setEditingTaskId(task.id);
                                                          setEditingProjId(proj.id);
                                                          setTaskNoteText(task.note || '');
                                                        }
                                                      }}
                                                      className={`p-0.5 rounded transition-all cursor-pointer ${
                                                        task.note ? 'text-amber-400 opacity-100' : 'text-slate-600 opacity-30 hover:opacity-100 hover:text-slate-400'
                                                      }`}
                                                      title={task.note ? t('task.editNote') : t('task.addNote')}
                                                    >
                                                      <FileText className="w-3 h-3" />
                                                    </button>
                                                  </div>

                                                  {/* Right column: Gantt track runway */}
                                                  <div className="w-[65%] h-5 bg-slate-950/45 rounded-lg relative overflow-hidden border border-slate-900/60 flex items-center pl-1 pr-1">
                                                    {/* Vertical guideline markers */}
                                                    <div className="absolute left-[33%] top-0 bottom-0 border-l border-slate-900/60 pointer-events-none" />
                                                    <div className="absolute left-[66%] top-0 bottom-0 border-l border-slate-900/60 pointer-events-none" />

                                                    {/* Horizontal guideline row wire */}
                                                    <div className="absolute inset-0 flex items-center pointer-events-none">
                                                      <div className="w-full border-t border-dashed border-slate-900/15"></div>
                                                    </div>

                                                    {/* Floating gantt bar */}
                                                    <div
                                                      onClick={() => handleToggleTask(proj.id, task.id, !task.completed)}
                                                      className={`h-2.5 rounded cursor-pointer transition-all hover:brightness-110 relative ${
                                                        task.completed
                                                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-sm shadow-emerald-500/15'
                                                          : isActive
                                                            ? 'bg-gradient-to-r from-teal-500/90 to-emerald-500/90 animate-pulse border border-emerald-400/20'
                                                            : 'bg-slate-800 hover:bg-slate-755 border border-slate-700/40'
                                                      }`}
                                                      style={{
                                                        left: `${startPercent}%`,
                                                        width: `${widthPercent}%`
                                                      }}
                                                      title={`${language === 'en' ? task.nameEn : task.nameKh} (${task.completed ? 'COMPLETED' : isActive ? 'ACTIVE' : 'PENDING'} - Click to toggle)`}
                                                    />
                                                  </div>
                                                </div>

                                                {/* Inline note edit form */}
                                                {isEditing ? (
                                                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 mt-1 ml-4 shadow-xl">
                                                    <textarea
                                                      value={taskNoteText}
                                                      onChange={(e) => setTaskNoteText(e.target.value)}
                                                      placeholder={t('task.notePlaceholder')}
                                                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-[10px] font-mono text-slate-200 outline-none resize-none h-14"
                                                      autoFocus
                                                    />
                                                    <div className="flex justify-end gap-1.5">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setEditingTaskId(null);
                                                          setEditingProjId(null);
                                                        }}
                                                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded font-mono transition-colors cursor-pointer"
                                                      >
                                                        {t('task.cancel')}
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleUpdateTaskNote(proj.id, task.id, taskNoteText)}
                                                        className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded font-mono font-medium transition-colors cursor-pointer flex items-center gap-1"
                                                      >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {t('task.saveNote')}
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  task.note && (
                                                    <div className="mt-1 text-[10px] font-mono text-amber-500/90 bg-amber-500/5 px-2 py-1 border border-amber-500/10 rounded-lg flex items-start gap-1.5 ml-5">
                                                      <span className="text-amber-500 select-none">💬</span>
                                                      <p className="whitespace-pre-wrap flex-1 italic leading-relaxed">{task.note}</p>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleUpdateTaskNote(proj.id, task.id, '')}
                                                        className="text-slate-500 hover:text-rose-400 font-bold px-1 transition-colors leading-none align-middle cursor-pointer"
                                                        title="Delete note"
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ESCROW & BILLING INVOICES PANEL */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
                      <h3 className="text-lg font-extrabold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-500" />
                          {t('portal.invoices')}
                        </div>
                        {invoices.length > 0 && (
                          <button
                            type="button"
                            onClick={handleExportInvoicesCsv}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 rounded-lg text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            EXPORT CSV
                          </button>
                        )}
                      </h3>

                      {invoices.length === 0 ? (
                        <div className="p-6 bg-slate-950/45 text-slate-400 font-mono text-xs rounded-xl border border-slate-800 text-center">
                          NO RECENT SERVICE INVOICES DISPATCH_FOUND
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {invoices.map((inv) => (
                            <div key={inv.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono text-slate-500 block uppercase">INVOICE #{inv.id}</span>
                                <h4 className="text-xs font-bold text-white">
                                  {language === 'en' ? inv.titleEn : inv.titleKh}
                                </h4>
                                <div className="flex gap-4 text-[10px] font-mono text-slate-400">
                                  <span>Period: {inv.billingPeriod}</span>
                                  <span>Due: {inv.dueDate}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 self-end sm:self-center">
                                <div className="text-right">
                                  <span className="text-sm font-bold text-white font-mono block">${inv.amount.toLocaleString()}</span>
                                  <span className={`text-[9px] font-mono uppercase ${inv.status === 'paid' ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                                    {inv.status}
                                  </span>
                                </div>

                                {inv.status !== 'paid' && (
                                  <button
                                    onClick={() => handlePayInvoice(inv.id)}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                                  >
                                    Pay USD
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Support Tickets list & creation */}
                  <div className="lg:col-span-5 space-y-8">
                    
                    {/* Active tickets listings */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-emerald-500" />
                          {t('portal.activeTickets')}
                        </h3>
                        {tickets.length > 0 && (
                          <button
                            type="button"
                            onClick={handleExportTicketsCsv}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 hover:text-emerald-400 border border-slate-800 rounded-xl text-[10px] font-mono font-bold tracking-wider cursor-pointer text-slate-300 flex items-center gap-1.5 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {t('portal.exportTicketsCsv')}
                          </button>
                        )}
                      </div>

                      {selectedTicket ? (
                        /* CHAT INTERACTIVE WINDOW FOR ACTIVE TICKET */
                        <div className="space-y-4 text-xs">
                          <button
                            onClick={() => setSelectedTicket(null)}
                            className="text-[10px] text-emerald-400 font-mono hover:underline cursor-pointer flex items-center gap-1 mb-2"
                          >
                            ← Back to Tickets List
                          </button>

                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                            <h4 className="text-xs font-bold text-white">{selectedTicket.subject}</h4>
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Priority: <strong className="text-amber-500 uppercase">{selectedTicket.priority}</strong></span>
                              <span>Status: <strong className="text-emerald-500 uppercase">{selectedTicket.status}</strong></span>
                            </div>
                          </div>

                          {/* Chat message streams */}
                          <div className="space-y-3 max-h-[220px] overflow-y-auto p-2 scrollbar-thin">
                            {selectedTicket.messages.map((m, idx) => (
                              <div key={idx} className={`flex flex-col ${m.senderRole === 'client' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-2.5 rounded-xl max-w-[85%] ${
                                  m.senderRole === 'client' 
                                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                                    : 'bg-slate-850 text-slate-200 border border-slate-700/40 rounded-tl-none'
                                }`}>
                                  <span className="block text-[8px] font-mono uppercase text-teal-200 font-bold tracking-wider mb-0.5">{m.senderName}</span>
                                  <p className="leading-relaxed text-[11px] font-mono whitespace-pre-wrap">{m.text}</p>
                                  {m.attachments && m.attachments.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1 min-w-[140px] max-w-full">
                                      {m.attachments.map((file) => {
                                        const isImg = file.type.startsWith('image/');
                                        return (
                                          <div key={file.id} className="bg-slate-950/40 hover:bg-slate-950/60 transition-colors border border-white/5 rounded-lg p-1 flex items-center justify-between gap-1.5 text-left">
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                              {isImg ? (
                                                <img src={file.content} alt={file.name} className="w-7 h-7 object-cover rounded bg-slate-950 border border-white/10 shrink-0" />
                                              ) : (
                                                <div className="w-7 h-7 rounded bg-white/5 border border-white/10 text-emerald-300 flex items-center justify-center shrink-0">
                                                  <File className="w-3.5 h-3.5 text-emerald-300" />
                                                </div>
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <span className="block text-[8.5px] font-mono font-medium text-slate-200 truncate" title={file.name}>
                                                  {file.name}
                                                </span>
                                                <span className="block text-[7.5px] font-mono text-slate-400">
                                                  {file.size}
                                                </span>
                                              </div>
                                            </div>
                                            <a 
                                              href={file.content} 
                                              download={file.name} 
                                              className="p-1 rounded bg-slate-950/50 hover:bg-emerald-500 hover:text-white text-slate-300 transition-colors shrink-0 cursor-pointer"
                                              title="Download"
                                              onClick={(ev) => ev.stopPropagation()}
                                            >
                                              <Download className="w-3 h-3" />
                                            </a>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[8px] text-slate-500 font-mono mt-0.5">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ))}
                          </div>

                          {/* Reply input */}
                          <form onSubmit={handleSendTicketReply} className="space-y-2">
                            {replyAttachments.length > 0 && (
                              <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
                                {replyAttachments.map((f) => (
                                  <div key={f.id} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-850 border border-slate-800/60 rounded text-[9px] font-mono text-slate-300">
                                    <File className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="truncate max-w-[80px]">{f.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setReplyAttachments(prev => prev.filter(item => item.id !== f.id))}
                                      className="text-slate-500 hover:text-rose-400 font-bold ml-1 transition-colors cursor-pointer text-[10px]"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type support reply or incident logistics..."
                                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                              />

                              <label className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center justify-center shrink-0">
                                <input 
                                  type="file" 
                                  multiple 
                                  className="hidden" 
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      processFiles(e.target.files, (newProcessed) => {
                                        setReplyAttachments(prev => [...prev, ...newProcessed]);
                                      });
                                    }
                                  }}
                                />
                                <Paperclip className="w-4 h-4" />
                              </label>

                              <button
                                type="submit"
                                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white cursor-pointer"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        /* STANDARD LISTING */
                        <div className="space-y-3">
                          {tickets.length === 0 ? (
                            <div className="p-6 bg-slate-950/45 text-slate-400 font-mono text-xs rounded-xl border border-slate-800 text-center">
                              NO TICKETS LOGGED ON YOUR ENTERPRISE DECK
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {tickets.map((tk) => (
                                <button
                                  key={tk.id}
                                  onClick={() => setSelectedTicket(tk)}
                                  className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-750/80 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5"
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">TICKET ID: {tk.id}</span>
                                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                                      tk.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-300'
                                    }`}>
                                      {tk.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-white line-clamp-1">{tk.subject}</p>
                                  <div className="flex justify-between w-full text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                                    <span>Last updated: {new Date(tk.lastUpdated).toLocaleDateString()}</span>
                                    <span className="text-emerald-400 font-bold uppercase">{tk.status}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* DISPATCH INCIDENT TICKET FORM */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                        {t('portal.newTicket')}
                      </h3>

                      <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs font-mono">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider">{t('portal.subject')} *</label>
                          <input 
                            type="text"
                            required
                            value={newTicketSubject}
                            onChange={(e) => setNewTicketSubject(e.target.value)}
                            placeholder="e.g. Critical Threat Detection on cloud instance"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider">{t('portal.category')} *</label>
                            <select
                              value={newTicketCategory}
                              onChange={(e) => setNewTicketCategory(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-2 py-1.5 text-xs text-slate-300 outline-none"
                            >
                              <option value="security_alert">SOC Alert</option>
                              <option value="it_support">IT Support</option>
                              <option value="compliance">Compliance</option>
                              <option value="incident">Active Incident</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider">{t('portal.priority')} *</label>
                            <select
                              value={newTicketPriority}
                              onChange={(e) => setNewTicketPriority(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-2 py-1.5 text-xs text-slate-300 outline-none"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical (Incident response)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider">{t('portal.desc')} *</label>
                          <textarea 
                            rows={3}
                            required
                            value={newTicketMsg}
                            onChange={(e) => setNewTicketMsg(e.target.value)}
                            placeholder="State incident details to dispatcher..."
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                          ></textarea>
                        </div>

                        {/* File Upload Attachment Area */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider">{t('ticket.attachments')}</label>
                          <div className="border border-dashed border-slate-800 hover:border-slate-750 bg-slate-950/65 rounded-xl p-3.5 transition-colors text-center relative hover:bg-slate-950">
                            <input 
                              type="file" 
                              multiple 
                              onChange={(e) => {
                                if (e.target.files) {
                                  processFiles(e.target.files, (newProcessed) => {
                                    setNewTicketAttachments(prev => [...prev, ...newProcessed]);
                                  });
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-1 text-slate-400 pointer-events-none">
                              <Paperclip className="w-5 h-5 mx-auto text-emerald-500" />
                              <span className="block text-[9px] font-medium text-slate-300">{t('ticket.dragDrop')}</span>
                            </div>
                          </div>

                          {/* Selected files indicator list */}
                          {newTicketAttachments.length > 0 && (
                            <div className="grid grid-cols-1 gap-1 mt-1.5">
                              {newTicketAttachments.map((f) => (
                                <div key={f.id} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850/80 rounded-lg text-[9px]">
                                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                    <File className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="truncate text-slate-300 font-medium">{f.name}</span>
                                    <span className="text-[7.5px] text-slate-500 font-mono">({f.size})</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setNewTicketAttachments(prev => prev.filter(item => item.id !== f.id))}
                                    className="p-1 text-slate-500 hover:text-rose-400 font-bold transition-colors cursor-pointer text-[11px]"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-950 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          {t('portal.submitTicket')}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN COMMAND PANEL core sub-view */}
        {currentTab === 'admin-desk' && user && user.role === 'admin' && (
          <div className="space-y-8 py-6 text-left">
            {/* Header section card */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-500 uppercase font-bold tracking-wider">Kimsan Supervisor Core Control</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                </div>
                <h2 className="text-2xl mt-1 font-extrabold text-white">{t('admin.dashboard')}</h2>
                <p className="text-xs text-slate-400">
                  Global Telemetry & Enterprise Pipeline Management System.
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={fetchData} 
                  disabled={isLoading}
                  className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => setCurrentTab('portal')}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  View Client Portal
                </button>
              </div>
            </div>

            {/* Admin Overview Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">{t('admin.contracts')}</span>
                <span className="text-2xl font-black text-white font-mono block mt-1">${totalInvoiced.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500">Pipeline corporate gross val.</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Settled Escrow Payments</span>
                <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">${totalPaid.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-500">Recurrent annual SOC licenses.</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Unpaid Outstanding Contracts</span>
                <span className="text-2xl font-black text-rose-400 font-mono block mt-1">${totalUnpaid.toLocaleString()}</span>
                <span className="text-[10px] text-rose-500 font-bold">{invoices.filter(i=>i.status!=='paid').length} corporate bills pending.</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">{t('admin.leadsNum')}</span>
                <span className="text-2xl font-black text-white font-mono block mt-1">{crmLeads.length} Opportunities</span>
                <span className="text-[10px] text-slate-500">Inquiry queue to follow-up.</span>
              </div>
            </div>

            {/* Analytics and Pipelines block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pipeline chart */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-1">
                  <TrendingUp className="w-4.5 h-4.5 text-emerald-500" /> Pipeline Funnel Distribution
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsPipelineData}>
                      <XAxis dataKey="stage" stroke="#888" fontSize={11} />
                      <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                      <Bar dataKey="cnt" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk distribution chart */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-1">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" /> {t('admin.riskList')}
                </h3>
                <div className="h-[200px] flex items-center justify-around">
                  <div className="h-full w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={industryStatsData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {industryStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    {industryStatsData.map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: e.color }}></span>
                        <span className="text-slate-300">{e.name}:</span>
                        <span className="font-bold text-white">{e.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TABULAR LAYOUTS: CRM Leads and Support Ticket escalation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* CRM leads table */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-emerald-500" />
                    {t('admin.crm')}
                  </div>
                  {crmLeads.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportLeadsCsv}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 rounded-lg text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      EXPORT CSV
                    </button>
                  )}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-300 text-left font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                        <th className="py-2.5">Enterprise Entity</th>
                        <th className="py-2.5">Inquiry Point</th>
                        <th className="py-2.5">Risk Score</th>
                        <th className="py-2.5 text-right">Pipeline Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {crmLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-950/40">
                          <td className="py-3 font-semibold text-white">{lead.company}</td>
                          <td className="py-3">
                            <div>{lead.name}</div>
                            <div className="text-[10px] text-slate-500">{lead.email}</div>
                          </td>
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              lead.riskScore >= 75 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>{lead.riskScore}</span>
                          </td>
                          <td className="py-3 text-right">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-[11px] outline-none text-slate-200 cursor-pointer"
                            >
                              <option value="lead">Lead</option>
                              <option value="contacted">Contacted</option>
                              <option value="negotiation">Negotiation</option>
                              <option value="converted">Converted</option>
                              <option value="lost">Lost</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Administrative tickets handling portal */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    {t('admin.manageTickets')}
                  </h3>
                  {tickets.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportTicketsCsv}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 hover:text-emerald-400 border border-slate-800 rounded-xl text-[10px] font-mono font-bold tracking-wider cursor-pointer text-slate-300 flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('portal.exportTicketsCsv')}
                    </button>
                  )}
                </div>

                {selectedTicket ? (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    <button onClick={() => setSelectedTicket(null)} className="text-[10px] text-emerald-400 font-mono hover:underline cursor-pointer select-none">
                      ← Exit Selected Ticket
                    </button>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500">Enterprise:</span>
                      <h4 className="text-sm font-sub font-bold text-white">{selectedTicket.companyName} ({selectedTicket.userId})</h4>
                      <p className="text-xs text-slate-300 mt-1">Topic: <strong className="text-white font-mono">{selectedTicket.subject}</strong></p>
                    </div>

                     <div className="border-t border-slate-900 pt-3 space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                      {selectedTicket.messages.map((m, i) => (
                        <div key={i} className="text-[11px] leading-relaxed">
                          <strong className="text-slate-400 uppercase font-mono text-[9px]">{m.senderName} ({m.senderRole}):</strong>
                          <p className="p-2 bg-slate-900 rounded-xl mt-0.5 text-slate-300 font-mono whitespace-pre-wrap">{m.text}</p>

                          {/* Message attachments indicator or thumbnails for admin */}
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="mt-1.5 flex flex-col gap-1 pl-2">
                              {m.attachments.map((file) => {
                                const isImg = file.type.startsWith('image/');
                                return (
                                  <div key={file.id} className="bg-slate-900 border border-slate-800 rounded-lg p-1 border-white/5 flex items-center justify-between gap-1.5 text-left">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      {isImg ? (
                                        <img src={file.content} alt={file.name} className="w-6 h-6 object-cover rounded bg-slate-950 border border-slate-800 shrink-0" />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shrink-0">
                                          <File className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <span className="block text-[8px] font-mono text-slate-200 truncate" title={file.name}>
                                          {file.name}
                                        </span>
                                        <span className="block text-[7px] font-mono text-slate-400">
                                          {file.size}
                                        </span>
                                      </div>
                                    </div>
                                    <a 
                                      href={file.content} 
                                      download={file.name} 
                                      className="p-1 rounded bg-slate-950/50 hover:bg-emerald-500 hover:text-white text-slate-300 transition-colors shrink-0 cursor-pointer"
                                      title="Download"
                                      onClick={(ev) => ev.stopPropagation()}
                                    >
                                      <Download className="w-3 h-3" />
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Quick action changes */}
                    <div className="flex gap-2 font-mono text-[11px]">
                      <button 
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                        className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        ✓ Mark Resolved
                      </button>
                      <button 
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress')}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        ⚡ Active SLA Status
                      </button>
                    </div>

                    {/* Direct Admin response */}
                    <form onSubmit={handleSendTicketReply} className="space-y-2">
                      {replyAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
                          {replyAttachments.map((f) => (
                            <div key={f.id} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-850 rounded text-[8.5px] font-mono text-slate-300">
                              <File className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[80px]">{f.name}</span>
                              <button
                                type="button"
                                onClick={() => setReplyAttachments(prev => prev.filter(item => item.id !== f.id))}
                                className="text-slate-500 hover:text-rose-400 font-bold ml-1 transition-colors cursor-pointer text-[10px]"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input 
                          type="text"
                          required
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t('admin.reply')}
                          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                        />

                        <label className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center justify-center shrink-0">
                          <input 
                            type="file" 
                            multiple 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files) {
                                processFiles(e.target.files, (newProcessed) => {
                                  setReplyAttachments(prev => [...prev, ...newProcessed]);
                                });
                              }
                            }}
                          />
                          <Paperclip className="w-4 h-4" />
                        </label>

                        <button type="submit" className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((tk) => (
                      <div key={tk.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            <span className="text-[9px] text-slate-500 font-mono font-bold">CLIENT: {tk.companyName}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <span className="text-[10px] text-amber-500 font-mono font-bold uppercase">{tk.priority}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{tk.subject}</h4>
                        </div>
                        <button
                          onClick={() => setSelectedTicket(tk)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white text-xs cursor-pointer"
                        >
                          Manage →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* EXPANDED PANEL: Launch Project, Issue Invoices, publish advisories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* LAUNCH NEW SECURITY PROJECT */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-sm font-sub font-bold text-white uppercase border-b border-slate-800 pb-2">Launch Deployment Contract</h3>
                <form onSubmit={handleLaunchProject} className="space-y-3.5 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase">Target Corporate Enterprise *</label>
                    <input 
                      type="text"
                      required
                      value={newProjClient}
                      onChange={(e) => setNewProjClient(e.target.value)}
                      placeholder="e.g. Vattanac Group Enterprises"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase">Project Heading Title (English) *</label>
                    <input 
                      type="text"
                      required
                      value={newProjTitleEn}
                      onChange={(e) => setNewProjTitleEn(e.target.value)}
                      placeholder="e.g. PCI Compliance Audit Stage 1"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase">Project Desc (English)</label>
                    <textarea
                      rows={2}
                      value={newProjDescEn}
                      onChange={(e) => setNewProjDescEn(e.target.value)}
                      placeholder="Brief parameters of contract execution..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    Deploy Active Project Contract
                  </button>
                </form>
              </div>

              {/* ISSUE INVOICE PANEL */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-sm font-sub font-bold text-white uppercase border-b border-slate-800 pb-2">{t('admin.createInvoice')}</h3>
                <form onSubmit={handleIssueInvoice} className="space-y-3.5 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase">{t('admin.clientCompany')} *</label>
                    <input 
                      type="text"
                      required
                      value={newInvClient}
                      onChange={(e) => setNewInvClient(e.target.value)}
                      placeholder="e.g. Vattanac Group Enterprises"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase">{t('admin.invoiceTitle')} *</label>
                    <input 
                      type="text"
                      required
                      value={newInvTitle}
                      onChange={(e) => setNewInvTitle(e.target.value)}
                      placeholder="SOC Compliance readiness reviews fee"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase">{t('admin.invoiceAmount')} *</label>
                      <input 
                        type="number"
                        required
                        value={newInvAmount}
                        onChange={(e) => setNewInvAmount(e.target.value)}
                        placeholder="5000"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase">{t('admin.invoiceDue')} *</label>
                      <input 
                        type="date"
                        required
                        value={newInvDue}
                        onChange={(e) => setNewInvDue(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-2 py-1.5 text-xs text-slate-300 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    Issue Service Invoice
                  </button>
                </form>
              </div>

              {/* PUBLISH NEWSLETTER BLOG ADVISORY */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-sm font-sub font-bold text-white uppercase border-b border-slate-800 pb-2">Publish Threat Advisory Bulletin</h3>
                
                {blogSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[11px] font-mono">
                    Bulletin successfully syndicated globally.
                  </div>
                )}

                <form onSubmit={handleCreateBlog} className="space-y-3.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl space-y-3.5">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">English Language Edition *</span>
                    <input 
                      type="text" required value={newBlogTitleEn} onChange={(e) => setNewBlogTitleEn(e.target.value)}
                      placeholder="Title: New Ransomware vectors detected"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    <textarea 
                      rows={2} required value={newBlogContentEn} onChange={(e) => setNewBlogContentEn(e.target.value)}
                      placeholder="Brief details or bullet logs..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none resize-none"
                    ></textarea>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl space-y-3.5">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">Khmer Edition *</span>
                    <input 
                      type="text" required value={newBlogTitleKh} onChange={(e) => setNewBlogTitleKh(e.target.value)}
                      placeholder="ចំណងជើងជាភាសាខ្មែរ"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    <textarea 
                      rows={2} required value={newBlogContentKh} onChange={(e) => setNewBlogContentKh(e.target.value)}
                      placeholder="ព័ត៌មានលម្អិតជាភាសាខ្មែរ..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none resize-none"
                    ></textarea>
                  </div>

                  <div className="flex gap-4">
                    <input type="text" value={newBlogCategoryEn} onChange={(e) => setNewBlogCategoryEn(e.target.value)} placeholder="Category (e.g. ALERT)" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs outline-none" />
                    <label className="flex items-center gap-2 text-[10px] cursor-pointer">
                      <input type="checkbox" checked={newBlogAdvisory} onChange={(e) => setNewBlogAdvisory(e.target.checked)} className="rounded" />
                      Critical Advisory
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    Syndicate Advisory
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* COMPACT FLOATING LIVE CHAT CORE WIDGET */}
      <ChatWidget language={language} t={t} />

      {/* SLEEK STRATEGIC FOOTER PANEL */}
      <footer className={`mt-24 border-t py-12 transition-colors relative z-10 text-xs ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm tracking-widest text-slate-400 uppercase">{t('nav.brand')}</span>
            </div>
            <p className="text-[11px] leading-relaxed max-w-xs">{t('hero.subtitle')}</p>
          </div>

          <div className="md:col-span-4 space-y-2">
            <span className="font-mono text-[10px] tracking-widest text-slate-400 block uppercase">Operational Base Phnom Penh</span>
            <p className="leading-relaxed text-[11px] font-sans">
              {t('footer.addr')}
            </p>
          </div>

          <div className="md:col-span-4 space-y-2">
            <span className="font-mono text-[10px] tracking-widest text-slate-400 block uppercase">Crisis Incident Dispatch</span>
            <p className="text-emerald-500 font-bold font-mono text-sm block">
              {t('footer.phone')}
            </p>
            <p className="text-[10px] text-slate-500 italic max-w-xs leading-normal">
              Kimsan Cyber Security is a registered cybersecurity research syndicate. All activities are authorized under compliance frameworks.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-slate-900 text-center font-mono text-[10px] text-slate-500">
          {t('footer.disclaimer')}
        </div>
      </footer>

      {/* TOAST SYSTEM ALERTS */}
      <div id="toast-portal-container" className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md justify-between transition-all pointer-events-auto ${
                toast.type === 'ticket'
                  ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
                  : toast.type === 'invoice'
                  ? 'bg-amber-950/95 border-amber-500/40 text-amber-100 shadow-amber-950/40'
                  : 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-slate-950/40'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  toast.type === 'ticket'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : toast.type === 'invoice'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {toast.type === 'ticket' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                  {toast.type === 'invoice' && <DollarSign className="w-4 h-4 text-amber-400" />}
                  {toast.type === 'info' && <Shield className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-widest font-extrabold block opacity-60">
                    {toast.type === 'ticket' ? t('toast.category.ticket') : toast.type === 'invoice' ? t('toast.category.invoice') : t('toast.category.system')}
                  </span>
                  <p className="text-[11px] font-mono leading-relaxed text-slate-200">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 p-1 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
