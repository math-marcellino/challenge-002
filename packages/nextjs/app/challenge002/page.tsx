"use client";

import { useState, useMemo } from "react";
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
    <div className="flex flex-col px-12 py-6">
      <p>
        Multisend Contract Address:{" "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://sepolia.arbiscan.io/address/0x0C149FbbBE49baB59B1d1d0749f4109F02a46F77#code"
          className="underline"
        >
          0x0C149FbbBE49baB59B1d1d0749f4109F02a46F77
        </a>
      </p>
      <p>Challenge 002: Multi-Send Tool</p>

      <MintDummyTokenSection />

      <div className="flex flex-col gap-y-4">
        <p>Load token contract</p>
        <input
          type="text"
          placeholder="Token contract address"
          className="border w-full rounded-lg p-2"
          onChange={e => setTokenAddress(e.target.value as Address)}
        />

        {tokenInfo.error ? (
          tokenInfo.error.cause instanceof ContractFunctionZeroDataError ||
          tokenInfo.error.name === "ContractFunctionExecutionError" ? (
            <p className="text-[#FF0000]">Token not found</p>
          ) : (
            <p className="text-[#FF0000]">{tokenInfo.error.message}</p>
          )
        ) : null}

        {tokenInfo.fetchStatus === "fetching" ? <p className="animate-pulse">Loading...</p> : null}
      </div>

      {tokenInfo.status === "success" && tokenAddress != null && token != null ? (
        <MultisendSection tokenAddress={tokenAddress} tokenInfo={token} />
      ) : null}
    </div>
  );
}

function MultisendSection({ tokenAddress, tokenInfo }: { tokenAddress: Address; tokenInfo: Token }) {
  const [rawValue, setRawValue] = useState("");
  const [error, setError] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  const { address, status: accountStatus } = useAccount();

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    query: { enabled: address != null },
  });

  const publicClient = usePublicClient();

  const { data: gasEstimate } = useQuery({
    queryKey: ["gasEstimate"],
    queryFn: async () => {
      if (address == null && accountStatus === "disconnected") throw new Error("Wallet is not connected!");
      if (publicClient == null) throw new Error("Public client is not available yet");
      if (tokenBalance == null) throw new Error("Token balance is not available yet");

      const recipients = parseRecipientToken(rawValue, tokenInfo.decimals);

      const addresses = recipients.map(recipients => recipients.address);
      const values = recipients.map(recipients => recipients.value);
      const totalValue = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0n);

      const [multisendGas, singleSendGas] = await Promise.all([
        publicClient.estimateContractGas({
          address: externalContracts[421614].Multisend.address,
          abi: externalContracts[421614].Multisend.abi,
          functionName: "multisendERC20",
          args: [tokenAddress, addresses, values, totalValue],
        }),
        publicClient.estimateContractGas({
          address: externalContracts[421614].DummyToken.address,
          abi: externalContracts[421614].DummyToken.abi,
          functionName: "transfer",
          args: [addresses[0], values[0]],
        }),
      ]);

      return {
        multisendGas,
        singleSendGas,
      };
    },
  });

  // Disperse Token
  const { writeContractAsync: writeApprove, status: approveStatus } = useWriteContract();
  const { writeContractAsync: writeDisperse, status: disperseStatus } = useWriteContract();

  const multisendToken = async () => {
    setError(undefined);
    try {
      if (!address && accountStatus === "disconnected") throw new Error("Wallet is not connected!");
      if (publicClient == null) throw new Error("Public client is not available yet");
      if (tokenBalance == null) throw new Error("Token balance is not available yet");

      const recipients = parseRecipientToken(rawValue, tokenInfo.decimals);

      const addresses = recipients.map(recipients => recipients.address);
      const values = recipients.map(recipients => recipients.value);
      const totalValue = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0n);

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

      const hash = await writeDisperse({
        address: externalContracts[421614].Multisend.address,
        abi: externalContracts[421614].Multisend.abi,
        functionName: "multisendERC20",
        args: [tokenAddress, addresses, values, totalValue],
      });

      refetchBalance();
      setTxHash(hash);
    } catch (e) {
      console.log(e);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-between">
        <p>Enter wallets and amounts</p>
        {tokenBalance ? (
          <p>
            Balance:{" "}
            {Number.parseFloat(formatUnits(tokenBalance, tokenInfo.decimals)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {tokenInfo.symbol}
          </p>
        ) : (
          <p className="animate-pulse">Loading...</p>
        )}
      </div>

      <textarea
        value={rawValue}
        onChange={e => setRawValue(e.target.value)}
        spellCheck="false"
        className="border w-full min-h-[150px] rounded-lg p-2"
        placeholder="Accepted input formats: 0x4186A3B76843Ab221c4d4dE1f9C83623C2db9D90 0.05 or 0x69aDB71215B1906a913bC8f2eca5881Ba62ABAa6,0.15 or 0x9E071a05644f536E7809f800fC4368c352c0D7f2=1.15 or 0xE5F093AF55E07AaeDE5A533a76B88AE32CcF95FD;2"
      />

      {accountStatus === "connected" ? (
        <button
          type="button"
          onClick={multisendToken}
          disabled={disperseStatus === "pending" || approveStatus === "pending"}
          className={`${disperseStatus === "pending" || approveStatus === "pending" ? "animate-pulse" : undefined} bg-white/40 rounded-lg p-2`}
        >
          Approve & Multisend
        </button>
      ) : (
        <p>Please connect your wallet first</p>
      )}

      {error && <p className="text-red-700">{error}</p>}
      {txHash && (
        <p>
          Transaction submitted at{" "}
          <a
            href={`${arbitrumSepolia.blockExplorers.default.url}/tx/${txHash}`}
            rel="noopener noreferrer"
            target="_blank"
            className="text-blue-700"
          >
            {formatAddress(txHash)}
          </a>
        </p>
      )}
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
