import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

function toLocalDatetimeString(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventFormModal({ event, onSubmit, onClose }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        startDate: toLocalDatetimeString(event.startDate),
        endDate: toLocalDatetimeString(event.endDate),
        capacity: event.capacity || 100,
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'capacity' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Convert local datetime strings to ISO format
      const payload = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
            onClick={onClose}
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
