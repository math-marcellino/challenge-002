import { chainId, evmAddress, useAaveMarkets, useUserSupplies } from "@aave/react";
import { zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { useAccount } from "wagmi";

export default function useAaveV3Positions() {
  const { address } = useAccount();
  const { data: markets, loading: marketsLoading } = useAaveMarkets({ chainIds: [chainId(mainnet.id)] });

  const { data: positions, loading: positionsLoading } = useUserSupplies({
    markets: markets?.map(market => ({ address: market.address, chainId: market.chain.chainId })) ?? [],
    user: evmAddress(address ?? zeroAddress),
  });

  return {
    markets,
    positions,
    isLoading: marketsLoading || positionsLoading,
  };
}
