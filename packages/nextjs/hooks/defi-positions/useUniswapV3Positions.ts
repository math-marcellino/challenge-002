import { useMemo } from "react";
import { mainnet } from "viem/chains";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import externalContracts from "~~/contracts/externalContracts";

interface PositionInfo {
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

const nonfungiblePositionManagerContract = {
  address: externalContracts[mainnet.id].NonfungiblePositionManager.address,
  abi: externalContracts[mainnet.id].NonfungiblePositionManager.abi,
  chainId: mainnet.id,
} as const;

export default function useUniswapV3Positions(page: number = 1) {
  const { address } = useAccount();

  const { data: numPositions } = useReadContract({
    ...nonfungiblePositionManagerContract,
    functionName: "balanceOf",
    args: ["0x3ac3579b1d1e64ea5f22c047210f41838aeed399"],
    query: {
      enabled: address != null,
    },
  });

  const posiotionIdContracts = useMemo(() => {
    if (numPositions == null) return [];
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, Number(numPositions));
    return Array.from({ length: endIndex - startIndex }, (_, index) => ({
      ...nonfungiblePositionManagerContract,
      functionName: "tokenOfOwnerByIndex" as const,
      args: ["0x3ac3579b1d1e64ea5f22c047210f41838aeed399", BigInt(startIndex + index)] as const,
    }));
  }, [numPositions, page]);

  const { data: positionIds } = useReadContracts({
    contracts: posiotionIdContracts,
    query: {
      enabled: numPositions != null && numPositions > 0n,
    },
  });

  const positionContracts = useMemo(() => {
    if (positionIds == null) return [];
    return positionIds
      .filter(positionId => positionId.status === "success")
      .map(positionId => ({
        ...nonfungiblePositionManagerContract,
        functionName: "positions" as const,
        args: [positionId.result] as const,
      }));
  }, [positionIds]);

  const { data: positions } = useReadContracts({
    contracts: positionContracts,
    query: {
      enabled: positionIds != null && positionIds.length > 0,
    },
  });

  const formattedPositions = useMemo(() => {
    if (positions == null || positions.length === 0) return [];

    const data: PositionInfo[] = positions
      .filter(position => position.status === "success")
      .map(position => {
        return {
          tickLower: position.result[5],
          tickUpper: position.result[6],
          liquidity: position.result[7],
          feeGrowthInside0LastX128: position.result[8],
          feeGrowthInside1LastX128: position.result[9],
          tokensOwed0: position.result[10],
          tokensOwed1: position.result[11],
        };
      });
    return data;
  }, [positions]);
  return {
    numPositions,
    positionIds,
    positions,
    formattedPositions,
  };
}
