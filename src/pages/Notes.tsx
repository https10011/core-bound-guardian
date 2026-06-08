import { useEffect, useState } from 'react';
import { Plus, Search, Pin, Trash2, Edit3, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Note } from '../types';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

interface NotesProps {
  userId: string;
}

type Category = 'all' | 'personal' | 'relationship' | 'shared';

const NOTE_COLORS = [
  { value: 'pink', label: 'Pink', bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-600', dot: 'bg-pink-400' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-600', dot: 'bg-rose-400' },
  { value: 'purple', label: 'Lavender', bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600', dot: 'bg-purple-400' },
  { value: 'blue', label: 'Sky', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600', dot: 'bg-blue-400' },
  { value: 'green', label: 'Mint', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  { value: 'yellow', label: 'Honey', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600', dot: 'bg-yellow-400' },
];

const colorMap = Object.fromEntries(NOTE_COLORS.map(c => [c.value, c]));

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'personal', label: 'Personal' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'shared', label: 'Shared' },
];

const catBadge: Record<string, string> = {
  personal: 'bg-pink-50 text-pink-500',
  relationship: 'bg-rose-50 text-rose-500',
  shared: 'bg-purple-50 text-purple-500',
};

const emptyForm = { title: '', content: '', category: 'personal' as Note['category'], color: 'pink', is_pinned: false };

const InputClass = 'w-full px-4 py-2.5 rounded-xl border border-pink-100 bg-white/70 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300/50 focus:border-pink-300 transition-all text-sm';

export default function Notes({ userId }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (note: Note) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content, category: note.category, color: note.color, is_pinned: note.is_pinned });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { user_id: userId, ...form, updated_at: new Date().toISOString() };
    if (editing) {
      await supabase.from('notes').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('notes').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    load();
  };

  const togglePin = async (note: Note) => {
    await supabase.from('notes').update({ is_pinned: !note.is_pinned, updated_at: new Date().toISOString() }).eq('id', note.id);
    load();
  };

  const filtered = notes.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || n.category === category;
    return matchSearch && matchCat;
  });

  const pinned = filtered.filter(n => n.is_pinned);
  const unpinned = filtered.filter(n => !n.is_pinned);

  const NoteCard = ({ note }: { note: Note }) => {
    const c = colorMap[note.color] ?? colorMap.pink;
    return (
      <GlassCard
        hover
        className={`p-4 border-l-4 ${c.border} ${c.bg}/50 relative group`}
        onClick={() => openEdit(note)}
      >
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); togglePin(note); }}
            className={`p-1.5 rounded-lg hover:bg-white/80 transition-colors ${note.is_pinned ? 'text-pink-400' : 'text-gray-400'}`}
          >
            <Pin size={12} className={note.is_pinned ? 'fill-pink-300' : ''} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="pr-14">
          <h3 className={`font-semibold text-sm text-gray-800 mb-1.5`}>{note.title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-4 whitespace-pre-wrap">{note.content}</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/50">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catBadge[note.category]}`}>
            {note.category}
          </span>
          <span className="text-[10px] text-gray-400">
            {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> New Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className={`${InputClass} pl-9`} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === cat.value ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-pink-500'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Heart size={40} className="text-pink-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{search || category !== 'all' ? 'No matching notes' : 'No notes yet'}</p>
          <p className="text-sm text-gray-400 mt-1">Jot down thoughts, memories, and sweet nothings</p>
          {!search && category === 'all' && <Button onClick={openAdd} className="mt-4" size="sm">Write your first note</Button>}
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pin size={11} /> Pinned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">All Notes</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinned.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Note' : 'New Note'}>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title..." className={InputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Content</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write something..." rows={6} className={`${InputClass} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Category</label>
            <div className="flex gap-2">
              {(['personal', 'relationship', 'shared'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${form.category === cat ? 'bg-pink-50 border-pink-300 text-pink-600' : 'bg-white/50 border-pink-100 text-gray-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.color === c.value ? `${c.bg} ${c.border} ${c.text}` : 'bg-white/50 border-pink-100 text-gray-500'}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} /> {c.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="rounded border-pink-300 text-pink-400 focus:ring-pink-300" />
            <span className="text-sm text-gray-600 flex items-center gap-1"><Pin size={13} className="text-pink-400" /> Pin this note</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Note'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
