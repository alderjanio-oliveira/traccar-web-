export const reconnectDelay = (attempt, random = Math.random()) => {
  const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
  return delay + random * delay * 0.2;
};

export const shouldReplacePosition = (previous, incoming) => {
  if (!previous) return true;
  const previousFix = Date.parse(previous.fixTime);
  const incomingFix = Date.parse(incoming.fixTime);
  if (Number.isFinite(previousFix) && Number.isFinite(incomingFix)) {
    if (incomingFix !== previousFix) return incomingFix > previousFix;
  }
  const previousReceived = Date.parse(previous.serverTime);
  const incomingReceived = Date.parse(incoming.serverTime);
  return !(
    Number.isFinite(previousReceived) &&
    Number.isFinite(incomingReceived) &&
    incomingReceived < previousReceived
  );
};
