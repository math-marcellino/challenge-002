import AavePositions from "./AavePositions";

export default async function Page() {
  return (
    <div className="flex flex-col px-12 py-6 space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Cross-Protocol Yield Tracker</h1>
        <p className="text-sm text-gray-500">Ethereum Mainnet</p>
      </div>

      <AavePositions />
    </div>
  );
}
