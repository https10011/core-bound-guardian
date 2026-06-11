import { useEffect, useState } from 'react';
import { Plus, Search, Star, MapPin, Calendar, Tag, Trash2, X, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Memory } from '../types';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import PhotoPicker from '../components/ui/PhotoPicker';
import { toDisplayUrl, subscribeImageCache } from '../lib/native';

interface MemoryVaultProps {
  userId: string;
}

const MOODS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🌟' },
  { value: 'cozy', label: 'Cozy', emoji: '☕' },
  { value: 'nostalgic', label: 'Nostalgic', emoji: '🌸' },
  { value: 'excited', label: 'Excited', emoji: '✨' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
];

const moodMap: Record<string, string> = Object.fromEntries(MOODS.map(m => [m.value, m.emoji]));

const emptyForm = {
  title: '', description: '', memory_date: '', location: '', mood: '',
  photos: [] as string[], tags: '', is_favorite: false,
};

export default function MemoryVault({ userId }: MemoryVaultProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFav, setFilterFav] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewMemory, setViewMemory] = useState<Memory | null>(null);
  const [, setImgTick] = useState(0);
  useEffect(() => subscribeImageCache(() => setImgTick((t) => t + 1)), []);

  const load = async () => {
    const { data } = await supabase.from('memories').select('*').eq('user_id', userId).order('memory_date', { ascending: false });
    setMemories(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (m: Memory) => {
    setEditing(m);
    setForm({
      title: m.title, description: m.description, memory_date: m.memory_date ?? '',
      location: m.location, mood: m.mood,
      photos: [...m.photos], tags: m.tags.join(', '), is_favorite: m.is_favorite,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      title: form.title,
      description: form.description,
      memory_date: form.memory_date || null,
      location: form.location,
      mood: form.mood,
      photos: form.photos,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      is_favorite: form.is_favorite,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('memories').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('memories').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('memories').delete().eq('id', id);
    setViewMemory(null);
    load();
  };

  const toggleFavorite = async (m: Memory) => {
    await supabase.from('memories').update({ is_favorite: !m.is_favorite }).eq('id', m.id);
    load();
  };

  const filtered = memories.filter(m => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchFav = !filterFav || m.is_favorite;
    return matchSearch && matchFav;
  });

  const InputClass = 'w-full px-4 py-2.5 rounded-xl border border-pink-100 bg-white/70 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300/50 focus:border-pink-300 transition-all text-sm';

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Memory Vault</h1>
          <p className="text-sm text-gray-500 mt-0.5">{memories.length} precious moment{memories.length !== 1 ? 's' : ''} captured</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Memory
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memories or tags..."
            className={`${InputClass} pl-9`}
          />
        </div>
        <button
          onClick={() => setFilterFav(!filterFav)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${filterFav ? 'bg-yellow-50 border-yellow-300 text-yellow-600' : 'bg-white/50 border-pink-100 text-gray-500 hover:border-pink-200'}`}
        >
          <Star size={14} className={filterFav ? 'fill-yellow-400 text-yellow-400' : ''} /> Favorites
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Heart size={40} className="text-pink-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{search || filterFav ? 'No matching memories' : 'Start building your memory vault'}</p>
          <p className="text-sm text-gray-400 mt-1">Every moment with them is worth saving</p>
          {!search && !filterFav && <Button onClick={openAdd} className="mt-4" size="sm">Add your first memory</Button>}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(memory => (
            <GlassCard key={memory.id} hover className="overflow-hidden flex flex-col" onClick={() => setViewMemory(memory)}>
              {memory.photos[0] ? (
                <div className="h-44 overflow-hidden relative">
                  <img src={toDisplayUrl(memory.photos[0])} alt={memory.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  {memory.mood && (
                    <span className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center text-base shadow">
                      {moodMap[memory.mood]}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-24 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                  <Heart size={28} className="text-pink-300" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">{memory.title}</h3>
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(memory); }}
                    className="flex-shrink-0 p-1"
                  >
                    <Star size={14} className={memory.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  </button>
                </div>
                {memory.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{memory.description}</p>}
                <div className="mt-auto pt-3 space-y-1">
                  {memory.location && (
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {memory.location}</p>
                  )}
                  {memory.memory_date && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(memory.memory_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                {memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {memory.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-500 border border-pink-100">
                        {tag}
                      </span>
                    ))}
                    {memory.tags.length > 3 && <span className="text-[10px] text-gray-400">+{memory.tags.length - 3}</span>}
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Memory' : 'New Memory'} size="lg">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Our special moment..." className={InputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell the story..." rows={3} className={`${InputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Date</label>
              <input type="date" value={form.memory_date} onChange={e => setForm(f => ({ ...f, memory_date: e.target.value }))} className={InputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Where were you?" className={InputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setForm(f => ({ ...f, mood: f.mood === m.value ? '' : m.value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.mood === m.value ? 'bg-pink-100 border-pink-300 text-pink-600' : 'bg-white/50 border-pink-100 text-gray-500 hover:border-pink-200'}`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
          <PhotoPicker
            label="Photos"
            values={form.photos}
            onChange={(next) => setForm((f) => ({ ...f, photos: next }))}
            multiple
          />
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tags</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="date night, first time, travel..." className={InputClass} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_favorite} onChange={e => setForm(f => ({ ...f, is_favorite: e.target.checked }))} className="rounded border-pink-300 text-pink-400 focus:ring-pink-300" />
            <span className="text-sm text-gray-600 flex items-center gap-1"><Star size={13} className="text-yellow-400" /> Mark as favorite</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Memory'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {viewMemory && (
        <Modal isOpen={!!viewMemory} onClose={() => setViewMemory(null)} title={viewMemory.title} size="lg">
          <div className="p-6">
            {viewMemory.photos.length > 0 && (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {viewMemory.photos.map((url, i) => (
                  <img key={i} src={toDisplayUrl(url)} alt="" className="h-48 w-auto rounded-xl object-cover flex-shrink-0 shadow-sm" loading="lazy" />
                ))}
              </div>
            )}
            {viewMemory.description && <p className="text-gray-600 text-sm leading-relaxed mb-4">{viewMemory.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              {viewMemory.mood && <span>{moodMap[viewMemory.mood]} {viewMemory.mood}</span>}
              {viewMemory.location && <span className="flex items-center gap-1"><MapPin size={13} />{viewMemory.location}</span>}
              {viewMemory.memory_date && <span className="flex items-center gap-1"><Calendar size={13} />{new Date(viewMemory.memory_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
            </div>
            {viewMemory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {viewMemory.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-pink-50 text-pink-500 border border-pink-100 flex items-center gap-1">
                    <Tag size={10} />{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-pink-100/60">
              <Button variant="danger" size="sm" onClick={() => handleDelete(viewMemory.id)}>
                <Trash2 size={14} /> Delete
              </Button>
              <Button size="sm" onClick={() => { setViewMemory(null); openEdit(viewMemory); }}>
                Edit Memory
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
