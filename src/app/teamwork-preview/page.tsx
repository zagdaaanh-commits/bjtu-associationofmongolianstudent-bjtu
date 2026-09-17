'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';

export default function TeamworkPreviewPage() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0d0704] text-amber-100 flex flex-col items-center p-4">
      {/* Navigation Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between py-3 mb-2 border-b border-[#3d2413]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-pirate-wood text-xs font-bold text-amber-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Тоглоом руу буцах</span>
        </Link>
        <span className="text-xs font-cinzel text-amber-400 font-bold tracking-wider">
          /teamwork-preview
        </span>
      </div>

      {/* Main Preview Container */}
      <div className="w-full max-w-md my-auto flex flex-col justify-center space-y-4 py-4">
        <div className="text-center space-y-2 mb-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 p-0.5 shadow-md">
            <div className="p-2.5 bg-[#271409] rounded-[14px] text-amber-300">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-xl font-black text-amber-300 font-medieval tracking-wide">
            Алхам 0: Багийн баталгаажуулалт
          </h2>
          <p className="text-xs text-[#deb887] max-w-xs mx-auto leading-relaxed font-sans">
            “Эхлэхийн өмнө багийн бүх гишүүд багтсан зургаа бүтэн оруулан илгээнэ үү”
          </p>
        </div>

        {!uploadedUrl ? (
          <PhotoUpload
            teamId="preview-team-001"
            onPhotoUploaded={(url) => setUploadedUrl(url)}
          />
        ) : (
          <div className="pirate-panel-parchment rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
            <div className="pirate-corner-rivet top-2 left-2" />
            <div className="pirate-corner-rivet top-2 right-2" />
            <div className="pirate-corner-rivet bottom-2 left-2" />
            <div className="pirate-corner-rivet bottom-2 right-2" />

            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black border-2 border-[#734c26] shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedUrl}
                alt="Баталгаажуулах зураг"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h3 className="text-base font-black text-[#2b1708] font-medieval">
                Багийн зургийг амжилттай байршууллаа!
              </h3>
              <p className="text-xs text-[#5c371c] mt-1 font-sans">
                Админ шалгаж, ориентацийн эрлийг эхлүүлэх зөвшөөрөл өгөхөд тоглоом шууд эхэлнэ.
              </p>
            </div>

            <button
              onClick={() => setUploadedUrl(null)}
              className="px-4 py-2 rounded-xl btn-pirate-wood text-xs font-bold inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Зургийг дахин турших</span>
            </button>
          </div>
        )}
      </div>

      <footer className="w-full max-w-md text-center py-4 text-[11px] text-[#784c24] font-mono">
        BJTU Монгол Оюутны Холбоо · Ориентаци
      </footer>
    </div>
  );
}
