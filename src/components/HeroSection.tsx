"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown, Database } from "lucide-react";
import Link from "next/link";

const videoSrc =
  "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
    }
  }, []);

  return (
    <section className="relative w-full min-h-screen bg-[#000000] text-white overflow-hidden">
      <nav className="fixed top-0 left-0 w-full z-50 bg-transparent px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Database className="w-6 h-6 text-white" />
          <span className="font-semibold text-white font-[family-name:var(--font-instrument-sans)]">
            DataScope AI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] flex items-center gap-1 transition-colors"
          >
            Platform <ChevronDown className="w-4 h-4" />
          </a>
          <a
            href="#features"
            className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
          >
            Features
          </a>
          <a
            href="#"
            className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
          >
            Documentation
          </a>
          <a
            href="#"
            className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
          >
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="hidden sm:inline-block text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="bg-white text-black rounded-full px-5 py-2.5 font-semibold text-sm font-[family-name:var(--font-instrument-sans)] hover:bg-white/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
      />

      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-900/20 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] mix-blend-screen" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center mt-20 space-y-12 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-[48px] leading-[1.1] text-white"
        >
          Understand Every Dataset Before Building Smarter AI
        </motion.h2>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-[family-name:var(--font-instrument-sans)] font-semibold text-6xl sm:text-8xl lg:text-[136px] leading-[0.9] tracking-tighter bg-gradient-to-b from-white via-white to-[#b4c0ff] bg-clip-text text-transparent"
        >
          DataScope AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-[family-name:var(--font-instrument-sans)] text-lg sm:text-[20px] leading-[1.65] text-white max-w-xl"
        >
          Upload CSV or Excel datasets and instantly generate intelligent
          profiling, feature statistics, missing value analysis, correlation
          insights, interactive visualizations, data quality scores, and
          exportable reports—all from one modern workspace built for data
          scientists, AI engineers, researchers, and students.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-6 items-center"
        >
          <Link
            href="/auth/register"
            className="group flex items-center gap-0 pl-6 pr-2 py-2 rounded-full bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300"
          >
            <span className="font-[family-name:var(--font-instrument-sans)] font-medium text-lg text-[#0a0400]">
              Start Analyzing Free
            </span>
            <span className="ml-3 flex items-center justify-center w-10 h-10 rounded-full bg-[#3054ff] group-hover:bg-[#2040e0] transition-colors">
              <ArrowRight className="w-5 h-5 text-white" />
            </span>
          </Link>

          <a
            href="#features"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 backdrop-blur-sm transition-all duration-300"
          >
            <span className="font-[family-name:var(--font-instrument-sans)] text-lg">
              Explore Platform
            </span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
