"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Address,
  ContractFunctionZeroDataError,
  erc20Abi,
  formatUnits,
  isAddress,
  parseUnits,
  zeroAddress,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { useAccount, usePublicClient, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import externalContracts from "~~/contracts/externalContracts";
import formatAddress from "~~/utils/formatAddress";
import MintDummyTokenSection from "./MintDummyTokenSection";
import { useQuery } from "@tanstack/react-query";

interface Token {
  decimals: number;
  name: string;
  symbol: string;
}

export default function Page() {
  const [tokenAddress, setTokenAddress] = useState<Address>();

  const tokenInfo = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        // Fallback to 'zeroAddress' to satisfy typescript
        // The query will be disabled if tokenAddress (user input) is null anyway
        address: tokenAddress ?? zeroAddress,
        abi: erc20Abi,
        functionName: "decimals",
        chainId: arbitrumSepolia.id,
      },
      {
        // Fallback to 'zeroAddress' to satisfy typescript
        // The query will be disabled if tokenAddress (user input) is null anyway
        address: tokenAddress ?? zeroAddress,
        abi: erc20Abi,
        functionName: "name",
        chainId: arbitrumSepolia.id,
      },
      {
        // Fallback to 'zeroAddress' to satisfy typescript
        // The query will be disabled if tokenAddress (user input) is null anyway
        address: tokenAddress ?? zeroAddress,
        abi: erc20Abi,
        functionName: "symbol",
        chainId: arbitrumSepolia.id,
      },
    ],
    query: {
      enabled: tokenAddress != null,
    },
  });

  const token: Token | null = useMemo(
    () =>
      tokenInfo.data != null
        ? {
            decimals: tokenInfo.data[0],
            name: tokenInfo.data[1],
            symbol: tokenInfo.data[2],
          }
        : null,
    [tokenInfo.data],
  );

  return (
    <div className="flex flex-col px-12 py-6 space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Multi-Send Tool</h1>
        <p className="text-sm text-gray-500">Arbitrum Sepolia</p>
        <div className="mt-4 p-3 bg-base-200 rounded-lg">
          <p className="text-sm font-medium">Multisend Contract:</p>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://sepolia.arbiscan.io/address/0x0C149FbbBE49baB59B1d1d0749f4109F02a46F77#code"
            className="font-mono text-xs break-all text-blue-600 hover:text-blue-800 underline"
          >
            0x0C149FbbBE49baB59B1d1d0749f4109F02a46F77
          </a>
        </div>
      </div>

      {/* Mint Dummy Token Section */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Test Tokens</h2>
          <MintDummyTokenSection />
        </div>
      </div>

      {/* Token Input Section */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Load Token Contract</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter token contract address (0x...)"
              className="input input-bordered w-full"
              onChange={e => setTokenAddress(e.target.value as Address)}
            />

            {tokenInfo.error ? (
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {tokenInfo.error.cause instanceof ContractFunctionZeroDataError ||
                  tokenInfo.error.name === "ContractFunctionExecutionError"
                    ? "Token not found"
                    : tokenInfo.error.message}
                </span>
              </div>
            ) : null}

            {tokenInfo.fetchStatus === "fetching" && (
              <div className="alert alert-info">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Loading token information...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multisend Section */}
      {tokenInfo.status === "success" && tokenAddress != null && token != null ? (
        <MultisendSection tokenAddress={tokenAddress} tokenInfo={token} />
      ) : null}
    </div>
  );
}

function MultisendSection({ tokenAddress, tokenInfo }: { tokenAddress: Address; tokenInfo: Token }) {
  // #region States
  const [rawValue, setRawValue] = useState("");
  const [error, setError] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const parsedInput = useMemo(() => {
    try {
      setError(undefined);
      const recipients = parseRecipientToken(rawValue, tokenInfo.decimals);

      const addresses = recipients.map(recipients => recipients.address);
      const values = recipients.map(recipients => recipients.value);
      const totalValue = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0n);

      return {
        addresses,
        values,
        totalValue,
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return {
        addresses: [],
        values: [],
        totalValue: 0n,
      };
    }
  }, [rawValue, tokenInfo.decimals]);
  // #endregion

  // #region On-chain read functions
  const { address, status: accountStatus } = useAccount();
  const publicClient = usePublicClient();

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    query: { enabled: address != null },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address ?? zeroAddress, externalContracts[421614].Multisend.address],
    query: { enabled: address != null },
  });

  const { data: gasEstimate, refetch: refetchGasEstimate } = useQuery({
    queryKey: ["gasEstimate"],
    queryFn: async () => {
      if (publicClient == null) return null;

      const addresses = parsedInput.addresses;
      const values = parsedInput.values;
      const totalValue = parsedInput.totalValue;

      const [multisendGas, singleSendGas] = await Promise.all([
        publicClient.estimateContractGas({
          address: externalContracts[421614].Multisend.address,
          abi: externalContracts[421614].Multisend.abi,
          functionName: "multisendERC20",
          args: [tokenAddress, addresses, values, totalValue],
          account: address,
        }),
        publicClient.estimateContractGas({
          address: externalContracts[421614].DummyToken.address,
          abi: externalContracts[421614].DummyToken.abi,
          functionName: "transfer",
          args: [addresses[0], values[0]],
          account: address,
        }),
      ]);

      return {
        multisendGas,
        singleSendGas,
      };
    },
    enabled:
      address != null &&
      accountStatus === "connected" &&
      publicClient != null &&
      tokenBalance != null &&
      parsedInput.addresses.length > 0,
  });
  // #endregion

  useEffect(() => {
    refetchAllowance();
  }, [rawValue, refetchAllowance]);

  // #region Write Functions
  const { writeContractAsync: writeApprove, status: approveStatus } = useWriteContract();
  const { writeContractAsync: writeMultisend, status: multisendStatus } = useWriteContract();

  const approveToken = async () => {
    setError(undefined);
    try {
      if (!address && accountStatus === "disconnected") throw new Error("Wallet is not connected!");
      if (publicClient == null) throw new Error("Public client is not available yet");
      if (tokenBalance == null) throw new Error("Token balance is not available yet");

      const totalValue = parsedInput.totalValue;

      if (tokenBalance < totalValue) throw new Error("You don't have enough balance");

      const approveHash = await writeApprove({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [externalContracts[421614].Multisend.address, totalValue],
      });

      await publicClient.waitForTransactionReceipt({
        hash: approveHash,
        confirmations: 1,
      });

      refetchAllowance();
      refetchGasEstimate();
    } catch (e) {
      console.log(e);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const multisendToken = async () => {
    setError(undefined);
    try {
      if (!address && accountStatus === "disconnected") throw new Error("Wallet is not connected!");
      if (publicClient == null) throw new Error("Public client is not available yet");
      if (tokenBalance == null) throw new Error("Token balance is not available yet");
      if (allowance == null) throw new Error("Allowance is not available yet");

      const addresses = parsedInput.addresses;
      const values = parsedInput.values;
      const totalValue = parsedInput.totalValue;

      if (allowance < totalValue) throw new Error("You don't have enough allowance");
      if (tokenBalance < totalValue) throw new Error("You don't have enough balance");

      // Execute the transaction
      const hash = await writeMultisend({
        address: externalContracts[421614].Multisend.address,
        abi: externalContracts[421614].Multisend.abi,
        functionName: "multisendERC20",
        args: [tokenAddress, addresses, values, totalValue],
      });

      setTxHash(hash);

      // Wait for 3 block confirmation
      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 3,
      });
      setIsConfirmed(true);

      refetchBalance();
    } catch (e) {
      console.log(e);
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  // #endregion

  return (
    <div className="card bg-base-100 shadow-lg border border-base-300">
      <div className="card-body space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-xl">Multi-Send Configuration</h2>
          <div className="badge badge-outline">
            {tokenInfo.name} ({tokenInfo.symbol})
          </div>
        </div>

        {/* Balance Display */}
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Your Balance</div>
            <div className="stat-value text-lg">
              {tokenBalance ? (
                <>
                  {Number.parseFloat(formatUnits(tokenBalance, tokenInfo.decimals)).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-sm">{tokenInfo.symbol}</span>
                </>
              ) : (
                <span className="loading loading-dots loading-md"></span>
              )}
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text font-medium">Recipients and Amounts</span>
              <span className="label-text-alt">
                {parsedInput.addresses.length > 0 && `${parsedInput.addresses.length} recipients`}
              </span>
            </label>
            <textarea
              value={rawValue}
              onChange={e => setRawValue(e.target.value)}
              spellCheck="false"
              className="textarea textarea-bordered rounded-lg w-full min-h-[150px]"
              placeholder="Enter recipients and amounts. Supported formats:&#10;0x4186A3B76843Ab221c4d4dE1f9C83623C2db9D90 0.05&#10;0x69aDB71215B1906a913bC8f2eca5881Ba62ABAa6,0.15&#10;0x9E071a05644f536E7809f800fC4368c352c0D7f2=1.15&#10;0xE5F093AF55E07AaeDE5A533a76B88AE32CcF95FD;2"
            />
          </div>

          {/* Total Amount Display */}
          {parsedInput.totalValue > 0n && (
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                Total to send:{" "}
                {Number.parseFloat(formatUnits(parsedInput.totalValue, tokenInfo.decimals)).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {tokenInfo.symbol}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {accountStatus === "connected" ? (
            <>
              {allowance != null && allowance >= parsedInput.totalValue ? (
                <button
                  type="button"
                  onClick={multisendToken}
                  disabled={multisendStatus === "pending" || rawValue === ""}
                  className="btn btn-primary w-full"
                >
                  {multisendStatus === "pending" && <span className="loading loading-spinner loading-sm"></span>}
                  Multisend{" "}
                  {Number.parseFloat(formatUnits(parsedInput.totalValue, tokenInfo.decimals)).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {tokenInfo.symbol}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={approveToken}
                  disabled={approveStatus === "pending" || rawValue === ""}
                  className="btn btn-secondary w-full"
                >
                  {approveStatus === "pending" && <span className="loading loading-spinner loading-sm"></span>}
                  Approve{" "}
                  {Number.parseFloat(formatUnits(parsedInput.totalValue, tokenInfo.decimals)).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {tokenInfo.symbol}
                </button>
              )}
            </>
          ) : (
            <div className="alert alert-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span>Please connect your wallet first</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Gas Estimates */}
        {!error && allowance != null && allowance >= parsedInput.totalValue && rawValue !== "" && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Gas Estimates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat">
                  <div className="stat-title">Multisend</div>
                  <div className="stat-value text-sm">
                    {gasEstimate?.multisendGas.toLocaleString() || "Calculating..."}
                  </div>
                  <div className="stat-desc">To {parsedInput.addresses.length} recipients</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Single Send</div>
                  <div className="stat-value text-sm">
                    {gasEstimate?.singleSendGas.toLocaleString() || "Calculating..."}
                  </div>
                  <div className="stat-desc">Per transaction</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Individual Sends</div>
                  <div className="stat-value text-sm">
                    {gasEstimate?.singleSendGas
                      ? (gasEstimate?.singleSendGas * BigInt(parsedInput.addresses.length)).toLocaleString()
                      : "Calculating..."}
                  </div>
                  <div className="stat-desc">Total for {parsedInput.addresses.length} txs</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!error && (!allowance || allowance < parsedInput.totalValue) && rawValue !== "" && (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Approve tokens to see gas estimates</span>
          </div>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Transaction Status</h3>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <span>Transaction Hash:</span>
                  <a
                    href={`${arbitrumSepolia.blockExplorers.default.url}/tx/${txHash}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="link link-primary font-mono text-sm"
                  >
                    {formatAddress(txHash)}
                  </a>
                </p>
                {isConfirmed ? (
                  <div className="alert alert-success">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Transaction confirmed with 3 block confirmations!</span>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Waiting for 3 block confirmations...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface RecipientInfo {
  address: Address;
  value: bigint;
}

const parseRecipientToken = (rawValue: string, decimals: number): RecipientInfo[] => {
  const lines = rawValue.split("\n");
  const updatedRecipients: RecipientInfo[] = [];

  lines.map((line, index) => {
    if (line.includes(" ") || line.includes(",") || line.includes("=") || line.includes("\t") || line.includes(";")) {
      const [address, value] = line.split(/[,= \t;]+/);
      if (!isAddress(address)) throw new Error(`Invalid address at line ${index + 1}`);
      const parsedValue = parseUnits(value, decimals);

      updatedRecipients.push({ address, value: parsedValue });
    } else {
      throw new Error(`Invalid format at line ${index + 1}`);
    }
  });

  return updatedRecipients;
};
