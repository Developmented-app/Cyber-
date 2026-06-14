import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Aegis Gemini Client initialized successfully.');
  } else {
    console.warn('Warning: GEMINI_API_KEY not found in environment. AI features will fallback gracefully.');
  }
} catch (err) {
  console.error('Failed to initialize Gemini Client:', err);
}

// Durable File Database Path
const DB_PATH = path.join(__dirname, 'database_store.json');

// Initial seed data structures
const INITIAL_DATABASE = {
  users: [
    {
      id: 'admin-1',
      email: 'admin@kimsan.com',
      password: 'admin',
      role: 'admin',
      companyName: 'Kimsan Cyber Security',
      contactName: 'Operational Admin',
      phone: '+855 12 93949145',
    },
    {
      id: 'client-1',
      email: 'it@vattanac.com.kh',
      password: 'client',
      role: 'client',
      companyName: 'Vattanac Group Enterprises',
      contactName: 'Roth Vannak',
      phone: '+855 12 888 777',
    },
    {
      id: 'client-2',
      email: 'security@aba.com.kh',
      password: 'client',
      role: 'client',
      companyName: 'Advanced Banking Corp',
      contactName: 'Sokha Rith',
      phone: '+855 99 777 555',
    }
  ],
  crmLeads: [
    {
      id: 'lead-1',
      name: 'Odom Phisal',
      email: 'ceo@khemartech.com',
      company: 'KhemarTech Digital Group',
      phone: '+855 77 123 456',
      status: 'lead',
      riskScore: 75,
      createdAt: '2026-06-10T14:30:00Z',
    },
    {
      id: 'lead-2',
      name: 'Sophy Neang',
      email: 'ops@angkormall.kh',
      company: 'Angkor Supermarkets Plc',
      phone: '+855 15 999 888',
      status: 'contacted',
      riskScore: 60,
      createdAt: '2026-06-11T09:15:00Z',
    },
    {
      id: 'lead-3',
      name: 'Vannak Ty',
      email: 'tech@phnombank.kh',
      company: 'Phnom Penh Capital Savings Bank',
      phone: '+855 23 888 222',
      status: 'negotiation',
      riskScore: 88,
      createdAt: '2026-06-12T11:45:00Z',
    }
  ],
  tickets: [
    {
      id: 'tick-1',
      userId: 'client-1',
      userEmail: 'it@vattanac.com.kh',
      companyName: 'Vattanac Group Enterprises',
      subject: 'Urgent Phishing Campaign Simulation Review',
      category: 'security_alert',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2026-06-12T10:00:00Z',
      lastUpdated: '2026-06-13T16:00:00Z',
      messages: [
        {
          id: 'm1',
          senderRole: 'client',
          senderName: 'Roth Vannak',
          text: 'We noted an increase in suspicious emails matching the simulated credential harvesting vectors yesterday. Can you deploy a darkweb audit for the vattanac.com.kh domain credentials?',
          timestamp: '2026-06-12T10:00:00Z',
          attachments: [
            {
              id: 'att-1',
              name: 'phishing_simulation_header.svg',
              size: '1.2 KB',
              type: 'image/svg+xml',
              content: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' rx='8' fill='%231e293b' stroke='%23f43f5e' stroke-width='1.5'/><text x='60' y='30' font-family='monospace' font-weight='bold' font-size='8' fill='%23f43f5e' text-anchor='middle'>ALERT DETECTED</text><text x='60' y='45' font-family='monospace' font-size='7' fill='%23cbd5e1' text-anchor='middle'>Spoofed Mail Payload</text><text x='60' y='60' font-family='monospace' font-size='6' fill='%2394a3b8' text-anchor='middle'>vattanac-support.com</text></svg>"
            }
          ]
        },
        {
          id: 'm2',
          senderRole: 'admin',
          senderName: 'SOC Analyst #4',
          text: 'Understood, Vannak. We triggered a complete corporate domain breach lookup scan in the Aegis intelligence datalake. We found 3 leaked contractor emails from late 2025. Restricting access to sensitive endpoints is advised while we compile the complete containment log.',
          timestamp: '2026-06-13T16:00:00Z',
          attachments: [
            {
              id: 'att-2',
              name: 'Aegis_Domain_Breach_Audit_Report.pdf',
              size: '242 KB',
              type: 'application/pdf',
              content: 'data:text/plain;charset=utf-8,--- AEGIS SECURITY DOMAIN BREACH AUDIT REPORT ---\nTarget: vattanac.com.kh\nTime: 2026-06-13\nLeaked accounts detected: 3. Status: Compromised. Action Recommended.'
            }
          ]
        }
      ]
    },
    {
      id: 'tick-2',
      userId: 'client-2',
      userEmail: 'security@aba.com.kh',
      companyName: 'Advanced Banking Corp',
      subject: 'Critical: Firewall Policy Configuration Advisory',
      category: 'it_support',
      priority: 'critical',
      status: 'open',
      createdAt: '2026-06-13T21:00:00Z',
      lastUpdated: '2026-06-13T21:00:00Z',
      messages: [
        {
          id: 'm1',
          senderRole: 'client',
          senderName: 'Sokha Rith',
          text: 'We are deploying a brand new digital POS terminal and need to audit open ports to conform with national bank PCI guidelines. Please confirm Aegis threat mapping team is on standby.',
          timestamp: '2026-06-13T21:00:00Z',
        }
      ]
    }
  ],
  projects: [
    {
      id: 'proj-1',
      titleEn: 'ISO 27001 Certification Readiness Deployment',
      titleKh: 'ការរៀបចំវិញ្ញាបនប័ត្រ ISO 27001 សហគ្រាស',
      clientCompany: 'Vattanac Group Enterprises',
      descriptionEn: 'Preparing complete security policies, controls alignment, and mock internal control checks for the entire corporate conglomerate.',
      descriptionKh: 'ការរៀបចំបញ្ជីគោលនយោបាយសន្តិសុខ ការកែតម្រូវប្រព័ន្ធគ្រប់គ្រង និងការធ្វើតេស្តសាកល្បងសម្រាប់សហគ្រាសទាំងមូល។',
      status: 'active',
      progress: 65,
      startDate: '2026-05-01',
      endDate: '2026-08-30',
      tasks: [
        { id: 't1', nameEn: 'Corporate Threat Asset Discovery Schema', nameKh: 'ការធ្វើបញ្ជីសារពើភ័ណ្ឌទ្រព្យសកម្ម និងការគំរាមកំហែង', completed: true },
        { id: 't2', nameEn: 'Access Management Policy Decrypting Standards', nameKh: 'ប្រព័ន្ធគ្រប់គ្រងសិទ្ធិចូលដំណើរការបុគ្គលិក', completed: true },
        { id: 't3', nameEn: 'Next-Gen Firewall Policy Deployment review', nameKh: 'សវនកម្មលើការកំណត់គោលការណ៍ Firewall ជំនាន់ថ្មី', completed: true },
        { id: 't4', nameEn: 'Conduct Aegis Broad Penetration Test Stage 1', nameKh: 'ការសាកល្បងជ្រៀតចូលប្រព័ន្ធដំណាក់កាលទី១', completed: false },
        { id: 't5', nameEn: 'Disaster Recovery Plan (DRP) Multi-site Sync', nameKh: 'គម្រោងងើបឡើងវិញពីគ្រោះមហន្តរាយទិន្នន័យ (DRP)', completed: false }
      ]
    },
    {
      id: 'proj-2',
      titleEn: 'Aegis SOC Threat Intelligence Integration',
      titleKh: 'ការរួមបញ្ចូលការវិភាគការគំរាមកំហែង Aegis SOC',
      clientCompany: 'Advanced Banking Corp',
      descriptionEn: 'Continuous agent endpoint visibility setup, automated SIEM pipeline configurations, and SOC response team alignments.',
      descriptionKh: 'ការរៀបចំប្រព័ន្ធត្រួតពិនិត្យ Endpoint, ការតភ្ជាប់ទិន្នន័យ SIEM ស្វ័យប្រវត្ត និងការបញ្ជាក្រុមការងារឆ្លើយតប SOC ២៤ម៉ោង។',
      status: 'auditing',
      progress: 85,
      startDate: '2026-04-10',
      endDate: '2026-07-15',
      tasks: [
        { id: 't1', nameEn: 'SIEM Core Agent Deployment on Servers', nameKh: 'ការតម្លើងភ្នាក់ងារ SIEM លើគ្រប់ម៉ាស៊ីនមេ', completed: true },
        { id: 't2', nameEn: '24/7 Security Alarm Thresholds Formulation', nameKh: 'ការកំណត់កម្រិតរោទិ៍ប្រកាសអាសន្ន ២៤ម៉ោង', completed: true },
        { id: 't3', nameEn: 'Admin Role Access Control Authentication (MFA)', nameKh: 'ការតម្លើងការផ្ទៀងផ្ទាត់ពហុកត្តា (MFA) សម្រាប់ Admin', completed: true },
        { id: 't4', nameEn: 'Simulated DDOS Stress Test with 20Gbps attack', nameKh: 'ការសាកល្បងទប់ទល់ការវាយប្រហារ DDOS ២០ជីហ្គាប៊ីត/វិ', completed: false }
      ]
    }
  ],
  invoices: [
    {
      id: 'inv-1',
      clientCompany: 'Vattanac Group Enterprises',
      titleEn: 'Enterprise SOC Annual Sentinel Subscriptions',
      titleKh: 'កិច្ចសន្យាប្រចាំឆ្នាំការត្រួតពិនិត្យ Aegis SOC',
      amount: 14500,
      dueDate: '2026-07-01',
      status: 'unpaid',
      createdAt: '2026-06-01',
      billingPeriod: 'June 2026 - May 2027',
    },
    {
      id: 'inv-2',
      clientCompany: 'Advanced Banking Corp',
      titleEn: 'Complete Full-Scope Tactical Red Team Audit',
      titleKh: 'ថ្លៃសេវាកម្មវាយប្រហារសាកល្បង Red Team ពេញលេញ',
      amount: 8200,
      dueDate: '2026-06-25',
      status: 'paid',
      createdAt: '2026-05-25',
      billingPeriod: 'Milestone 1 Completed',
    }
  ],
  blogPosts: [
    {
      id: 'blog-1',
      titleEn: 'APT-39 Active Threat Alert: Target Vulnerability Targets',
      titleKh: 'ការប្រកាសអាសន្នក្រុមគំរាមកំហែង APT-39៖ គោលដៅវាយប្រហារក្នុងតំបន់',
      contentEn: 'Aegis threat team is tracking an active campaign by advanced persistent threat actors targeting telecom assets inside Cambodia and surrounding ASEAN environments. The malware utilizes sophisticated DLL sideloading techniques in vulnerable software.',
      contentKh: 'ក្រុមសន្តិសុខ Aegis កំពុងតាមដានយ៉ាងសកម្មនូវយុទ្ធនាការវាយប្រហារពីក្រុម APT-39 ដែលផ្តោតលើហេដ្ឋារចនាសម្ព័ន្ធព័ត៌មានវិទ្យានិងទូរគមនាគមន៍នៅក្នុងប្រទេសកម្ពុជានិងតំបន់អាស៊ាន។ មេរោគនេះប្រើប្រាស់បច្ចេកទេស DLL sideloading។',
      authorEn: 'Dr. Chantara Sorn, SOC Architect',
      authorKh: 'បណ្ឌិត សន ចាន់តារា, បណ្តាញការពារ SOC',
      categoryEn: 'IMMEDIATE ADVISORY',
      categoryKh: 'ការណែនាំបន្ទាន់',
      date: 'June 12, 2026',
      readTime: '3 min read',
      isAdvisory: true,
    },
    {
      id: 'blog-2',
      titleEn: 'Decoding ISO 27001:2022 Guidelines for Financial Firms',
      titleKh: 'ការវិភាគលើស្តង់ដារ ISO 27001:2022 សម្រាប់ស្ថាប័នហិរញ្ញវត្ថុ',
      contentEn: 'How emerging financial tech systems can structurally adapt to the latest cybersecurity frameworks. Learn the essential 93 controls matrix and cloud security standards mandated by regional bank councils.',
      contentKh: 'របៀបដែលប្រព័ន្ធបច្ចេកវិទ្យាហិរញ្ញវត្ថុដែលកំពុងរីកចម្រើនអាចសម្របខ្លួនទៅនឹងក្របខ័ណ្ឌសន្តិសុខចុងក្រោយបង្អស់។ សិក្សាអំពីចំណុចគ្រប់គ្រងសំខាន់ៗទាំង៩៣ និងបទប្បញ្ញត្តិសន្តិសុខ Cloud។',
      authorEn: 'Visal Kong, Security Lead',
      authorKh: 'គង់ វិសាល, ប្រធានផ្នែកសន្តិសុខ',
      categoryEn: 'WHITE PAPER',
      categoryKh: 'សៀវភៅណែនាំ',
      date: 'June 08, 2026',
      readTime: '8 min read',
      isAdvisory: false,
    },
    {
      id: 'blog-3',
      titleEn: 'Best MFA Protocols to Resolute Zero-Day Vulnerability Attacks',
      titleKh: 'របៀបកំណត់ការផ្ទៀងផ្ទាត់ពហុកត្តា (MFA) ការពារការលួចទិន្នន័យ',
      contentEn: 'Relying exclusively on SMS OTP security is no longer adequate. We break down enterprise token protocols, hardware authentication keys, and FIDO2 authentication paradigms ensuring total corporate system integrity.',
      contentKh: 'ការប្រើប្រាស់តែប្រព័ន្ធផ្ទៀងផ្ទាត់សារ SMS តែមួយមុខលែងមានសុវត្ថិភាពខ្ពស់ទៀតហើយ។ យើងបង្ហាញអំពីពិធីការ Enterprise Token, គ្រាប់ Hardware key និងពិធីការ FIDO2 ការពារប្រព័ន្ធបានយ៉ាងរឹងមាំ។',
      authorEn: 'Aegis Security Operations',
      authorKh: 'ក្រុមប្រតិបត្តិការ Aegis',
      categoryEn: 'PRACTICAL GUIDE',
      categoryKh: 'ការណែនាំអនុវត្ត',
      date: 'May 30, 2026',
      readTime: '5 min read',
      isAdvisory: false,
    }
  ]
};

// Database persistence read/write
function readDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } else {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATABASE, null, 2));
      return INITIAL_DATABASE;
    }
  } catch (err) {
    console.error('Error reading file database:', err);
    return INITIAL_DATABASE;
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to file database:', err);
  }
}

// Ensure database file is generated on starts
readDB();


// --- BACKEND CUSTOM API ENDPOINTS ---

// AI Virtual Assistant chat proxy
app.post('/api/gemini/chat', async (req, res) => {
  const { message, language } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message payload is required' });
  }

  const identityInstruction = `
    You are Kimsan AI, the premier Virtual Security Advisor of Kimsan Cyber Security based in Phnom Penh, Cambodia.
    Your tone must be authoritative, security-conscious, professional, and helpful. You speak to enterprise directors, IT specialists, and bank executives.
    Guidelines:
    1. Respond in ${language === 'en' ? 'English' : 'Khmer (Cambodian)'}. If the user switches languages, support them smoothly.
    2. Answer questions regarding cybersecurity guidelines (MFA, firewalls, threat alert, ISO 27001 requirements, penetration testing frameworks, national guidelines in Cambodia by MPTC).
    3. Keep responses concise, practical, styled cleanly with bullet points if helpful, and avoid fluffy introductory sentences.
    4. If asked to report an incident, instruct the user to create an Incident Ticket in the Kimsan Client Portal or to dial the Kimsan direct threat line (+855 12 93949145) for immediate emergency dispatch.
    5. Always remain helpful, defensive-focused, and never offer illegal exploit advice.
  `;

  try {
    if (!aiClient) {
      // Fallback response if API key is not present
      const fallbackMsg = language === 'en' 
        ? "Greetings from Kimsan Cyber Security. Our active Gemini connection is offline due to workspace secret setups. Please reach of our 24/7 Phnom Penh threat center directly at +855 12 93949145."
        : "សូមជម្រាបសួរពីមជ្ឈមណ្ឌល Kimsan Cyber Security។ ការតភ្ជាប់ AI មិនទាន់ត្រូវបានកំណត់ជាសកលនៅក្នុងប្រព័ន្ធសម្ងាត់។ សូមទំនាក់ទំនងមជ្ឈមណ្ឌលបន្ទាន់ភ្នំពេញលេខ +៨៥៥ ១២ ៩៣៩៤៩១៤៥។";
      return res.json({ reply: fallbackMsg });
    }

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: identityInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || (language === 'en' ? "System idle. Alert dispatched." : "ប្រព័ន្ធនៅទំនេរ។ មិនមានការឆ្លើយតប។");
    res.json({ reply: text });
  } catch (err: any) {
    console.error('Gemini assistant fail:', err);
    res.status(500).json({ error: 'AI processing timeout', details: err.message });
  }
});

// Authentication Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email username or secret passcode.' });
  }

  // Create simple signed token mockup for secure session representation
  const token = `aegis-tok-${user.id}-${Date.now()}`;
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      contactName: user.contactName,
      phone: user.phone,
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, companyName, contactName, phone } = req.body;
  if (!email || !password || !companyName || !contactName) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const db = readDB();
  const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Corporate email already registered inside our SOC directory.' });
  }

  const newUser = {
    id: `client-${Date.now()}`,
    email,
    password,
    role: 'client',
    companyName,
    contactName,
    phone: phone || '',
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({ success: true, message: 'Corporate profile registration complete.' });
});

// Blog Repository
app.get('/api/blog', (req, res) => {
  const db = readDB();
  res.json(db.blogPosts);
});

app.post('/api/blog', (req, res) => {
  const { titleEn, titleKh, contentEn, contentKh, authorEn, authorKh, categoryEn, categoryKh, isAdvisory } = req.body;
  if (!titleEn || !titleKh || !contentEn || !contentKh) {
    return res.status(400).json({ error: 'Missing mandatory contents for bilingual posting.' });
  }

  const db = readDB();
  const newPost = {
    id: `blog-${Date.now()}`,
    titleEn,
    titleKh,
    contentEn,
    contentKh,
    authorEn: authorEn || 'Aegis SOC Director',
    authorKh: authorKh || 'នាយកប្រតិបត្តិសន្តិសុខ Aegis',
    categoryEn: categoryEn || 'TECH REPORT',
    categoryKh: categoryKh || 'របាយការណ៍បច្ចេកទេស',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    readTime: '3 min read',
    isAdvisory: !!isAdvisory,
  };

  db.blogPosts.unshift(newPost);
  writeDB(db);

  res.json(newPost);
});

// Tickets Management
app.get('/api/tickets', (req, res) => {
  const company = req.query.company as string;
  const db = readDB();
  
  if (company && company !== 'Aegis Security Operations') {
    // Client view filtered by companyName
    const filtered = db.tickets.filter((t: any) => t.companyName.toLowerCase() === company.toLowerCase());
    return res.json(filtered);
  }
  
  // Administrator view
  res.json(db.tickets);
});

app.post('/api/tickets', (req, res) => {
  const { userEmail, companyName, subject, category, priority, message, senderName, userId, attachments } = req.body;
  if (!userEmail || !companyName || !subject || !message) {
    return res.status(400).json({ error: 'Fields missing for ticket activation.' });
  }

  const db = readDB();
  const newTicket = {
    id: `tick-${Date.now()}`,
    userId: userId || 'guest',
    userEmail,
    companyName,
    subject,
    category: category || 'it_support',
    priority: priority || 'medium',
    status: 'open',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    messages: [
      {
        id: `m-${Date.now()}`,
        senderRole: 'client',
        senderName: senderName || 'Corporate Contact',
        text: message,
        timestamp: new Date().toISOString(),
        attachments: attachments || []
      }
    ]
  };

  db.tickets.unshift(newTicket);
  writeDB(db);
  res.json(newTicket);
});

// Ticket Reply Message
app.post('/api/tickets/:id/messages', (req, res) => {
  const { id } = req.params;
  const { text, senderRole, senderName, attachments } = req.body;
  if (!text || !senderRole || !senderName) {
    return res.status(400).json({ error: 'Message params missed' });
  }

  const db = readDB();
  const ticketIndex = db.tickets.findIndex((t: any) => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket profile missing' });
  }

  const newMessage = {
    id: `msg-${Date.now()}`,
    senderRole,
    senderName,
    text,
    timestamp: new Date().toISOString(),
    attachments: attachments || []
  };

  db.tickets[ticketIndex].messages.push(newMessage);
  db.tickets[ticketIndex].lastUpdated = new Date().toISOString();
  
  // If replied by user role, maybe mark active again
  if (senderRole === 'admin') {
    db.tickets[ticketIndex].status = 'in_progress';
  }

  writeDB(db);
  res.json(db.tickets[ticketIndex]);
});

// Ticket Status Update
app.patch('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status missed' });

  const db = readDB();
  const ticketIndex = db.tickets.findIndex((t: any) => t.id === id);
  if (ticketIndex === -1) return res.status(404).json({ error: 'Ticket missing' });

  db.tickets[ticketIndex].status = status;
  db.tickets[ticketIndex].lastUpdated = new Date().toISOString();
  writeDB(db);
  res.json(db.tickets[ticketIndex]);
});

// Projects Operations
app.get('/api/projects', (req, res) => {
  const company = req.query.company as string;
  const db = readDB();

  if (company && company !== 'Aegis Security Operations') {
    const filtered = db.projects.filter((p: any) => p.clientCompany.toLowerCase() === company.toLowerCase());
    return res.json(filtered);
  }

  res.json(db.projects);
});

app.post('/api/projects', (req, res) => {
  const { titleEn, titleKh, clientCompany, descriptionEn, descriptionKh, initialTasks } = req.body;
  if (!titleEn || !clientCompany) {
    return res.status(400).json({ error: 'Mandatory params missed' });
  }

  const db = readDB();
  const newProject = {
    id: `proj-${Date.now()}`,
    titleEn,
    titleKh: titleKh || titleEn,
    clientCompany,
    descriptionEn: descriptionEn || '',
    descriptionKh: descriptionKh || '',
    status: 'planning',
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tasks: initialTasks || [
      { id: 't1', nameEn: 'Infrastructure Assessment Outline', nameKh: 'រៀបចំគ្រោងការណ៍វាយតម្លៃសំណង់ IT', completed: false }
    ]
  };

  db.projects.push(newProject);
  writeDB(db);
  res.json(newProject);
});

// Project Tasks Reorder
app.put('/api/projects/:id/tasks/reorder', (req, res) => {
  const { id } = req.params;
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks array is required' });
  }

  const db = readDB();
  const projIdx = db.projects.findIndex((p: any) => p.id === id);
  if (projIdx === -1) return res.status(404).json({ error: 'Project not found' });

  // Update tasks order
  db.projects[projIdx].tasks = tasks;
  writeDB(db);
  res.json(db.projects[projIdx]);
});

// Project Task toggle & overall progress recalculate
app.patch('/api/projects/:id/tasks/:taskId', (req, res) => {
  const { id, taskId } = req.params;
  const { completed, note } = req.body;

  const db = readDB();
  const projIdx = db.projects.findIndex((p: any) => p.id === id);
  if (projIdx === -1) return res.status(404).json({ error: 'Project not found' });

  const taskIdx = db.projects[projIdx].tasks.findIndex((t: any) => t.id === taskId);
  if (taskIdx === -1) return res.status(404).json({ error: 'Task not found' });

  if (completed !== undefined) {
    db.projects[projIdx].tasks[taskIdx].completed = completed;
  }
  if (note !== undefined) {
    db.projects[projIdx].tasks[taskIdx].note = note;
  }

  // Recalculate percent progress
  const allTasks = db.projects[projIdx].tasks;
  const finished = allTasks.filter((t: any) => t.completed).length;
  db.projects[projIdx].progress = Math.round((finished / allTasks.length) * 100);

  if (db.projects[projIdx].progress === 100) {
    db.projects[projIdx].status = 'deployed';
  } else if (db.projects[projIdx].progress > 0) {
    db.projects[projIdx].status = 'active';
  }

  writeDB(db);
  res.json(db.projects[projIdx]);
});

// Invoices Actions
app.get('/api/invoices', (req, res) => {
  const company = req.query.company as string;
  const db = readDB();

  if (company && company !== 'Aegis Security Operations') {
    const filtered = db.invoices.filter((i: any) => i.clientCompany.toLowerCase() === company.toLowerCase());
    return res.json(filtered);
  }

  res.json(db.invoices);
});

app.post('/api/invoices', (req, res) => {
  const { clientCompany, titleEn, titleKh, amount, dueDate, billingPeriod } = req.body;
  if (!clientCompany || !titleEn || !amount) {
    return res.status(400).json({ error: 'Invalid invoice params' });
  }

  const db = readDB();
  const newInvoice = {
    id: `inv-${Date.now()}`,
    clientCompany,
    titleEn,
    titleKh: titleKh || titleEn,
    amount: parseFloat(amount),
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'unpaid',
    createdAt: new Date().toISOString().split('T')[0],
    billingPeriod: billingPeriod || 'Operational Cycle Service',
  };

  db.invoices.unshift(newInvoice);
  writeDB(db);
  res.json(newInvoice);
});

app.patch('/api/invoices/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const db = readDB();
  const idx = db.invoices.findIndex((inv: any) => inv.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });

  db.invoices[idx].status = status;
  writeDB(db);
  res.json(db.invoices[idx]);
});

// CRM Leads CRUD and capture
app.get('/api/crm/leads', (req, res) => {
  const db = readDB();
  res.json(db.crmLeads);
});

app.post('/api/crm/leads', (req, res) => {
  const { name, email, company, phone, message, riskScore } = req.body;
  if (!name || !email || !company) {
    return res.status(400).json({ error: 'Mandatory fields missed' });
  }

  const db = readDB();
  const newLead = {
    id: `lead-${Date.now()}`,
    name,
    email,
    company,
    phone: phone || '',
    status: 'lead',
    riskScore: riskScore !== undefined ? parseInt(riskScore) : 45,
    createdAt: new Date().toISOString(),
  };

  db.crmLeads.unshift(newLead);
  writeDB(db);
  res.json(newLead);
});

app.patch('/api/crm/leads/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const db = readDB();
  const idx = db.crmLeads.findIndex((l: any) => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });

  db.crmLeads[idx].status = status;
  writeDB(db);
  res.json(db.crmLeads[idx]);
});


// --- INTEGRATING VITE DEV MIDDLEWARE IN DEVELOPMENT ---
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  app.use(vite.middlewares);
  
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  
  console.log('Server loaded in DEVELOPMENT mode with Vite middleware.');
} else {
  // Production Serving Static Files
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
  
  console.log('Server loaded in PRODUCTION mode.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aegis Web Portal listening securely on port ${PORT}`);
});
