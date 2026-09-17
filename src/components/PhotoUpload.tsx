'use client';

import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, RefreshCw, Compass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { soundFX } from '@/lib/soundEffects';

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

    soundFX.playButtonTap();
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

      let compressed: File;
      try {
        compressed = await imageCompression(file, options);
      } catch {
        compressed = await imageCompression(file, { ...options, useWebWorker: false });
      }

      setSelectedFile(compressed);
      setCompressedSizeKb(Math.round(compressed.size / 1024));

      const objectUrl = URL.createObjectURL(compressed);
      setPreviewUrl(objectUrl);
      soundFX.playCoin();
    } catch (err: unknown) {
      console.error('Compression error:', err);
      setSelectedFile(file);
      setCompressedSizeKb(Math.round(file.size / 1024));
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    soundFX.playButtonTap();
    setIsUploading(true);
    setErrorMessage(null);

    try {
      let publicUrl = '';

      // Try uploading to Supabase Storage bucket 'team-photos'
      try {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const fileName = `team_${teamId}_${Date.now()}.${fileExt}`;
        const filePath = `teams/${fileName}`;

        const uploadPromise = supabase.storage
          .from('team-photos')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true,
          });

        const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Storage timeout')), 2500)
        );

        const { error: storageError } = (await Promise.race([
          uploadPromise,
          timeoutPromise,
        ])) as { error: Error | null };

        if (!storageError) {
          const { data: publicUrlData } = supabase.storage
            .from('team-photos')
            .getPublicUrl(filePath);
          publicUrl = publicUrlData.publicUrl;
        }
      } catch (e) {
        console.warn('Supabase storage upload fallback to dataURI:', e);
      }

      // If storage upload didn't succeed, use base64 data URI fallback
      if (!publicUrl) {
        const reader = new FileReader();
        publicUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      // Update team record
      await dataService.updateTeam(teamId, {
        initial_photo_url: publicUrl,
        status: 'photo_pending',
      });

      soundFX.playChestOpen();
      onPhotoUploaded(publicUrl);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Upload failed:', error);
      soundFX.playWrong();
      setErrorMessage(error.message || 'Зураг илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full pirate-panel-wood rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="pirate-corner-rivet top-2 left-2" />
      <div className="pirate-corner-rivet top-2 right-2" />
      <div className="pirate-corner-rivet bottom-2 left-2" />
      <div className="pirate-corner-rivet bottom-2 right-2" />

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
          onClick={() => {
            soundFX.playButtonTap();
            fileInputRef.current?.click();
          }}
          className="border-3 border-dashed border-[#b45309] hover:border-amber-400 bg-[#140b06]/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#1f1108] group"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 p-0.5 shadow-xl group-hover:scale-105 transition-transform mb-4">
            <div className="w-full h-full bg-[#271409] rounded-[14px] flex items-center justify-center text-amber-300">
              <Camera className="w-10 h-10" />
            </div>
          </div>
          <h3 className="text-base font-black text-amber-200 text-center font-medieval">
            Багийн зураг авах эсвэл сонгох
          </h3>
          <p className="text-xs text-amber-200/70 text-center mt-2 max-w-xs font-sans">
            Эхлэхийн өмнө бүх гишүүд багтсан багийн зургаа дарж оруулна уу.
          </p>
          <div className="mt-4 px-3 py-1.5 rounded-full bg-[#2b1708] border border-[#854d0e] text-[11px] text-amber-300 font-bold flex items-center gap-1.5 font-cinzel">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Автоматаар шахагдана (&lt;400KB)
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black border-3 border-[#734c26] shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Багийн зураг"
              className="w-full h-full object-cover"
            />
            {isCompressing && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-amber-300">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
                <span className="text-xs font-bold font-sans">Зургийг шахаж байна...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs bg-[#190e07] px-4 py-2.5 rounded-xl border border-[#5c371c]">
            <span className="text-amber-200/70 font-sans">
              Хэмжээ: <strong className="text-amber-100">{originalSizeKb} KB</strong> →{' '}
              <strong className="text-emerald-400">{compressedSizeKb} KB</strong>
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1 font-cinzel">
              <CheckCircle2 className="w-4 h-4" /> БЭЛЭН
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border-2 border-red-700 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="font-sans">{errorMessage}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                soundFX.playButtonTap();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="flex-1 py-3.5 px-4 rounded-xl btn-pirate-wood text-xs font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Дахин авах
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || isCompressing}
              className="flex-1 py-3.5 px-4 rounded-xl btn-pirate-gold text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Илгээж байна...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Илгээх
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
