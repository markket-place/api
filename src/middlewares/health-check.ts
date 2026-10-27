export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Health check endpoints for Laravel Cloud
    const healthPaths = ['/', '/_health', '/health', '/healthz', '/up'];
    
    if (healthPaths.includes(ctx.path) && ctx.method === 'GET') {
      ctx.status = 200;
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'strapi',
        version: strapi.config.get('info.version') || 'unknown'
      };
      return;
    }

    await next();
  };
};