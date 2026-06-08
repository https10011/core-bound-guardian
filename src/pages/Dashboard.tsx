import { useEffect, useState } from 'react';
import { Heart, BookImage, StickyNote, Sparkles, MapPin, Calendar, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Memory, Note, Relationship } from '../types';
import { Page } from '../types';
import GlassCard from '../components/ui/GlassCard';

interface DashboardProps {
  userId: string;
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ userId, onNavigate }: DashboardProps) {
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [relRes, memRes, noteRes] = await Promise.all([
        supabase.from('relationships').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('memories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('notes').select('*').eq('user_id', userId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
      ]);
      setRelationship(relRes.data);
      setMemories(memRes.data ?? []);
      setNotes(noteRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const getDaysTogether = () => {
    if (!relationship?.anniversary) return null;
    return Math.floor((Date.now() - new Date(relationship.anniversary).getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysTogether = getDaysTogether();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const moodEmoji: Record<string, string> = {
    happy: '😊', romantic: '💕', adventurous: '🌟', cozy: '☕', nostalgic: '🌸', excited: '✨', grateful: '🙏',
  };

  const noteColors: Record<string, string> = {
    pink: 'border-pink-300 bg-pink-50/60',
    rose: 'border-rose-300 bg-rose-50/60',
    purple: 'border-purple-300 bg-purple-50/60',
    blue: 'border-blue-300 bg-blue-50/60',
    green: 'border-green-300 bg-green-50/60',
    yellow: 'border-yellow-300 bg-yellow-50/60',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Heart size={28} className="text-pink-400 fill-pink-200 animate-heartbeat" />
        <p className="text-sm text-pink-400 font-bold animate-pulse">Loading your memories...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Hero Header with floating hearts */}
      <div className="relative mb-8 overflow-visible">
        {/* Decorative floating hearts */}
        <div className="absolute -top-2 right-0 pointer-events-none select-none">
          <span className="absolute right-2 top-0 text-2xl text-pink-300/50 animate-float" style={{ animationDelay: '0s' }}>♥</span>
          <span className="absolute right-12 top-3 text-sm text-rose-300/40 animate-float" style={{ animationDelay: '0.9s' }}>♥</span>
          <span className="absolute right-6 top-8 text-xs text-pink-200/60 animate-float" style={{ animationDelay: '1.6s' }}>✦</span>
          <span className="absolute right-20 top-1 text-lg text-pink-200/40 animate-floatSlow" style={{ animationDelay: '0.4s' }}>✿</span>
          <span className="absolute right-28 top-6 text-sm text-rose-200/35 animate-float" style={{ animationDelay: '2.1s' }}>♥</span>
        </div>

        <p className="text-sm text-pink-400 font-bold mb-1 animate-slideUp">{greeting} ✨</p>
        <h1 className="text-3xl font-black text-gray-800 animate-slideUp delay-75">
          {relationship?.my_name ? relationship.my_name : 'Welcome to Memora'}
        </h1>
        {relationship?.name && (
          <p className="text-gray-500 mt-1 text-sm font-semibold animate-slideUp delay-100">
            Your love story with <span className="text-pink-500">{relationship.name}</span> 💕
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {daysTogether !== null && (
          <GlassCard className="p-5 col-span-2" delay={0}>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 animate-pulsePink"
                style={{ background: 'linear-gradient(135deg, #f472b6, #fb7185)' }}
              >
                <Heart size={24} className="text-white fill-white animate-heartbeat" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-800">{daysTogether.toLocaleString()}</p>
                <p className="text-sm text-gray-500 font-semibold">days together 🌸</p>
                {relationship?.anniversary && (
                  <p className="text-xs text-pink-400 mt-0.5 font-bold">
                    Since {new Date(relationship.anniversary).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-5 flex flex-col items-center justify-center text-center" hover onClick={() => onNavigate('vault')} delay={80}>
          <BookImage size={24} className="text-pink-400 mb-2 animate-sparkle" />
          <p className="text-2xl font-black text-gray-800">{memories.length > 0 ? memories.length : '—'}</p>
          <p className="text-xs text-gray-500 font-bold">Memories</p>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col items-center justify-center text-center" hover onClick={() => onNavigate('notes')} delay={140}>
          <StickyNote size={24} className="text-rose-400 mb-2 animate-sparkle" style={{ animationDelay: '0.8s' }} />
          <p className="text-2xl font-black text-gray-800">{notes.length > 0 ? notes.length : '—'}</p>
          <p className="text-xs text-gray-500 font-bold">Notes</p>
        </GlassCard>
      </div>

      {/* Partner teaser */}
      {relationship ? (
        <GlassCard className="p-5 mb-8" hover onClick={() => onNavigate('ourstory')} delay={160}>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {relationship.avatar_url ? (
                <img src={relationship.avatar_url} alt={relationship.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-lg" />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #fbcfe8, #fda4af)' }}>
                  {relationship.name.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl flex items-center justify-center shadow-md animate-heartbeat"
                style={{ background: 'linear-gradient(135deg, #f472b6, #fb7185)' }}>
                <Heart size={11} className="text-white fill-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-gray-800">{relationship.name}</h3>
                {relationship.nickname && (
                  <span className="text-xs text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100 font-bold">"{relationship.nickname}"</span>
                )}
              </div>
              {relationship.bio && <p className="text-sm text-gray-500 mt-0.5 truncate font-medium">{relationship.bio}</p>}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 font-semibold">
                {relationship.birthday && (
                  <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(relationship.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                )}
                {relationship.hobbies.length > 0 && (
                  <span className="flex items-center gap-1"><Sparkles size={11} className="animate-twinkle" /> {relationship.hobbies.slice(0, 2).join(', ')}</span>
                )}
              </div>
            </div>
            <span className="text-pink-300 flex-shrink-0 font-bold text-lg">→</span>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 mb-8 text-center" hover onClick={() => onNavigate('ourstory')} delay={160}>
          <Sparkles size={32} className="text-pink-300 mx-auto mb-3 animate-sparkle" />
          <p className="font-black text-gray-600">Set up your love story 💕</p>
          <p className="text-sm text-gray-400 mt-1 font-medium">Add your partner's profile to get started</p>
        </GlassCard>
      )}

      {/* Recent Memories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-700 flex items-center gap-2">
            <BookImage size={17} className="text-pink-400" />
            Recent Memories
          </h2>
          <button onClick={() => onNavigate('vault')} className="text-xs text-pink-500 hover:text-pink-600 font-black transition-colors">View all →</button>
        </div>

        {memories.length === 0 ? (
          <GlassCard className="p-6 text-center" delay={200}>
            <p className="text-gray-400 text-sm font-semibold">No memories yet. Start capturing your moments! 📸</p>
            <button onClick={() => onNavigate('vault')} className="mt-3 text-sm text-pink-500 hover:text-pink-600 font-black transition-colors">Add your first memory →</button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {memories.map((memory, i) => (
              <GlassCard key={memory.id} hover className="overflow-hidden" onClick={() => onNavigate('vault')} delay={200 + i * 70}>
                {memory.photos[0] && (
                  <div className="h-36 overflow-hidden relative">
                    <img src={memory.photos[0]} alt={memory.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                {!memory.photos[0] && (
                  <div className="h-20 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(251,207,232,0.5), rgba(253,164,175,0.4))' }}>
                    <Heart size={24} className="text-pink-300 fill-pink-200" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-gray-800 text-sm leading-tight">{memory.title}</h3>
                    {memory.mood && <span className="text-base flex-shrink-0">{moodEmoji[memory.mood] ?? '💭'}</span>}
                  </div>
                  {memory.location && <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1 font-semibold"><MapPin size={10} /> {memory.location}</p>}
                  {memory.memory_date && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 font-semibold"><Calendar size={10} /> {new Date(memory.memory_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                  {memory.is_favorite && <Star size={12} className="text-yellow-400 fill-yellow-400 mt-2 animate-sparkle" />}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-700 flex items-center gap-2">
            <StickyNote size={17} className="text-rose-400" />
            Recent Notes
          </h2>
          <button onClick={() => onNavigate('notes')} className="text-xs text-pink-500 hover:text-pink-600 font-black transition-colors">View all →</button>
        </div>

        {notes.length === 0 ? (
          <GlassCard className="p-6 text-center" delay={300}>
            <p className="text-gray-400 text-sm font-semibold">No notes yet. Write something sweet! 🌸</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {notes.map((note, i) => (
              <GlassCard key={note.id} hover onClick={() => onNavigate('notes')} className={`p-4 border-l-4 ${noteColors[note.color] ?? noteColors.pink}`} delay={320 + i * 60}>
                <div className="flex items-center gap-2 mb-2">
                  {note.is_pinned && <span className="text-xs text-pink-400 animate-sway inline-block">📌</span>}
                  <h3 className="font-black text-gray-800 text-sm truncate">{note.title}</h3>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 font-medium">{note.content}</p>
                <p className="text-[10px] text-gray-400 mt-2 font-bold capitalize">{note.category}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
