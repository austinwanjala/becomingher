'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Save,
  X,
  Sun,
  DollarSign,
  Mail,
  Send,
  Loader2,
  FileDown
} from 'lucide-react';
import { store } from '@/lib/store';
import { Service, ServiceType, ServiceResource } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { getServices, saveService } from '@/lib/services';
import { useEffect } from 'react';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<ServiceType>('DIGITAL_PROGRAMME');
  const [price, setPrice] = useState(1000);
  const [currency, setCurrency] = useState('KES');
  const [duration, setDuration] = useState('4 Weeks');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [selarProductId, setSelarProductId] = useState('v09683c927');
  const [selarProductUrl, setSelarProductUrl] = useState('https://selar.com/v09683c927');
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [resources, setResources] = useState<ServiceResource[]>([]);
  const [questionnaireTemplateUrl, setQuestionnaireTemplateUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Quick test email state
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      const data = await getServices();
      setServices(data);
      setIsLoading(false);
    }
    fetchServices();
  }, []);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      setPdfUrl(publicUrlData.publicUrl);
      setPdfName(file.name);
      if (!pdfTitle) setPdfTitle(file.name.replace(/\.[^/.]+$/, ""));
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuestionnaireUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `questionnaires/${fileName}`;

      const { error } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      setQuestionnaireTemplateUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload questionnaire');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const newResources: ServiceResource[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        newResources.push({
          id: `res-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
          file_size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          file_type: fileExt?.toUpperCase() || 'FILE'
        });
      }

      setResources(prev => [...prev, ...newResources]);
    } catch (err: any) {
      console.error('Resource upload failed:', err);
      setUploadError(err.message || 'Failed to upload resources');
    } finally {
      setIsUploading(false);
    }
  };

  const startEdit = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setSlug(srv.slug);
    setType(srv.type);
    setPrice(srv.price);
    setCurrency(srv.currency);
    setDuration(srv.duration);
    setShortDesc(srv.short_description);
    setDescription(srv.description);
    setSelarProductId(srv.selar_product_id || 'v09683c927');
    setSelarProductUrl(srv.selar_product_url || 'https://selar.com/v09683c927');
    setPdfTitle(srv.pdf_title || '');
    setPdfName(srv.pdf_name || '');
    setPdfUrl(srv.pdf_url || '');
    setResources(srv.resources || []);
    setQuestionnaireTemplateUrl(srv.questionnaire_template_url || '');
    setIsActive(srv.is_active);
    setIsFeatured(srv.is_featured);
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditingService(null);
    setName('');
    setSlug('new-service');
    setType('DIGITAL_PROGRAMME');
    setPrice(1000);
    setCurrency('KES');
    setDuration('4 Modules');
    setShortDesc('Transformative personal development offering.');
    setDescription('Comprehensive digital coaching journey.');
    setSelarProductId('v09683c927');
    setSelarProductUrl('https://selar.com/v09683c927');
    setPdfTitle('');
    setPdfName('');
    setPdfUrl('');
    setResources([]);
    setQuestionnaireTemplateUrl('');
    setIsActive(true);
    setIsFeatured(false);
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true); // Re-use isUploading as a general saving state

    if (editingService) {
      // Update
      const srvToUpdate: Service = {
        ...editingService,
        name,
        slug,
        type,
        price,
        currency,
        duration,
        short_description: shortDesc,
        description,
        selar_product_id: selarProductId,
        selar_product_url: selarProductUrl,
        pdf_title: pdfTitle,
        pdf_name: pdfName,
        pdf_url: pdfUrl,
        resources: resources,
        questionnaire_template_url: questionnaireTemplateUrl,
        is_active: isActive,
        is_featured: isFeatured,
        updated_at: new Date().toISOString()
      };

      const saved = await saveService(srvToUpdate);
      if (saved) {
        setServices(services.map((s) => s.id === saved.id ? saved : s));
        store.addAuditLog('SERVICE_UPDATED', 'SERVICES', `Service ${name} updated with PDF fulfillment ${pdfName || 'materials'}`);
        setEditingService(null);
      }
    } else if (isCreating) {
      // Create new
      const newSrv: Service = {
        id: `srv-${Date.now()}`,
        name,
        slug,
        type,
        price,
        currency,
        duration,
        short_description: shortDesc,
        description,
        image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
        features: ['Comprehensive Guided Lessons', 'Reflection Inquiries', 'Companion Support'],
        selar_product_id: selarProductId,
        selar_product_url: selarProductUrl,
        pdf_title: pdfTitle,
        pdf_name: pdfName,
        pdf_url: pdfUrl,
        resources: resources,
        questionnaire_template_url: questionnaireTemplateUrl,
        is_active: isActive,
        is_featured: isFeatured,
        created_at: new Date().toISOString()
      };
      
      const saved = await saveService(newSrv);
      if (saved) {
        setServices([...services, saved]);
        store.addAuditLog('SERVICE_CREATED', 'SERVICES', `New service ${name} created with Selar ID ${selarProductId}`);
        setIsCreating(false);
      }
    }
    
    setIsUploading(false);
  };

  const toggleActive = async (id: string) => {
    const srv = services.find(s => s.id === id);
    if (!srv) return;
    
    const updated = { ...srv, is_active: !srv.is_active };
    const saved = await saveService(updated);
    
    if (saved) {
      setServices(services.map((s) => (s.id === id ? saved : s)));
    }
  };

  const handleSendTestPdfEmail = async (srv: Service) => {
    const recipient = testEmailRecipient.trim() || prompt('Enter recipient email address for test PDF dispatch:', 'austinwanjala@gmail.com');
    if (!recipient) return;

    setIsTestingEmail(true);
    setTestEmailStatus(null);

    try {
      const res = await fetch('/api/admin/send-service-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: recipient,
          customerName: 'Valued Client',
          serviceId: srv.id,
          serviceTitle: srv.name,
          pdfUrl: srv.pdf_url,
          pdfName: srv.pdf_name,
          pdfTitle: srv.pdf_title
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailStatus(`✓ Sent: ${data.message}`);
      } else {
        setTestEmailStatus(`✗ Error: ${data.error || 'Dispatch failed'}`);
      }
    } catch (err: any) {
      setTestEmailStatus(`✗ Error: ${err.message}`);
    } finally {
      setIsTestingEmail(false);
      setTimeout(() => setTestEmailStatus(null), 8000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Services & Selar Product Mappings
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Configure coaching offerings, pricing in KES, attached PDF fulfillment materials, and associate each service with its Selar product.
          </p>
        </div>

        {isLoading && <Loader2 className="w-6 h-6 animate-spin text-stone-400" />}

        <button
          onClick={startCreate}
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Automated PDF Email Delivery Info Card */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-amber-50 rounded-3xl border border-amber-200/20 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-white">
                Automated Customer PDF Materials Delivery
              </h3>
              <p className="text-xs text-stone-300">
                When an order is verified or paid via Selar, Becoming Her automatically sends the service PDF & workbook directly to the customer's email.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-300">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
            <span className="font-semibold text-amber-200 block">Required Environment Variables:</span>
            <div className="font-mono text-[11px] text-amber-100/90 space-y-0.5">
              <div>RESEND_API_KEY=re_your_api_key</div>
              <div>EMAIL_FROM=Becoming Her &lt;onboarding@resend.dev&gt;</div>
            </div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-2">
            <span className="font-semibold text-amber-200 block">Quick Email Test Dispatcher:</span>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-stone-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
              />
              <button
                type="button"
                onClick={() => services[0] && handleSendTestPdfEmail(services[0])}
                disabled={isTestingEmail}
                className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-white text-stone-900 font-semibold text-xs transition flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {isTestingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Test Send</span>
              </button>
            </div>
            {testEmailStatus && (
              <p className="text-[11px] text-amber-300 font-medium">
                {testEmailStatus}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Services Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center text-stone-500">
          Loading services...
        </div>
      ) : services.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-stone-500">No services found. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-stone-900">Service Offerings</h3>
            <span className="text-xs text-stone-500 font-medium">{services.length} Services Active</span>
          </div>

          <div className="divide-y divide-stone-100">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-stone-50/50 transition"
              >
                <div className="flex gap-4 items-start">
                  <img
                    src={srv.image_url}
                    alt={srv.name}
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-base font-semibold text-stone-900">{srv.name}</h4>
                      {srv.is_featured && (
                        <span className="text-[10px] uppercase font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-1">{srv.short_description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                      <span>Type: <code className="bg-stone-100 px-1.5 py-0.5 rounded font-mono text-stone-800">{srv.type}</code></span>
                      <span>Duration: <strong>{srv.duration}</strong></span>
                      <span>
                        Selar Product ID: <code className="font-mono text-rose-900 font-semibold">{srv.selar_product_id || 'v09683c927'}</code>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Pricing</span>
                    <span className="font-serif text-lg font-bold text-stone-900">
                      {srv.currency} {srv.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(srv.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        srv.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {srv.is_active ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      onClick={() => startEdit(srv)}
                      className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200"
                      title="Edit Service & Selar Mapping"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {(editingService || isCreating) && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                {isCreating ? 'Create New Service' : `Edit: ${editingService?.name}`}
              </h3>
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsCreating(false);
                }}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-medium text-stone-700">Service Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                {type !== 'DIGITAL_PRODUCT' && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-stone-700">Service Slug (URL)</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-medium text-stone-700">Service Access Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ServiceType)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="DIGITAL_PROGRAMME">DIGITAL_PROGRAMME</option>
                    <option value="CUSTOM_COACHING">CUSTOM_COACHING</option>
                    <option value="INTERPERSONAL_SESSION">INTERPERSONAL_SESSION</option>
                    <option value="DIGITAL_PRODUCT">DIGITAL_PRODUCT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-stone-700">Price</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-stone-700">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                {type !== 'DIGITAL_PRODUCT' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-medium text-stone-700">Duration / Schedule Description</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      placeholder="e.g. 4 Modules (Self-Paced) or 60 Minutes Live Video"
                    />
                  </div>
                )}

                {/* Selar Product Mapping Section */}
                {type !== 'DIGITAL_PRODUCT' && (
                  <div className="sm:col-span-2 p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-3">
                    <h4 className="font-serif font-semibold text-rose-950 text-sm">
                      Selar E-Commerce Product Configuration
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-medium text-stone-700">Selar Product ID</label>
                        <input
                          type="text"
                          value={selarProductId}
                          onChange={(e) => setSelarProductId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-white"
                          placeholder="e.g. v09683c927"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-stone-700">Selar Product Checkout URL</label>
                        <input
                          type="url"
                          value={selarProductUrl}
                          onChange={(e) => setSelarProductUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-white"
                          placeholder="https://selar.com/v09683c927"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Service PDF Materials & Email Fulfillment Section */}
                <div className="sm:col-span-2 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/90 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-amber-800" />
                    <h4 className="font-serif font-semibold text-stone-900 text-sm">
                      Customer PDF Fulfillment (Sent to Customer Email on Purchase)
                    </h4>
                  </div>
                  <p className="text-xs text-stone-600">
                    Specify the workbook, guidebook, or companion PDF file that should be automatically delivered to the customer's email upon payment.
                  </p>
                  
                  {type === 'DIGITAL_PRODUCT' && (
                    <div className="p-4 border border-amber-200 bg-white rounded-xl space-y-3">
                      <label className="font-medium text-stone-700 text-xs block">Upload Product File (PDF)</label>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                      />
                      {isUploading && <p className="text-amber-600 flex items-center gap-2 text-xs mt-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading to secure storage...</p>}
                      {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-stone-700 text-xs">PDF Material Title</label>
                      <input
                        type="text"
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                        placeholder="e.g. Becoming Her Companion Workbook"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-stone-700 text-xs">PDF Filename</label>
                      <input
                        type="text"
                        value={pdfName}
                        onChange={(e) => setPdfName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-white"
                        placeholder="becoming-her-companion-workbook.pdf"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-medium text-stone-700 text-xs">PDF Download URL or Relative Path</label>
                      <input
                        type="text"
                        value={pdfUrl}
                        onChange={(e) => setPdfUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-white"
                        placeholder="/materials/becoming-her-companion-workbook.pdf or https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Resources / Attachments Section */}
                <div className="sm:col-span-2 p-4 bg-stone-50/70 rounded-2xl border border-stone-200/90 space-y-4 mt-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-600" />
                    <h4 className="font-serif font-semibold text-stone-900 text-sm">
                      Additional Resources & Attachments
                    </h4>
                  </div>
                  <p className="text-xs text-stone-600">
                    Upload supplementary files (worksheets, audio guides, templates) that apply to the whole Service. These will be included in the fulfillment email.
                  </p>

                  <div className="p-4 border border-stone-200 bg-white rounded-xl space-y-3">
                    <label className="font-medium text-stone-700 text-xs block">Upload Resources</label>
                    <input 
                      type="file" 
                      multiple
                      onChange={handleResourceUpload}
                      disabled={isUploading}
                      className="text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 cursor-pointer"
                    />
                  </div>

                  {resources.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {resources.map((res, index) => (
                        <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-stone-200 rounded-xl gap-3">
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={res.title}
                              onChange={(e) => {
                                const newRes = [...resources];
                                newRes[index].title = e.target.value;
                                setResources(newRes);
                              }}
                              className="w-full px-2 py-1 text-xs font-semibold text-stone-900 border-b border-transparent hover:border-stone-200 focus:border-stone-400 focus:outline-none bg-transparent"
                              placeholder="Resource Title"
                            />
                            <div className="px-2 text-[10px] text-stone-500 font-mono">
                              {res.file_name} • {res.file_size}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newRes = [...resources];
                              newRes.splice(index, 1);
                              setResources(newRes);
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded self-end sm:self-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Questionnaire Upload for Custom Coaching */}
                {type === 'CUSTOM_COACHING' && (
                  <div className="sm:col-span-2 p-4 bg-blue-50/70 rounded-2xl border border-blue-200/90 space-y-4 mt-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h4 className="font-serif font-semibold text-stone-900 text-sm">
                        Pre-Consultation Questionnaire
                      </h4>
                    </div>
                    <p className="text-xs text-stone-600">
                      Upload the Word document (.docx) questionnaire that customers must fill out and upload during this customized programme.
                    </p>

                    <div className="p-4 border border-blue-200 bg-white rounded-xl space-y-3">
                      <label className="font-medium text-stone-700 text-xs block">Upload Questionnaire Template</label>
                      <input 
                        type="file" 
                        accept=".doc,.docx,.pdf"
                        onChange={handleQuestionnaireUpload}
                        disabled={isUploading}
                        className="text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                      />
                      {isUploading && <p className="text-blue-600 flex items-center gap-2 text-xs mt-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
                      
                      <div className="space-y-1 mt-3">
                        <label className="font-medium text-stone-700 text-xs">Questionnaire Download URL</label>
                        <input
                          type="text"
                          value={questionnaireTemplateUrl}
                          onChange={(e) => setQuestionnaireTemplateUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs bg-white"
                          placeholder="Uploaded URL will appear here"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {type !== 'DIGITAL_PRODUCT' && (
                  <>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-medium text-stone-700">Short Summary</label>
                      <textarea
                        rows={2}
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-medium text-stone-700">Full Description</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-rose-950"
                    />
                    <span>Service is Published & Active</span>
                  </label>

                  {type !== 'DIGITAL_PRODUCT' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded text-rose-950"
                      />
                      <span>Featured on Homepage</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
