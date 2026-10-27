import { startupStatus } from '../startup-status';

export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Health check endpoints for Laravel Cloud and general health checks
    const healthPaths = ['/', '/_health', '/health', '/healthz', '/up'];
    
    if (healthPaths.includes(ctx.path) && ctx.method === 'GET') {
      // Check our custom startup status first
      const isReady = startupStatus.isReady();
      const uptimeInfo = startupStatus.getStatus();
      
      if (isReady) {
        ctx.status = 200;
        ctx.body = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'strapi',
          version: strapi?.config?.get('info.version') || 'unknown',
          uptime: process.uptime(),
          ready: true
        };
      } else {
        // During startup, we still respond with a healthy status to prevent restart loops
        // But indicate that we're still initializing
        ctx.status = 200;
        ctx.body = {
          status: 'starting',
          timestamp: new Date().toISOString(),
          service: 'strapi',
          uptime: uptimeInfo.uptime,
          ready: false,
          note: 'Application is starting up, please wait'
        };
      }
      return;
    }

    await next();
  };
};