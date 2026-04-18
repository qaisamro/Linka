const state = {
  requestsTotal: 0,
  errors5xx: 0,
  startedAt: Date.now(),
};

function requestMetricsMiddleware(req, res, next) {
  state.requestsTotal += 1;
  res.on('finish', () => {
    if (res.statusCode >= 500) state.errors5xx += 1;
  });
  next();
}

function getRequestMetrics() {
  const uptimeMs = Date.now() - state.startedAt;
  return {
    requestsTotal: state.requestsTotal,
    errors5xx: state.errors5xx,
    uptimeSeconds: Math.floor(uptimeMs / 1000),
    requestsPerMinute: uptimeMs > 0
      ? Math.round((state.requestsTotal / uptimeMs) * 60000 * 100) / 100
      : 0,
  };
}

module.exports = { requestMetricsMiddleware, getRequestMetrics };
