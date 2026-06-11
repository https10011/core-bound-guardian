import { useEffect, useState } from 'react';
import { Camera, Edit3, Plus, Trash2, Heart, Sparkles, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Relationship, Album } from '../types';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import PhotoPicker from '../components/ui/PhotoPicker';
import { toDisplayUrl, subscribeImageCache } from '../lib/native';
import { useEffect as _useEffect } from 'react';

interface OurStoryProps {
  userId: string;
}

type SubTab = 'albums' | 'favorites' | 'lifestyle';

const FAVORITE_FIELDS = [
  { key: 'food', label: 'Favorite Food', placeholder: 'e.g. Sushi, pasta...' },
  { key: 'drink', label: 'Favorite Drink', placeholder: 'e.g. Matcha latte...' },
  { key: 'movie', label: 'Favorite Movie', placeholder: 'e.g. La La Land...' },
  { key: 'song', label: 'Favorite Song', placeholder: 'e.g. Perfect by Ed Sheeran...' },
  { key: 'color', label: 'Favorite Color', placeholder: 'e.g. Dusty rose...' },
  { key: 'place', label: 'Favorite Place', placeholder: 'e.g. Santorini, our café...' },
  { key: 'season', label: 'Favorite Season', placeholder: 'e.g. Autumn...' },
  { key: 'book', label: 'Favorite Book', placeholder: 'e.g. The Notebook...' },
];

const InputClass = 'w-full px-4 py-2.5 rounded-xl border border-pink-100 bg-white/70 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300/50 focus:border-pink-300 transition-all text-sm';

export default function OurStory({ userId }: OurStoryProps) {
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>('albums');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<Relationship>>({});
  const [albumForm, setAlbumForm] = useState({ name: '', owner: 'mine' as 'mine' | 'theirs', cover_url: '', photos: [] as string[] });
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [saving, setSaving] = useState(false);
  const [newHobby, setNewHobby] = useState('');
  const [, setImgTick] = useState(0);
  _useEffect(() => subscribeImageCache(() => setImgTick((t) => t + 1)), []);

  const loadData = async () => {
    const [relRes, albumRes] = await Promise.all([
      supabase.from('relationships').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('albums').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    ]);
    setRelationship(relRes.data);
    setAlbums(albumRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [userId]);

  const openEditProfile = () => {
    setProfileForm({
      name: relationship?.name ?? '',
      nickname: relationship?.nickname ?? '',
      birthday: relationship?.birthday ?? '',
      anniversary: relationship?.anniversary ?? '',
      avatar_url: relationship?.avatar_url ?? '',
      bio: relationship?.bio ?? '',
      lifestyle: relationship?.lifestyle ?? '',
      hobbies: relationship?.hobbies ?? [],
      favorites: relationship?.favorites ?? {},
      my_name: relationship?.my_name ?? '',
      my_avatar_url: relationship?.my_avatar_url ?? '',
    });
    setEditProfileOpen(true);
  };

  const saveProfile = async () => {
    if (!profileForm.name?.trim()) return;
    setSaving(true);
    const payload = { ...profileForm, user_id: userId, updated_at: new Date().toISOString() };
    if (relationship) {
      await supabase.from('relationships').update(payload).eq('id', relationship.id);
    } else {
      await supabase.from('relationships').insert(payload);
    }
    setSaving(false);
    setEditProfileOpen(false);
    loadData();
  };

  const addHobby = () => {
    if (!newHobby.trim()) return;
    setProfileForm(f => ({ ...f, hobbies: [...(f.hobbies ?? []), newHobby.trim()] }));
    setNewHobby('');
  };

  const removeHobby = (h: string) => {
    setProfileForm(f => ({ ...f, hobbies: (f.hobbies ?? []).filter(x => x !== h) }));
  };

  const openAlbumModal = (album?: Album) => {
    if (album) {
      setEditingAlbum(album);
      setAlbumForm({ name: album.name, owner: album.owner, cover_url: album.cover_url, photos: [...album.photos] });
    } else {
      setEditingAlbum(null);
      setAlbumForm({ name: '', owner: 'mine', cover_url: '', photos: [] });
    }
    setAlbumModalOpen(true);
  };

  const saveAlbum = async () => {
    if (!albumForm.name.trim()) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      name: albumForm.name,
      owner: albumForm.owner,
      cover_url: albumForm.cover_url,
      photos: albumForm.photos,
    };
    if (editingAlbum) {
      await supabase.from('albums').update(payload).eq('id', editingAlbum.id);
    } else {
      await supabase.from('albums').insert(payload);
    }
    setSaving(false);
    setAlbumModalOpen(false);
    loadData();
  };

  const deleteAlbum = async (id: string) => {
    await supabase.from('albums').delete().eq('id', id);
    loadData();
  };

  const daysTogether = relationship?.anniversary
    ? Math.floor((Date.now() - new Date(relationship.anniversary).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const myAlbums = albums.filter(a => a.owner === 'mine');
  const theirAlbums = albums.filter(a => a.owner === 'theirs');

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-pink-300 border-t-pink-500 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Our Story</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your love story, beautifully kept</p>
        </div>
        <Button onClick={openEditProfile} variant="outline">
          <Edit3 size={15} /> {relationship ? 'Edit Profile' : 'Set Up'}
        </Button>
      </div>

      {/* Partner Profile Card */}
      {relationship ? (
        <GlassCard className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Their avatar */}
            <div className="text-center">
              <div className="relative inline-block">
                {relationship.avatar_url ? (
                  <img src={toDisplayUrl(relationship.avatar_url)} alt={relationship.name} className="w-24 h-24 rounded-3xl object-cover border-2 border-white shadow-lg" loading="lazy" />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-4xl shadow-lg">
                    {relationship.name.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-md">
                  <Heart size={14} className="text-white fill-white" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Their photo</p>
            </div>

            {/* Heart */}
            <div className="hidden sm:flex items-center justify-center flex-shrink-0 self-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                <Heart size={18} className="text-pink-400 fill-pink-200" />
              </div>
            </div>

            {/* My avatar */}
            <div className="text-center">
              {relationship.my_avatar_url ? (
                <img src={toDisplayUrl(relationship.my_avatar_url)} alt={relationship.my_name} className="w-24 h-24 rounded-3xl object-cover border-2 border-white shadow-lg" loading="lazy" />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center text-4xl shadow-lg">
                  {relationship.my_name ? relationship.my_name.charAt(0) : 'Me'}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">My photo</p>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h2 className="text-2xl font-bold text-gray-800">{relationship.name}</h2>
                {relationship.nickname && (
                  <span className="text-sm text-pink-400 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                    "{relationship.nickname}"
                  </span>
                )}
              </div>
              {relationship.my_name && <p className="text-sm text-gray-500 mt-0.5">& {relationship.my_name}</p>}
              {relationship.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{relationship.bio}</p>}
              <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start">
                {daysTogether !== null && (
                  <div className="text-center">
                    <p className="text-xl font-bold text-pink-500">{daysTogether.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">days together</p>
                  </div>
                )}
                {relationship.birthday && (
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-700">{new Date(relationship.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs text-gray-400">birthday</p>
                  </div>
                )}
                {relationship.anniversary && (
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-700">{new Date(relationship.anniversary).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-400">anniversary</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-10 mb-6 text-center border-dashed border-pink-200">
          <Sparkles size={40} className="text-pink-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No profile set up yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your partner's details to get started</p>
          <Button onClick={openEditProfile} className="mt-4" size="sm">Set Up Profile</Button>
        </GlassCard>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 w-fit" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
        {(['albums', 'favorites', 'lifestyle'] as SubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${subTab === tab ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-pink-500'}`}
          >
            {tab === 'albums' ? 'Albums' : tab === 'favorites' ? 'Favorites' : 'Lifestyle'}
          </button>
        ))}
      </div>

      {/* Albums Tab */}
      {subTab === 'albums' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => openAlbumModal()} size="sm">
              <Plus size={15} /> New Album
            </Button>
          </div>
          {['mine', 'theirs'].map(owner => {
            const ownerAlbums = owner === 'mine' ? myAlbums : theirAlbums;
            const label = owner === 'mine' ? 'My Albums' : `${relationship?.name ? `${relationship.name}'s` : "Their"} Albums`;
            return (
              <div key={owner}>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera size={16} className="text-pink-400" /> {label}
                </h3>
                {ownerAlbums.length === 0 ? (
                  <GlassCard className="p-6 text-center">
                    <p className="text-gray-400 text-sm">No albums yet</p>
                  </GlassCard>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {ownerAlbums.map(album => (
                      <GlassCard key={album.id} className="overflow-hidden">
                        {album.cover_url ? (
                          <div className="h-36 overflow-hidden">
                            <img src={toDisplayUrl(album.cover_url)} alt={album.name} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        ) : (
                          <div className="h-36 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                            <Camera size={32} className="text-pink-300" />
                          </div>
                        )}
                        {album.photos.length > 0 && album.photos[0] !== album.cover_url && (
                          <div className="flex gap-1 p-2">
                            {album.photos.slice(0, 4).map((url, i) => (
                              <img key={i} src={toDisplayUrl(url)} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                            ))}
                            {album.photos.length > 4 && (
                              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center text-xs text-pink-400 font-medium">
                                +{album.photos.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="px-4 pb-3 pt-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800 text-sm">{album.name}</h4>
                              <p className="text-xs text-gray-400">{album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openAlbumModal(album)} className="p-1.5 hover:bg-pink-50 rounded-lg transition-colors">
                                <Edit3 size={13} className="text-gray-400" />
                              </button>
                              <button onClick={() => deleteAlbum(album.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={13} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Favorites Tab */}
      {subTab === 'favorites' && (
        <div>
          {!relationship ? (
            <GlassCard className="p-8 text-center"><p className="text-gray-400 text-sm">Set up a profile first</p></GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FAVORITE_FIELDS.map(({ key, label, placeholder }) => (
                <GlassCard key={key} className="p-4">
                  <p className="text-xs text-pink-400 font-medium mb-1">{label}</p>
                  <p className="text-gray-700 font-medium text-sm">
                    {relationship.favorites?.[key] || <span className="text-gray-300 italic">{placeholder}</span>}
                  </p>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lifestyle Tab */}
      {subTab === 'lifestyle' && (
        <div className="space-y-4">
          {!relationship ? (
            <GlassCard className="p-8 text-center"><p className="text-gray-400 text-sm">Set up a profile first</p></GlassCard>
          ) : (
            <>
              <GlassCard className="p-5">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><Sparkles size={15} className="text-pink-400" /> Lifestyle & Personality</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {relationship.lifestyle || <span className="text-gray-400 italic">No lifestyle info added yet. Edit profile to add details.</span>}
                </p>
              </GlassCard>
              <GlassCard className="p-5">
                <h3 className="font-semibold text-gray-700 mb-3">Hobbies & Interests</h3>
                {relationship.hobbies.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No hobbies added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {relationship.hobbies.map(hobby => (
                      <span key={hobby} className="px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 text-pink-600 font-medium">
                        {hobby}
                      </span>
                    ))}
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Edit Love Profile" size="xl">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Their Name *</label>
              <input value={profileForm.name ?? ''} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Your partner's name" className={InputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Nickname / Pet Name</label>
              <input value={profileForm.nickname ?? ''} onChange={e => setProfileForm(f => ({ ...f, nickname: e.target.value }))} placeholder="Babe, love, angel..." className={InputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Your Name</label>
              <input value={profileForm.my_name ?? ''} onChange={e => setProfileForm(f => ({ ...f, my_name: e.target.value }))} placeholder="Your name" className={InputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Anniversary Date</label>
              <input type="date" value={profileForm.anniversary ?? ''} onChange={e => setProfileForm(f => ({ ...f, anniversary: e.target.value }))} className={InputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Their Birthday</label>
              <input type="date" value={profileForm.birthday ?? ''} onChange={e => setProfileForm(f => ({ ...f, birthday: e.target.value }))} className={InputClass} />
            </div>
          <PhotoPicker
            label="Their Photo"
            multiple={false}
            values={profileForm.avatar_url ? [profileForm.avatar_url] : []}
            onChange={(next) => setProfileForm((f) => ({ ...f, avatar_url: next[0] ?? '' }))}
          />
          </div>
          <PhotoPicker
            label="My Photo"
            multiple={false}
            values={profileForm.my_avatar_url ? [profileForm.my_avatar_url] : []}
            onChange={(next) => setProfileForm((f) => ({ ...f, my_avatar_url: next[0] ?? '' }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Bio / About Them</label>
            <textarea value={profileForm.bio ?? ''} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} placeholder="A little about your partner..." rows={2} className={`${InputClass} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Lifestyle & Personality</label>
            <textarea value={profileForm.lifestyle ?? ''} onChange={e => setProfileForm(f => ({ ...f, lifestyle: e.target.value }))} placeholder="Their habits, routines, personality traits..." rows={3} className={`${InputClass} resize-none`} />
          </div>

          {/* Hobbies */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Hobbies & Interests</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(profileForm.hobbies ?? []).map(h => (
                <span key={h} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-pink-50 border border-pink-100 text-pink-600">
                  {h} <button onClick={() => removeHobby(h)}><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newHobby} onChange={e => setNewHobby(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHobby()} placeholder="Add a hobby..." className={`${InputClass} flex-1`} />
              <Button variant="outline" size="sm" onClick={addHobby}><Plus size={14} /></Button>
            </div>
          </div>

          {/* Favorites */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">Their Favorites</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FAVORITE_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    value={(profileForm.favorites as Record<string, string>)?.[key] ?? ''}
                    onChange={e => setProfileForm(f => ({ ...f, favorites: { ...(f.favorites as Record<string, string> ?? {}), [key]: e.target.value } }))}
                    placeholder={placeholder}
                    className={InputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={saving || !profileForm.name?.trim()}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Album Modal */}
      <Modal isOpen={albumModalOpen} onClose={() => setAlbumModalOpen(false)} title={editingAlbum ? 'Edit Album' : 'New Album'}>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Album Name</label>
            <input value={albumForm.name} onChange={e => setAlbumForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer 2024, Date Nights..." className={InputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Owner</label>
            <div className="flex gap-2">
              {(['mine', 'theirs'] as const).map(o => (
                <button
                  key={o}
                  onClick={() => setAlbumForm(f => ({ ...f, owner: o }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${albumForm.owner === o ? 'bg-pink-50 border-pink-300 text-pink-600' : 'bg-white/50 border-pink-100 text-gray-500'}`}
                >
                  {o === 'mine' ? 'My Photos' : `${relationship?.name ? `${relationship.name}'s` : "Their"} Photos`}
                </button>
              ))}
            </div>
          </div>
          <PhotoPicker
            label="Cover Photo"
            multiple={false}
            values={albumForm.cover_url ? [albumForm.cover_url] : []}
            onChange={(next) => setAlbumForm((f) => ({ ...f, cover_url: next[0] ?? '' }))}
          />
          <PhotoPicker
            label="Album Photos"
            values={albumForm.photos}
            onChange={(next) => setAlbumForm((f) => ({ ...f, photos: next }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAlbumModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAlbum} disabled={saving || !albumForm.name.trim()}>
              {saving ? 'Saving...' : editingAlbum ? 'Save' : 'Create Album'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
