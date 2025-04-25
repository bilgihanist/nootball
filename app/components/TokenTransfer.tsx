"use client";

import { useAccount, useBalance } from 'wagmi';
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { formatUnits } from 'viem';

const NOOT_TOKEN_ADDRESS = '0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56';

export default function TokenTransfer() {
  const { address, isConnected } = useAccount();
  const { login } = useLoginWithAbstract();
  
  // ETH bakiyesi
  const { data: ethBalance } = useBalance({
    address,
  });

  // NOOT bakiyesi
  const { data: nootBalance } = useBalance({
    address,
    token: NOOT_TOKEN_ADDRESS,
  });

  const formatBalance = (value: bigint | undefined) => {
    if (!value) return '0.000000000000000000';
    return formatUnits(value, 18);
  };

  return (
    <div className="absolute top-4 right-4 z-20 bg-black/50 px-4 py-2 rounded-lg">
      {!isConnected ? (
        <button
          onClick={login}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">ETH Balance:</span>
            <span className="text-sm text-white font-semibold">
              {formatBalance(ethBalance?.value)} ETH
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">NOOT Balance:</span>
            <span className="text-sm text-white font-semibold">
              {formatBalance(nootBalance?.value)} NOOT
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 