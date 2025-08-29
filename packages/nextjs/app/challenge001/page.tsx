"use client";

import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pair, Route } from "@uniswap/v2-sdk";
import { useMemo, useState } from "react";
import { erc20Abi, formatUnits, parseAbi, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { useAccount, useReadContracts } from "wagmi";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-eth/useNativeCurrencyPrice";

const uniswapv2PairAbi = parseAbi([
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
]);

export default function Page() {
  const { address, status: accountStatus } = useAccount();
  const ethPrice = useNativeCurrencyPrice();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tokenList = useMemo(
    () => [
      {
        tokenAddress: "0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c",
        pairAddress: "0x52c77b0CB827aFbAD022E6d6CAF2C44452eDbc39",
      },
      {
        tokenAddress: "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a",
        pairAddress: "0xc2eaB7d33d3cB97692eCB231A5D0e4A649Cb539d",
      },
      {
        tokenAddress: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
        pairAddress: "0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f",
      },
    ],
    [],
  );
  const { data: rawData, refetch: refetchData } = useReadContracts({
    contracts: tokenList.flatMap(token => [
      // Token data (4 calls per token)
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? zeroAddress],
        chainId: mainnet.id,
      },
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
        chainId: mainnet.id,
      },
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "name",
        chainId: mainnet.id,
      },
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol",
        chainId: mainnet.id,
      },
      // Price data (3 calls per token)
      {
        address: token.pairAddress as `0x${string}`,
        abi: uniswapv2PairAbi,
        functionName: "getReserves",
        chainId: mainnet.id,
      },
      {
        address: token.pairAddress as `0x${string}`,
        abi: uniswapv2PairAbi,
        functionName: "token0",
        chainId: mainnet.id,
      },
      {
        address: token.pairAddress as `0x${string}`,
        abi: uniswapv2PairAbi,
        functionName: "token1",
        chainId: mainnet.id,
      },
    ]),
    query: {
      enabled: address != null && accountStatus === "connected",
    },
  });

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await refetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const tokens = useMemo(() => {
    // Build tokens array with integrated price calculation
    const tokens = [];
    if (rawData != null) {
      const WETH = new Token(1, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18);

      for (let tokenIndex = 0; tokenIndex < tokenList.length; tokenIndex++) {
        // Each token has 7 calls: 4 for token data + 3 for price data
        const baseIndex = tokenIndex * 7;

        // Extract token data (first 4 calls)
        const balanceResult = rawData[baseIndex]?.result as bigint | undefined;
        const decimalsResult = rawData[baseIndex + 1]?.result as number | undefined;
        const nameResult = rawData[baseIndex + 2]?.result as string | undefined;
        const symbolResult = rawData[baseIndex + 3]?.result as string | undefined;

        // Extract price data (next 3 calls)
        const reservesResult = rawData[baseIndex + 4]?.result as readonly [bigint, bigint, number] | undefined;
        const token0Result = rawData[baseIndex + 5]?.result as string | undefined;
        const token1Result = rawData[baseIndex + 6]?.result as string | undefined;

        if (balanceResult == null || decimalsResult == null || nameResult == null || symbolResult == null) {
          continue; // Skip if token data is missing
        }

        const tokenData = {
          address: tokenList[tokenIndex]?.tokenAddress,
          balance: balanceResult,
          decimals: decimalsResult,
          name: nameResult,
          symbol: symbolResult,
          usdPrice: 0,
          balanceUsd: 0,
        };

        // Calculate price if price data is available
        if (reservesResult && token0Result && token1Result) {
          try {
            const TOKEN = new Token(1, tokenData.address, tokenData.decimals);
            const token0 = [WETH, TOKEN].find(
              token => token.address.toLowerCase() === token0Result.toLowerCase(),
            ) as Token;
            const token1 = [WETH, TOKEN].find(
              token => token.address.toLowerCase() === token1Result.toLowerCase(),
            ) as Token;

            if (token0 && token1) {
              const pair = new Pair(
                CurrencyAmount.fromRawAmount(token0, reservesResult[0].toString()),
                CurrencyAmount.fromRawAmount(token1, reservesResult[1].toString()),
              );
              const route = new Route([pair], TOKEN, WETH);
              const usdPrice = parseFloat(route.midPrice.toSignificant(6)) * ethPrice;
              const balanceInTokens = parseFloat(formatUnits(tokenData.balance, tokenData.decimals));
              const balanceUsd = balanceInTokens * usdPrice;

              tokenData.usdPrice = usdPrice;
              tokenData.balanceUsd = balanceUsd;
            }
          } catch (error) {
            console.error(`Error calculating price for token ${tokenData.address}:`, error);
          }
        }

        tokens.push(tokenData);
      }
    }

    return tokens;
  }, [rawData, tokenList, ethPrice]);

  if (accountStatus === "connecting" || accountStatus === "reconnecting") {
    return <p className="animate-pulse px-12 py-6">Loading...</p>;
  }

  if (address == null || accountStatus !== "connected") {
    return <p className="px-12 py-6">No wallet is connected</p>;
  }

  return (
    <div className="flex flex-col px-12 py-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h1 className="text-3xl font-bold text-gray-200">Multi-Read Dashboard</h1>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 text-white disabled:opacity-50"
            title="Refresh data"
          >
            {isRefreshing ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="text-sm text-gray-500">Ethereum Mainnet</p>
        <div className="mt-4 p-3 bg-base-200 rounded-lg">
          <p className="text-sm font-medium">Connected Account:</p>
          <p className="font-mono text-xs break-all">{address}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tokens.map(token => {
          const balance = Number.parseFloat(formatUnits(token.balance, token.decimals));
          return (
            <div key={token.symbol} className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-lg">{token.symbol}</h3>
                  <div className="badge badge-outline">{token.name}</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Balance:</span>
                    <span className="font-semibold">
                      {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">USD Price:</span>
                    <span className="font-semibold text-success">
                      $
                      {token.usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total USD Value:</span>
                    <span className="font-bold text-lg text-primary">
                      $
                      {token.balanceUsd.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tokens.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tokens found or still loading...</p>
        </div>
      )}
    </div>
  );
}
