import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { toApiUrl } from '../services/urls';

const EVENT_CATEGORIES = [
  'TECHNOLOGY',
  'SOCIAL',
  'SPORTS',
  'MUSIC',
  'EDUCATION',
  'BUSINESS',
  'HEALTH',
  'ART',
  'OTHER',
];

const CATEGORY_COLORS = {
  TECHNOLOGY: '#1040C0',
  SOCIAL: '#D02020',
  SPORTS: '#16A34A',
  MUSIC: '#9333EA',
  EDUCATION: '#F0C020',
  BUSINESS: '#0D3399',
  HEALTH: '#059669',
  ART: '#E11D48',
  OTHER: '#6B7280',
};

function toLocalDatetimeString(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildInitialFormState(sourceEvent) {
  return {
    title: sourceEvent?.title || '',
    description: sourceEvent?.description || '',
    location: sourceEvent?.location || '',
    startDate: toLocalDatetimeString(sourceEvent?.startDate),
    endDate: toLocalDatetimeString(sourceEvent?.endDate),
    capacity: sourceEvent?.capacity || 100,
    category: sourceEvent?.category || '',
    tags: Array.isArray(sourceEvent?.tags) ? sourceEvent.tags.join(', ') : '',
  };
}

function hasFormChanges(currentForm, initialForm) {
  return Object.keys(initialForm).some((key) => currentForm[key] !== initialForm[key]);
}

export default function EventFormModal({ event, onSubmit, onClose }) {
  const isEdit = !!event;
  const fileInputRef = useRef(null);
  const initialFormRef = useRef(buildInitialFormState(event));
  const initialBannerPreviewRef = useRef(event?.bannerUrl ? toApiUrl(event.bannerUrl) : null);
  const submitSucceededRef = useRef(false);
  const [form, setForm] = useState(() => buildInitialFormState(event));
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(() => (event?.bannerUrl ? toApiUrl(event.bannerUrl) : null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const nextInitialForm = buildInitialFormState(event);
    const nextInitialBannerPreview = event?.bannerUrl ? toApiUrl(event.bannerUrl) : null;

    initialFormRef.current = nextInitialForm;
    initialBannerPreviewRef.current = nextInitialBannerPreview;
    submitSucceededRef.current = false;

    setForm(nextInitialForm);
    setBannerFile(null);
    setBannerPreview(nextInitialBannerPreview);
    setError(null);
  }, [event]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  const isDirty = useMemo(() => {
    const formDirty = hasFormChanges(form, initialFormRef.current);
    const initialBannerPreview = initialBannerPreviewRef.current;
    const bannerDirty =
      !!bannerFile ||
      (initialBannerPreview && !bannerPreview) ||
      (!initialBannerPreview && !!bannerPreview) ||
      (!!initialBannerPreview && !!bannerPreview && initialBannerPreview !== bannerPreview);

    return formDirty || bannerDirty;
  }, [form, bannerFile, bannerPreview]);

  const handleRequestClose = () => {
    if (saving) return;

    if (submitSucceededRef.current || !isDirty) {
      onClose();
      return;
    }

    const shouldDiscard = window.confirm('You have unsaved changes. Discard them and close this form?');
    if (shouldDiscard) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    submitSucceededRef.current = false;
    setForm((prev) => ({ ...prev, [name]: name === 'capacity' ? Number(value) : value }));
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    submitSucceededRef.current = false;
    if (file.size > 5 * 1024 * 1024) {
      setError('Banner image must be under 5 MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, GIF, or WebP images are allowed');
      return;
    }
    setBannerFile(file);
    if (bannerPreview && bannerPreview.startsWith('blob:')) {
      URL.revokeObjectURL(bannerPreview);
    }
    setBannerPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    submitSucceededRef.current = false;
    setError(null);
    setSaving(true);
    try {
      const tagsArray = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const payload = {
        ...form,
        tags: tagsArray,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      await onSubmit(payload, bannerFile);
      submitSucceededRef.current = true;
    } catch (err) {
      submitSucceededRef.current = false;
      setError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleRequestClose}>
      <div
        className="bg-bauhaus-bg border border-[#1F2937]/30 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent */}
        <div className="flex h-0.75">
          <div className="flex-1 bg-bauhaus-red" />
          <div className="flex-1 bg-bauhaus-yellow" />
          <div className="flex-1 bg-bauhaus-blue" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1F2937]/15">
          <h2 className="text-lg font-black text-bauhaus-fg uppercase tracking-tight">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center text-bauhaus-fg/50 hover:text-bauhaus-fg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3">
              <p className="text-sm text-bauhaus-red">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={255}
              placeholder="Event title"
              className="w-full px-3 h-10 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={5000}
              rows={3}
              placeholder="Event description"
              className="w-full px-3 py-2.5 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue transition-colors resize-none font-[Outfit]"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              maxLength={255}
              placeholder="Event location"
              className="w-full px-3 h-10 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue transition-colors"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
                Start Date *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full px-3 h-10 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg focus:border-bauhaus-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
                End Date *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full px-3 h-10 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg focus:border-bauhaus-blue transition-colors"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
              Capacity *
            </label>
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              required
              min={1}
              max={100000}
              className="w-full px-3 h-10 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg focus:border-bauhaus-blue transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 h-10 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg focus:border-bauhaus-blue transition-colors appearance-none cursor-pointer"
            >
              <option value="">— No category —</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              maxLength={500}
              placeholder="e.g. workshop, ai, beginner"
              className="w-full px-3 h-10 bg-bauhaus-white/80 border border-[#D1D5DB] text-sm text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-bauhaus-blue transition-colors"
            />
            <p className="text-[10px] text-bauhaus-fg/30 mt-1">Separate tags with commas</p>
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-[11px] font-bold text-bauhaus-fg/50 uppercase tracking-[0.15em] mb-1.5">
              Banner Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleBannerSelect}
              className="hidden"
            />
            {bannerPreview ? (
              <div className="relative border border-[#D1D5DB] overflow-hidden">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    submitSucceededRef.current = false;
                    setBannerFile(null);
                    if (bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
                    setBannerPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1.5 right-1.5 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black/80 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-[#D1D5DB] flex flex-col items-center justify-center gap-1.5 text-[#9CA3AF] hover:border-bauhaus-blue hover:text-bauhaus-blue transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Upload Banner</span>
                <span className="text-[9px]">JPEG, PNG, GIF, WebP · Max 5 MB</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-bauhaus-fg/60 uppercase tracking-wider hover:text-bauhaus-fg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-bauhaus-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
