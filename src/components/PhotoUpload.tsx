'use client';

import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PhotoUploadProps {
  teamId: string;
  onPhotoUploaded: (url: string) => void;
}

export default function PhotoUpload({ teamId, onPhotoUploaded }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setOriginalSizeKb(Math.round(file.size / 1024));

    try {
      setIsCompressing(true);

      const options = {
        maxSizeMB: 0.38, // Compress to < 400KB
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.8,
      };

      const compressed = await imageCompression(file, options);
      setSelectedFile(compressed);
      setCompressedSizeKb(Math.round(compressed.size / 1024));

      const objectUrl = URL.createObjectURL(compressed);
      setPreviewUrl(objectUrl);
    } catch (err: unknown) {
      console.error('Compression error:', err);
      // Fallback to original file
      setSelectedFile(file);
      setCompressedSizeKb(Math.round(file.size / 1024));
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `team_${teamId}_${Date.now()}.${fileExt}`;
      const filePath = `teams/${fileName}`;

      let publicUrl = '';

      // Try uploading to Supabase Storage bucket 'team-photos'
      const { error: storageError } = await supabase.storage
        .from('team-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!storageError) {
        const { data: publicUrlData } = supabase.storage
          .from('team-photos')
          .getPublicUrl(filePath);
        publicUrl = publicUrlData.publicUrl;
      } else {
        console.warn('Supabase storage upload fallback to base64 data:', storageError.message);
        // Robust Fallback: convert compressed file to base64 data URI
        const reader = new FileReader();
        publicUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      // Update team record in database
      const { error: dbError } = await supabase
        .from('teams')
        .update({
          initial_photo_url: publicUrl,
          status: 'photo_pending',
        })
        .eq('id', teamId);

      if (dbError) {
        throw new Error(dbError.message);
      }

      onPhotoUploaded(publicUrl);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Upload failed:', error);
      setErrorMessage(error.message || 'Зураг илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-slate-950/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-950/80 group"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-100 text-center">
            Зураг авах эсвэл сонгох
          </h3>
          <p className="text-xs text-slate-400 text-center mt-2 max-w-xs">
            Орцны өмнө багийн бүх гишүүд багтсан зураг оруулна уу.
          </p>
          <div className="mt-4 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            Автоматаар &lt;400KB шахагдана
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Багийн зураг"
              className="w-full h-full object-cover"
            />
            {isCompressing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
                <span className="text-sm font-medium">Зургийг шахаж байна...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs bg-slate-950/80 px-4 py-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">
              Хэмжээ: <strong className="text-slate-200">{originalSizeKb} KB</strong> →{' '}
              <strong className="text-emerald-400">{compressedSizeKb} KB</strong>
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Бэлэн
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <RefreshCw className="w-4 h-4" /> Дахин авах
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || isCompressing}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Илгээж байна...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Баталгаажуулахаар илгээх
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
