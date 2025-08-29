const formatAddress = (address: string): string => {
  if ((address?.length ?? 0) < 6) {
    return address;
  }

  // Get first six
  const first = address.slice(0, 6);
  const last = address.slice(-4);
  const formattedAddress = `${first}...${last}`;
  return formattedAddress;
};

export default formatAddress;
