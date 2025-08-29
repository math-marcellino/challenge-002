"use client";

import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pair, Route } from "@uniswap/v2-sdk";
import { useMemo } from "react";
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
  const { data: rawTokens, refetch: refetchRawTokens } = useReadContracts({
    contracts: tokenList.flatMap(token => [
      // Balance
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? zeroAddress],
        chainId: mainnet.id,
      },
      // Decimals
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
        chainId: mainnet.id,
      },
      // Name
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "name",
        chainId: mainnet.id,
      },
      // Symbol
      {
        address: token.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol",
        chainId: mainnet.id,
      },
    ]),
    query: {
      enabled: address != null && accountStatus === "connected",
    },
  });

  const { data: rawPriceData, refetch: refetchRawPriceData } = useReadContracts({
    contracts: tokenList.flatMap(token => [
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

  const refreshData = () => {
    refetchRawTokens();
    refetchRawPriceData();
  };

  const tokens = useMemo(() => {
    // First, build basic tokens array
    const tokens = [];
    if (rawTokens != null) {
      for (let i = 0; i < rawTokens.length; i += 4) {
        const tokenIndex = Math.floor(i / 4);
        tokens.push({
          address: tokenList[tokenIndex]?.tokenAddress,
          balance: rawTokens[i].result as bigint,
          decimals: rawTokens[i + 1].result as number,
          name: rawTokens[i + 2].result as string,
          symbol: rawTokens[i + 3].result as string,
          usdPrice: 0,
          balanceUsd: 0,
        });
      }
    }

    // Then, calculate prices and update tokens
    if (rawPriceData != null && tokens.length > 0) {
      const WETH = new Token(1, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18);

      for (let i = 0; i < rawPriceData.length; i += 3) {
        const tokenIndex = Math.floor(i / 3);
        const currentToken = tokens[tokenIndex];

        if (!currentToken) {
          continue;
        }

        // Check if all required contract call results are available
        const reservesResult = rawPriceData[i]?.result as readonly [bigint, bigint, number] | undefined;
        const token0Result = rawPriceData[i + 1]?.result as string | undefined;
        const token1Result = rawPriceData[i + 2]?.result as string | undefined;

        if (!reservesResult || !token0Result || !token1Result) {
          continue; // Skip this iteration if any data is missing
        }

        try {
          const TOKEN = new Token(1, currentToken.address, currentToken.decimals);
          const token0 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token0Result.toLowerCase(),
          ) as Token;
          const token1 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token1Result.toLowerCase(),
          ) as Token;

          if (!token0 || !token1) {
            continue; // Skip if tokens not found
          }

          const pair = new Pair(
            CurrencyAmount.fromRawAmount(token0, reservesResult[0].toString()),
            CurrencyAmount.fromRawAmount(token1, reservesResult[1].toString()),
          );
          const route = new Route([pair], TOKEN, WETH);
          const usdPrice = parseFloat(route.midPrice.toSignificant(6)) * ethPrice;
          const balanceInTokens = parseFloat(formatUnits(currentToken.balance, currentToken.decimals));
          const balanceUsd = balanceInTokens * usdPrice;

          // Update the token with price data
          currentToken.usdPrice = usdPrice;
          currentToken.balanceUsd = balanceUsd;
        } catch (error) {
          console.error(`Error calculating price for token ${currentToken.address}:`, error);
        }
      }
    }

    return tokens;
  }, [rawTokens, rawPriceData, tokenList, ethPrice]);

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
            className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 text-white"
            title="Refresh data"
          >
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
            Refresh
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
