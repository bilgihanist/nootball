import { createConfig, http } from 'wagmi'
import { abstractTestnet } from 'viem/chains'
import { abstractWalletConnector } from '@abstract-foundation/agw-react/connectors'

const config = createConfig({
  connectors: [abstractWalletConnector()],
  chains: [abstractTestnet],
  transports: {
    [abstractTestnet.id]: http(),
  },
  ssr: true,
})

export default config 