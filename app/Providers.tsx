"use client";

import React from "react";
import { AudioProvider } from "@/contexts/AudioContext";
import AbstractProvider from "./components/AbstractProvider";
import { WagmiProvider } from 'wagmi';
import config from '@/config/wagmi';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AbstractProvider>
      <WagmiProvider config={config}>
        <AudioProvider>
          {children}
        </AudioProvider>
      </WagmiProvider>
    </AbstractProvider>
  );
} 