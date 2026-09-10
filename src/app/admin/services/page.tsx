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
  Sparkles,
  DollarSign
} from 'lucide-react';
import { store } from '@/lib/store';
import { Service, ServiceType } from '@/types';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>(store.services);
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
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

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
    setIsActive(true);
    setIsFeatured(false);
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingService) {
      // Update
      const updated = services.map((s) => {
        if (s.id === editingService.id) {
          return {
            ...s,
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
            is_active: isActive,
            is_featured: isFeatured,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });
      setServices(updated);
      store.services = updated;
      store.addAuditLog('SERVICE_UPDATED', 'SERVICES', `Service ${name} updated with Selar ID ${selarProductId}`);
      setEditingService(null);
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
        features: ['Comprehensive Guided Lessons', 'Reflection Inquiries', 'AI Assistant Support'],
        selar_product_id: selarProductId,
        selar_product_url: selarProductUrl,
        is_active: isActive,
        is_featured: isFeatured,
        created_at: new Date().toISOString()
      };
      setServices([...services, newSrv]);
      store.services.push(newSrv);
      store.addAuditLog('SERVICE_CREATED', 'SERVICES', `New service ${name} created with Selar ID ${selarProductId}`);
      setIsCreating(false);
    }
  };

  const toggleActive = (id: string) => {
    const updated = services.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s));
    setServices(updated);
    store.services = updated;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Services & Selar Product Mappings
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Configure coaching offerings, pricing in KES, and associate each service with its corresponding Selar product.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Table */}
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

                {/* Selar Product Mapping Section */}
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

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded text-rose-950"
                    />
                    <span>Featured on Homepage</span>
                  </label>
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
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
