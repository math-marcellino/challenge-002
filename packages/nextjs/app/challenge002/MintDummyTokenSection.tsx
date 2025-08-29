"use client";

import { useWriteContract } from "wagmi";
import externalContracts from "~~/contracts/externalContracts";
import { parseUnits } from "viem";

export default function MintDummyTokenSection() {
  const { writeContractAsync: mintDummyToken, status: mintStatus } = useWriteContract();
  return (
    <div className="flex flex-col p-2 border rounded-md">
      <p>Mint 100,000 Dummy Token</p>
      <p>Address: {externalContracts[421614].DummyToken.address}</p>
      <button
        type="button"
        onClick={async () =>
          await mintDummyToken({
            address: externalContracts[421614].DummyToken.address,
            abi: externalContracts[421614].DummyToken.abi,
            functionName: "mintToken",
            args: [parseUnits("100000", 18)],
          })
        }
        disabled={mintStatus === "pending"}
        className={`${mintStatus === "pending" ? "animate-pulse" : undefined} bg-white/40 rounded-lg p-2`}
      >
        Mint
      </button>
      {mintStatus === "success" ? (
        <p>Minted! Now you can multisend this token by pasting the token address below</p>
      ) : null}
    </div>
  );
}
