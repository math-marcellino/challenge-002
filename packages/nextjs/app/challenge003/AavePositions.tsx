"use client";

import useAaveV3Positions from "~~/hooks/defi-positions/useAaveV3Positions";

export default function AavePositions() {
  const { positions, isLoading } = useAaveV3Positions();

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(num);
  };

  const formatUSD = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-1">Aave V3 Supply Positions</h2>
          <p className="text-sm text-gray-500">Your active lending positions on Aave protocol</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 animate-pulse">
              <div className="p-6">
                {/* Asset Header Skeleton */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex flex-col gap-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>

                {/* Market Info Skeleton */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>

                {/* Balance Info Skeleton */}
                <div className="space-y-3">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="flex items-baseline space-x-2">
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (positions == null || positions.length === 0) {
    return (
      <div className="max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-1">Aave V3 Supply Positions</h2>
          <p className="text-sm text-gray-500">Your active lending positions on Aave protocol</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Positions Found</h3>
            <p className="text-gray-500">You don&apos;t have any Aave V3 supply positions yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-1">Aave V3 Supply Positions</h2>
        <p className="text-sm text-gray-500">Your active lending positions on Aave protocol</p>
      </div>

      {/* Positions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {positions.map(position => (
          <div
            key={position.market.address}
            className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-6">
              {/* Asset Header */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={position.currency.imageUrl}
                    alt={position.currency.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex flex-col">
                    <p className="m-0 text-base font-semibold text-gray-900">{position.currency.name}</p>
                    <p className="m-0 text-sm text-gray-500">{position.currency.symbol}</p>
                  </div>
                </div>

                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                  {position.apy.formatted}% APY
                </div>
              </div>

              {/* Market Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Market</p>
                <p className="text-sm font-medium text-gray-900">{position.market.name}</p>
              </div>

              {/* Balance Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Supplied Amount</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(position.balance.amount.value)}
                    </span>
                    <span className="text-sm text-gray-500">{position.currency.symbol}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">USD Value</p>
                  <p className="text-xl font-bold text-green-600">{formatUSD(position.balance.usd)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
