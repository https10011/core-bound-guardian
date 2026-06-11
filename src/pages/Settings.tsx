import { useEffect, useState } from 'react';
import { LogOut, Download, Upload, User, Heart, Shield, Info, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Relationship } from '../types';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { exportJson, pickJsonFile } from '../lib/native';

interface SettingsProps {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
}

export default function Settings({ userId, userEmail, onSignOut }: SettingsProps) {
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [relRes, memRes, noteRes] = await Promise.all([
        supabase.from('relationships').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('memories').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', userId),
      ]);
      setRelationship(relRes.data);
      setMemoriesCount(memRes.count ?? 0);
      setNotesCount(noteRes.count ?? 0);
    };
    load();
  }, [userId]);

  const handleExport = async () => {
    setExporting(true);
    const [relRes, memRes, noteRes, albumRes] = await Promise.all([
      supabase.from('relationships').select('*').eq('user_id', userId),
      supabase.from('memories').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('albums').select('*').eq('user_id', userId),
    ]);
    const data = {
      exported_at: new Date().toISOString(),
      relationship: relRes.data,
      memories: memRes.data,
      notes: noteRes.data,
      albums: albumRes.data,
    };
    await exportJson(`memora-export-${new Date().toISOString().split('T')[0]}.json`, data);
    setExporting(false);
  };

  const handleImport = async () => {
    setImportMsg(null);
    const text = await pickJsonFile();
    if (!text) return;
    setImporting(true);
    try {
      const data = JSON.parse(text);
      let imported = 0;
      const insertAll = async (table: string, rows: any[] | undefined | null) => {
        if (!Array.isArray(rows)) return;
        for (const row of rows) {
          const { id: _id, ...rest } = row;
          await supabase.from(table).insert({ ...rest, user_id: userId });
          imported++;
        }
      };
      await insertAll('memories', data.memories);
      await insertAll('notes', data.notes);
      await insertAll('albums', data.albums);
      setImportMsg(`Imported ${imported} item${imported !== 1 ? 's' : ''} successfully ✨`);
    } catch (e: any) {
      setImportMsg(`Import failed: ${e?.message ?? 'invalid file'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await onSignOut();
  };

  const daysTogether = relationship?.anniversary
    ? Math.floor((Date.now() - new Date(relationship.anniversary).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your Memora</p>
      </div>

      {/* Profile */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</h2>
       <GlassCard className="overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center shadow-md">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">{userEmail}</p>
              <p className="text-xs text-gray-400">Memora account</p>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Relationship Summary */}
      {relationship && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Love Story</h2>
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              {relationship.avatar_url ? (
                <img src={(typeof toDisplayUrl !== 'undefined' ? toDisplayUrl(relationship.avatar_url) : relationship.avatar_url)} alt={relationship.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow" loading="lazy" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-xl shadow">
                  {relationship.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{relationship.name}</p>
                {relationship.nickname && <p className="text-xs text-pink-400">"{relationship.nickname}"</p>}
              </div>
              <div className="ml-auto">
                <Heart size={20} className="text-pink-300 fill-pink-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {daysTogether !== null && (
                <div className="text-center p-3 rounded-xl bg-pink-50/60 border border-pink-100/60">
                  <p className="text-xl font-bold text-pink-500">{daysTogether.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">days together</p>
                </div>
              )}
              <div className="text-center p-3 rounded-xl bg-rose-50/60 border border-rose-100/60">
                <p className="text-xl font-bold text-rose-500">{memoriesCount}</p>
                <p className="text-xs text-gray-500">memories</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-50/60 border border-purple-100/60">
                <p className="text-xl font-bold text-purple-500">{notesCount}</p>
                <p className="text-xs text-gray-500">notes</p>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Data */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Data</h2>
        <GlassCard className="overflow-hidden divide-y divide-pink-50/80">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-4 hover:bg-pink-50/40 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-700 text-sm">Export My Data</p>
              <p className="text-xs text-gray-400">Download all memories, notes, and profiles</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full flex items-center gap-3 p-4 hover:bg-pink-50/40 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center flex-shrink-0">
              <Upload size={16} className="text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-700 text-sm">Import Backup</p>
              <p className="text-xs text-gray-400">Restore memories &amp; notes from a JSON export</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        </GlassCard>
        {exporting && (
          <p className="text-xs text-pink-400 mt-2 pl-2 animate-pulse">Preparing your export...</p>
        )}
        {importing && (
          <p className="text-xs text-rose-400 mt-2 pl-2 animate-pulse">Importing your backup...</p>
        )}
        {importMsg && (
          <p className="text-xs text-gray-500 mt-2 pl-2">{importMsg}</p>
        )}
      </section>

      {/* Privacy */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Privacy</h2>
        <GlassCard className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={16} className="text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-gray-700 text-sm">Your data is private</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                All your memories and notes are secured with row-level security. Only you can access your data.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* About */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h2>
        <GlassCard className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
              <Info size={16} className="text-pink-500" />
            </div>
            <div>
              <p className="font-medium text-gray-700 text-sm">Memora</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                A beautiful space to preserve your most precious memories and love story. Built with love.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Sign Out */}
      <div className="pt-2">
        <Button
          variant="danger"
          className="w-full"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOut size={16} />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>

      <div className="text-center mt-8">
        <p className="text-xs text-gray-300">Made with love, just for you</p>
        <div className="flex justify-center mt-1">
          <Heart size={12} className="text-pink-300 fill-pink-200" />
        </div>
      </div>
    </div>
  );
}
