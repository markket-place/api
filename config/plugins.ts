export default ({ env }) => ({
  // 'markketplace': {
  //   enabled: true,
  //   resolve: './src/plugins/markketplace'
  // },
  'get-strapi-schema': {
    enabled: true,
  },
  upload: {
    config: {
      sizeLimit: 10 * 1024 * 1024,
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: env('R2_PUBLIC_URL'),
        rootPath: env('R2_ROOT_PATH', 'uploads'),
        s3Options: {
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY_ID'),
            secretAccessKey: env('R2_ACCESS_SECRET'),
          },
          endpoint: env('R2_ENDPOINT'),
          region: 'auto',
          params: {
            Bucket: env('R2_BUCKET'),
            // Cloudflare R2 does not support ACLs.
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST'),
        port: env.int('SMTP_PORT', 465),
        secure: true,
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
       defaultFrom: env('SMTP_FROM_EMAIL', 'noreply@markket.place'),
       defaultReplyTo: env('SMTP_REPLY_TO_EMAIL', 'support@markket.place'),
      },
    },
  },
  healthcheck: {
    enabled: true,
    config: {
      server: {
        uptime: true,
        memory: true,
        version: true,
      },
      database: {
        client: true,
        connections: true,
        uptime: true,
        size: true,
        version: true,
      },
    },
  },
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '30d',
      },
    },
  },
});
