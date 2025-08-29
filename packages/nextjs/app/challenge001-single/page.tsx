"use client";

import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pair, Route } from "@uniswap/v2-sdk";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits, parseAbi, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { useAccount, useReadContract } from "wagmi";
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
  const [fetchStartTime, setFetchStartTime] = useState<number | null>(null);
  const [totalFetchTime, setTotalFetchTime] = useState<number | null>(null);

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

  // Token 1 calls
  const { data: token1Balance, refetch: refetchToken1Balance } = useReadContract({
    address: tokenList[0]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token1Decimals, refetch: refetchToken1Decimals } = useReadContract({
    address: tokenList[0]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token1Name, refetch: refetchToken1Name } = useReadContract({
    address: tokenList[0]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "name",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token1Symbol, refetch: refetchToken1Symbol } = useReadContract({
    address: tokenList[0]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "symbol",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token1Reserves, refetch: refetchToken1Reserves } = useReadContract({
    address: tokenList[0]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "getReserves",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token1Token0, refetch: refetchToken1Token0 } = useReadContract({
    address: tokenList[0]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "token0",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token1Token1, refetch: refetchToken1Token1 } = useReadContract({
    address: tokenList[0]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "token1",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  // Token 2 calls
  const { data: token2Balance, refetch: refetchToken2Balance } = useReadContract({
    address: tokenList[1]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token2Decimals, refetch: refetchToken2Decimals } = useReadContract({
    address: tokenList[1]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token2Name, refetch: refetchToken2Name } = useReadContract({
    address: tokenList[1]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "name",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token2Symbol, refetch: refetchToken2Symbol } = useReadContract({
    address: tokenList[1]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "symbol",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token2Reserves, refetch: refetchToken2Reserves } = useReadContract({
    address: tokenList[1]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "getReserves",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token2Token0, refetch: refetchToken2Token0 } = useReadContract({
    address: tokenList[1]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "token0",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token2Token1, refetch: refetchToken2Token1 } = useReadContract({
    address: tokenList[1]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "token1",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  // Token 3 calls
  const { data: token3Balance, refetch: refetchToken3Balance } = useReadContract({
    address: tokenList[2]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token3Decimals, refetch: refetchToken3Decimals } = useReadContract({
    address: tokenList[2]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token3Name, refetch: refetchToken3Name } = useReadContract({
    address: tokenList[2]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "name",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token3Symbol, refetch: refetchToken3Symbol } = useReadContract({
    address: tokenList[2]?.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "symbol",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token3Reserves, refetch: refetchToken3Reserves } = useReadContract({
    address: tokenList[2]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "getReserves",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token3Token0, refetch: refetchToken3Token0 } = useReadContract({
    address: tokenList[2]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "token0",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  const { data: token3Token1, refetch: refetchToken3Token1 } = useReadContract({
    address: tokenList[2]?.pairAddress as `0x${string}`,
    abi: uniswapv2PairAbi,
    functionName: "token1",
    chainId: mainnet.id,
    query: { enabled: address != null && accountStatus === "connected" },
  });

  // Track when data starts loading and when it's complete
  useEffect(() => {
    if (address && accountStatus === "connected" && !fetchStartTime) {
      setFetchStartTime(Date.now());
    }
  }, [address, accountStatus, fetchStartTime]);

  // Check if all data is loaded and calculate fetch time
  useEffect(() => {
    const allDataLoaded =
      token1Balance !== undefined &&
      token1Decimals !== undefined &&
      token1Name !== undefined &&
      token1Symbol !== undefined &&
      token1Reserves !== undefined &&
      token1Token0 !== undefined &&
      token1Token1 !== undefined &&
      token2Balance !== undefined &&
      token2Decimals !== undefined &&
      token2Name !== undefined &&
      token2Symbol !== undefined &&
      token2Reserves !== undefined &&
      token2Token0 !== undefined &&
      token2Token1 !== undefined &&
      token3Balance !== undefined &&
      token3Decimals !== undefined &&
      token3Name !== undefined &&
      token3Symbol !== undefined &&
      token3Reserves !== undefined &&
      token3Token0 !== undefined &&
      token3Token1 !== undefined;

    if (allDataLoaded && fetchStartTime && !totalFetchTime) {
      setTotalFetchTime(Date.now() - fetchStartTime);
    }
  }, [
    token1Balance,
    token1Decimals,
    token1Name,
    token1Symbol,
    token1Reserves,
    token1Token0,
    token1Token1,
    token2Balance,
    token2Decimals,
    token2Name,
    token2Symbol,
    token2Reserves,
    token2Token0,
    token2Token1,
    token3Balance,
    token3Decimals,
    token3Name,
    token3Symbol,
    token3Reserves,
    token3Token0,
    token3Token1,
    fetchStartTime,
    totalFetchTime,
  ]);

  const refreshData = async () => {
    setIsRefreshing(true);
    setFetchStartTime(Date.now());
    setTotalFetchTime(null);

    try {
      await Promise.all([
        // Token 1
        refetchToken1Balance(),
        refetchToken1Decimals(),
        refetchToken1Name(),
        refetchToken1Symbol(),
        refetchToken1Reserves(),
        refetchToken1Token0(),
        refetchToken1Token1(),
        // Token 2
        refetchToken2Balance(),
        refetchToken2Decimals(),
        refetchToken2Name(),
        refetchToken2Symbol(),
        refetchToken2Reserves(),
        refetchToken2Token0(),
        refetchToken2Token1(),
        // Token 3
        refetchToken3Balance(),
        refetchToken3Decimals(),
        refetchToken3Name(),
        refetchToken3Symbol(),
        refetchToken3Reserves(),
        refetchToken3Token0(),
        refetchToken3Token1(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const tokens = useMemo(() => {
    const tokens = [];
    const WETH = new Token(1, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18);

    // Token 1
    if (token1Balance != null && token1Decimals != null && token1Name != null && token1Symbol != null) {
      const tokenData = {
        address: tokenList[0]?.tokenAddress,
        balance: token1Balance,
        decimals: token1Decimals,
        name: token1Name,
        symbol: token1Symbol,
        usdPrice: 0,
        balanceUsd: 0,
      };

      // Calculate price if price data is available
      if (token1Reserves && token1Token0 && token1Token1) {
        try {
          const TOKEN = new Token(1, tokenData.address, tokenData.decimals);
          const token0 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token1Token0.toLowerCase(),
          ) as Token;
          const token1 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token1Token1.toLowerCase(),
          ) as Token;

          if (token0 && token1) {
            const pair = new Pair(
              CurrencyAmount.fromRawAmount(token0, token1Reserves[0].toString()),
              CurrencyAmount.fromRawAmount(token1, token1Reserves[1].toString()),
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

    // Token 2
    if (token2Balance != null && token2Decimals != null && token2Name != null && token2Symbol != null) {
      const tokenData = {
        address: tokenList[1]?.tokenAddress,
        balance: token2Balance,
        decimals: token2Decimals,
        name: token2Name,
        symbol: token2Symbol,
        usdPrice: 0,
        balanceUsd: 0,
      };

      // Calculate price if price data is available
      if (token2Reserves && token2Token0 && token2Token1) {
        try {
          const TOKEN = new Token(1, tokenData.address, tokenData.decimals);
          const token0 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token2Token0.toLowerCase(),
          ) as Token;
          const token1 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token2Token1.toLowerCase(),
          ) as Token;

          if (token0 && token1) {
            const pair = new Pair(
              CurrencyAmount.fromRawAmount(token0, token2Reserves[0].toString()),
              CurrencyAmount.fromRawAmount(token1, token2Reserves[1].toString()),
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

    // Token 3
    if (token3Balance != null && token3Decimals != null && token3Name != null && token3Symbol != null) {
      const tokenData = {
        address: tokenList[2]?.tokenAddress,
        balance: token3Balance,
        decimals: token3Decimals,
        name: token3Name,
        symbol: token3Symbol,
        usdPrice: 0,
        balanceUsd: 0,
      };

      // Calculate price if price data is available
      if (token3Reserves && token3Token0 && token3Token1) {
        try {
          const TOKEN = new Token(1, tokenData.address, tokenData.decimals);
          const token0 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token3Token0.toLowerCase(),
          ) as Token;
          const token1 = [WETH, TOKEN].find(
            token => token.address.toLowerCase() === token3Token1.toLowerCase(),
          ) as Token;

          if (token0 && token1) {
            const pair = new Pair(
              CurrencyAmount.fromRawAmount(token0, token3Reserves[0].toString()),
              CurrencyAmount.fromRawAmount(token1, token3Reserves[1].toString()),
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

    return tokens;
  }, [
    tokenList,
    ethPrice,
    token1Balance,
    token1Decimals,
    token1Name,
    token1Symbol,
    token1Reserves,
    token1Token0,
    token1Token1,
    token2Balance,
    token2Decimals,
    token2Name,
    token2Symbol,
    token2Reserves,
    token2Token0,
    token2Token1,
    token3Balance,
    token3Decimals,
    token3Name,
    token3Symbol,
    token3Reserves,
    token3Token0,
    token3Token1,
  ]);

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
          <h1 className="text-3xl font-bold text-gray-200">Single Call Dashboard</h1>
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
        <p className="text-sm text-gray-500">Ethereum Mainnet (Individual Contract Calls)</p>

        {/* Fetch Time Display */}
        <div className="mt-2 p-2 bg-base-200 rounded-lg">
          <p className="text-sm font-medium">
            Total Fetch Time: {totalFetchTime ? `${totalFetchTime}ms` : "Measuring..."}
          </p>
        </div>

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
