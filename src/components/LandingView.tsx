import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, Terminal, Server, Key, 
  ChevronRight, PhoneCall, Building2, Send, Laptop, Sparkles, CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { BlogPost } from '../types';

interface LandingViewProps {
  language: 'en' | 'kh';
  t: (key: string) => string;
  onNavigateToPortal: () => void;
  blogPosts: BlogPost[];
}

export default function LandingView({ language, t, onNavigateToPortal, blogPosts }: LandingViewProps) {
  // Risk Calculator State
  const [employees, setEmployees] = useState(15);
  const [industry, setIndustry] = useState('critical'); // e.g., 'critical' (finance/gov), 'tech', 'commercial'
  const [controls, setControls] = useState({
    mfa: false,
    backups: false,
    firewall: false,
    training: false,
  });
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  
  // Contact Form / Sales CRM State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Auto-run core risk audit score
  useEffect(() => {
    calculateRisk();
  }, [employees, industry, controls]);

  const calculateRisk = () => {
    let baseScore = 40;
    
    // Employee multiplier
    if (employees > 100) baseScore += 25;
    else if (employees > 50) baseScore += 15;
    else if (employees > 10) baseScore += 8;

    // Industry vulnerability
    if (industry === 'critical') baseScore += 30; // finance/health/gov
    else if (industry === 'tech') baseScore += 15;
    else baseScore += 5;

    // Reduction via current safety controls
    let reduction = 0;
    if (controls.mfa) reduction += 20;
    if (controls.backups) reduction += 15;
    if (controls.firewall) reduction += 20;
    if (controls.training) reduction += 15;

    const finalScore = Math.max(5, baseScore - reduction);
    setCalculatedScore(finalScore);
  };

  const getRiskStatus = (score: number) => {
    if (score < 30) return { label: language === 'en' ? 'LOW EXPOSURE' : 'សុវត្ថិភាពល្អ', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score < 60) return { label: language === 'en' ? 'MEDIUM RANGE' : 'ហានិភ័យមធ្យម', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: language === 'en' ? 'CRITICAL EXPOSURE' : 'គ្រោះថ្នាក់ខ្ពស់', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse' };
  };

  const currentRisk = calculatedScore !== null ? getRiskStatus(calculatedScore) : null;

  const handleRegisterLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactCompany) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          company: contactCompany,
          phone: contactPhone,
          message: contactMsg,
          riskScore: calculatedScore || 50,
        }),
      });
      if (response.ok) {
        setSubmitSuccess(true);
        setContactName('');
        setContactEmail('');
        setContactCompany('');
        setContactPhone('');
        setContactMsg('');
        setTimeout(() => setSubmitSuccess(false), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-24 pb-16 font-sans">
      {/* SECTION 1: HERO CONTAINER */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950/20 opacity-100 z-0"></div>
        
        {/* Abstract cyber backdrop elements */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl z-0 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-slate-800/10 rounded-full blur-2xl z-0"></div>

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Cyber SOC Badge banner */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs text-emerald-400 font-mono tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {t('hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {t('hero.title')}
            </h1>

            <p className="text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <a 
                href="#risk-calculator"
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/10 text-white font-medium rounded-xl transition-all cursor-pointer shadow-lg inline-flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                {t('hero.cta.start')}
              </a>
              <button
                onClick={onNavigateToPortal}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-100 rounded-xl transition-all font-medium cursor-pointer flex items-center gap-1.5"
              >
                {t('hero.cta.portal')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-8 border-t border-slate-800/50 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> AES-256 ENCRYPTED</span>
              <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-emerald-500" /> 24/7 DYNAMIC MONITORING</span>
              <span className="flex items-center gap-1"><Laptop className="w-4 h-4 text-emerald-500" /> ISO 27001 FRAMEWORK</span>
            </div>
          </div>

          {/* Quick Stat Card Deck / visual representation */}
          <div className="lg:col-span-5 relative">
            <div className="p-1 bg-gradient-to-tr from-slate-700/50 via-slate-800/20 to-emerald-500/30 rounded-2xl">
              <div className="bg-slate-900/95 p-6 rounded-[14px] border border-slate-800 text-left space-y-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Aegis Security Operations Terminal</span>
                  <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Global Status Live</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 font-mono mb-1">
                      <span>ASEAN Cyber Defense Grid</span>
                      <span className="text-emerald-400 font-bold">100% SECURE</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">Zero-Days Mitigated</span>
                      <span className="text-xl font-bold text-white font-mono mt-1 block">41,291</span>
                    </div>
                    <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">Response SLA</span>
                      <span className="text-xl font-bold text-white font-mono mt-1 block">&lt; 12 Secs</span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1 font-bold text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" /> Direct SecOps Dispatch
                    </div>
                    <p className="text-slate-300 leading-normal text-[11px]">
                      Aegis Defence provides real-time security telemetry to high-compliance banks, telecom terminals, and critical logistic hubs inside the Kingdom of Cambodia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SERVICES bento array */}
      <section className="max-w-7xl mx-auto px-6" id="services-bento">
        <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{t('services.title')}</h2>
          <p className="text-sm text-slate-400">{t('services.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { key: 'soc', icon: Server, code: 'SOC-902' },
            { key: 'pentest', icon: Key, code: 'ADV-400' },
            { key: 'audit', icon: ShieldCheck, code: 'CMP-202' },
            { key: 'it', icon: Laptop, code: 'OPS-109' }
          ].map((srv, idx) => {
            const IconComponent = srv.icon;
            return (
              <div 
                key={srv.key}
                className="p-6 bg-slate-900 border border-slate-800/80 hover:border-emerald-500/30 rounded-2xl text-left space-y-4 hover:bg-slate-800/20 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-emerald-400 group-hover:text-emerald-300 group-hover:bg-emerald-500/10 transition-colors">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[9px] text-slate-500 tracking-widest">{srv.code}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {t(`service.${srv.key}.title`)}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t(`service.${srv.key}.desc`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE EXPONSURE CALCULATOR WIDGET */}
      <section className="max-w-5xl mx-auto px-6 pt-12" id="risk-calculator">
        <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 text-left shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl z-0 pointer-events-none"></div>

          {/* Controls Panel */}
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-emerald-400" />
                {t('calc.title')}
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                {t('calc.desc')}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Employee Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{t('calc.employees')}</span>
                  <span className="text-emerald-400 font-bold">{employees} Staff Members</span>
                </div>
                <input 
                  type="range"
                  min="2"
                  max="500"
                  value={employees}
                  onChange={(e) => setEmployees(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Sector Selection */}
              <div className="space-y-2">
                <span className="text-xs text-slate-300 block font-mono">{t('calc.industry')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'critical', en: 'Critical Inf', kh: 'ហេដ្ឋារចនា' },
                    { val: 'tech', en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
                    { val: 'commercial', en: 'Commercial', kh: 'ពាណិជ្ជកម្ម' },
                  ].map((ind) => (
                    <button
                      key={ind.val}
                      type="button"
                      onClick={() => setIndustry(ind.val)}
                      className={`py-2 px-3 text-[11px] rounded-xl border font-medium cursor-pointer transition-all ${
                        industry === ind.val
                          ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/80 hover:text-slate-200'
                      }`}
                    >
                      {language === 'en' ? ind.en : ind.kh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi controls checks */}
              <div className="space-y-2 pt-2">
                <span className="text-xs text-slate-300 block font-mono">{t('calc.securityControls')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'mfa', label: t('calc.mfa') },
                    { key: 'backups', label: t('calc.backups') },
                    { key: 'firewall', label: t('calc.firewall') },
                    { key: 'training', label: t('calc.training') },
                  ].map((ctrl) => (
                    <label 
                      key={ctrl.key} 
                      className="flex items-start gap-2.5 p-3.5 bg-slate-800/30 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer select-none transition-all text-xs"
                    >
                      <input 
                        type="checkbox"
                        checked={controls[ctrl.key as keyof typeof controls]}
                        onChange={(e) => setControls(prev => ({ ...prev, [ctrl.key]: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900 focus:ring-2"
                      />
                      <span className="text-slate-300 leading-normal font-sans text-[11px]">{ctrl.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Output Display Panel */}
          <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between text-left shadow-inner z-10">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">{t('calc.result.score')}</span>
              
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold text-white font-mono">{calculatedScore}</span>
                <span className="text-sm font-mono text-slate-500">/ 100</span>
              </div>

              {currentRisk && (
                <div className={`px-3 py-1.5 text-[10px] font-bold border rounded-lg inline-block tracking-wider ${currentRisk.color}`}>
                  {currentRisk.label}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">{t('calc.result.advice')}</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {calculatedScore && calculatedScore > 65 
                    ? (language === 'en' 
                        ? "CRITICAL: Urgent perimeter defenses needed. High vulnerable profile. Immediate Aegis pentest advised."
                        : "គ្រោះថ្នាក់ខ្ពស់៖ ចាំបាច់ត្រូវពង្រឹងប្រព័ន្ធការពារជាបន្ទាន់។ គួរធ្វើតេស្តសាកល្បង PenTest ភ្លាមៗ។")
                    : calculatedScore && calculatedScore > 35
                    ? (language === 'en'
                        ? "STABLE SEC: Moderate risks detected. Implementation of Next-Gen Firewalls and full staff awareness is essential."
                        : "មធ្យម៖ មានហានិភ័យល្មមៗ។ គួរដំឡើង Firewall ការពារបន្ថែម និងបណ្តុះបណ្តាលបុគ្គលិក។")
                    : (language === 'en'
                        ? "DEEPLY PROTECTED: Strong infrastructure baseline. Maintain compliance checklists and quarterly security audits."
                        : "សុវត្ថិភាពល្អ៖ ប្រព័ន្ធការពារមានមូលដ្ឋានរឹងមាំល្អ។ គួរអនុវត្តសវនកម្មបន្ថែមរៀងរាល់ត្រីមាស។")
                  }
                </p>
              </div>
            </div>

            <div className="pt-4">
              <a 
                href="#lead-capture-form"
                onClick={() => {
                  setContactMsg(language === 'en' 
                    ? `Requesting deep security audit. Risk Assessment Score was calculated at: ${calculatedScore}/100.`
                    : `ស្នើសុំការពិនិត្យសវនកម្មសន្តិសុខ។ ពិន្ទុហានិភ័យដែលគណនាឃើញគឺ៖ ${calculatedScore}/១០០។`
                  );
                }}
                className="w-full text-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer block"
              >
                {t('calc.contactUs')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THREAT ADVISORIES / RESEARCH BLOG */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{t('blog.title')}</h2>
          <p className="text-sm text-slate-400">{t('blog.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {blogPosts.map((post) => (
            <article 
              key={post.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-700/60 transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
                  <span className={`px-2 py-0.5 rounded uppercase ${
                    post.isAdvisory 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {language === 'en' ? post.categoryEn : post.categoryKh}
                  </span>
                  <span className="text-slate-500">{post.date}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white leading-snug hover:text-emerald-400 transition-colors line-clamp-2">
                    {language === 'en' ? post.titleEn : post.titleKh}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {language === 'en' ? post.contentEn : post.contentKh}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">By {language === 'en' ? post.authorEn : post.authorKh}</span>
                <span className="text-slate-500 font-mono text-[10px]">{post.readTime}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 5: CONTACT & SALES CAPTURE CRM FORM */}
      <section className="max-w-4xl mx-auto px-6 pt-8" id="lead-capture-form">
        <div className="grid grid-cols-1 md:grid-cols-12 bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl text-left">
          
          <div className="md:col-span-4 bg-slate-950 p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Direct Threat Line</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect directly with Aegis duty supervisors in Phnom Penh. Zero delay, professional security deployment.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-900/60 font-mono text-[11px] text-slate-400">
              <span className="block text-emerald-400 font-bold uppercase tracking-wider">OFFICE_LOCATIVE</span>
              <span className="block">{t('footer.addr')}</span>
              <span className="block text-emerald-400 font-bold mt-1 uppercase tracking-wider">SEC_TEL</span>
              <span className="block text-white font-semibold">{t('footer.phone')}</span>
            </div>
          </div>

          <div className="md:col-span-8 p-8 space-y-6 bg-slate-900">
            <h4 className="text-xl font-bold text-white">Initiate Corporate Protection</h4>
            
            {submitSuccess ? (
              <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
                <h5 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> Incident Registre Activated
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Thank you. Your request is registered into our Secure CRM Pipeline system. Our SOC Supervisor will analyze your corporate exposure risk profile and initialize audit protocols within 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterLead} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-mono text-[10px] uppercase tracking-wider">Enterprise Corp Contact *</label>
                    <input 
                      type="text" 
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Jane Doe" 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-mono text-[10px] uppercase tracking-wider">Corporate Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="ceo@enterprise.com" 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-mono text-[10px] uppercase tracking-wider">Company / Entity Name *</label>
                    <input 
                      type="text" 
                      required
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      placeholder="Acme Micro" 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-mono text-[10px] uppercase tracking-wider">Helpline Direct Contact (Optional)</label>
                    <input 
                      type="text" 
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+855 12 345 678" 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-mono text-[10px] uppercase tracking-wider">Strategic Protection Requirements / Target Message</label>
                  <textarea 
                    rows={3}
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Brief details of your request or systems context..." 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-3 text-xs text-white outline-none resize-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/5 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Deploy Cyber Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
