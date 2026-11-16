/**
 * Tienda Content Type Registry
 * Maps content keys to their Strapi UIDs, store relations, and mutable fields.
 * Sourced from types/generated/contentTypes.d.ts for accuracy.
 */

export interface ContentTypeConfig {
  uid: string;
  storeField: string; // 'store' | 'stores'
  storeRelationType: 'manyToOne' | 'manyToMany' | 'oneToOne';
  mutableFields: string[];
  readOnlyFields?: string[]; // Fields that should not be updated
  titleField: string; // For SEO auto-fill
  contentField?: string; // For SEO description truncation
  hasDraftAndPublish: boolean;
  defaultPopulate: string[];
  autoSetCreator?: 'user' | 'Creator' | 'creator' | 'owner'; // Field name to auto-populate
  // Field type metadata for sanitization before update
  mediaFields?: string[];           // Single/multi media — strip to id only
  relationFields?: string[];        // Relation fields — convert populated objects to connect format
  componentFields?: string[];       // Repeatable components — strip id to avoid stale entry conflicts
  nestedMediaFields?: string[];     // Dot-path media inside components, e.g. 'seo.socialImage' — strip to id only
}

export const CONTENT_TYPES: Record<string, ContentTypeConfig> = {
  article: {
    uid: 'api::article.article',
    storeField: 'store',
    storeRelationType: 'manyToOne',
    titleField: 'title',
    contentField: 'content',
    hasDraftAndPublish: true,
    mutableFields: ['title', 'slug', 'content', 'cover', 'tags', 'seo', 'category', 'description', 'keywords'],
    readOnlyFields: ['creator'],
    autoSetCreator: 'creator',
    defaultPopulate: ['cover', 'tags', 'seo', 'seo.socialImage', 'category', 'creator', 'store'],
    mediaFields: ['cover'],
    relationFields: ['category'],
    componentFields: ['tags'],
    nestedMediaFields: ['seo.socialImage'],
  },
  page: {
    uid: 'api::page.page',
    storeField: 'store',
    storeRelationType: 'manyToOne',
    titleField: 'title',
    contentField: 'content',
    hasDraftAndPublish: true,
    mutableFields: ['title', 'slug', 'content', 'active', 'menuOrder', 'seo', 'albums', 'description', 'keywords'],
    autoSetCreator: 'owner',
    defaultPopulate: ['seo', 'seo.socialImage', 'albums', 'creator', 'owner', 'store'],
    relationFields: ['albums'],
    nestedMediaFields: ['seo.socialImage'],
  },
  album: {
    uid: 'api::album.album',
    storeField: 'store',
    storeRelationType: 'manyToOne',
    titleField: 'title',
    contentField: 'description',
    hasDraftAndPublish: true,
    mutableFields: ['title', 'slug', 'description', 'content', 'seo', 'cover', 'tracks', 'keywords'],
    autoSetCreator: 'owner',
    defaultPopulate: ['cover', 'seo', 'seo.socialImage', 'tracks', 'owner', 'store'],
    nestedMediaFields: ['seo.socialImage'],
  },
  track: {
    uid: 'api::album.track',
    storeField: 'store',
    storeRelationType: 'manyToOne',
    titleField: 'title',
    contentField: 'description',
    hasDraftAndPublish: true,
    mutableFields: ['title', 'slug', 'description', 'content', 'seo', 'media', 'urls', 'keywords'],
    autoSetCreator: 'owner',
    defaultPopulate: ['media', 'seo', 'seo.socialImage', 'urls', 'owner', 'store'],
    nestedMediaFields: ['seo.socialImage'],
  },
  category: {
    uid: 'api::category.category',
    storeField: 'store',
    storeRelationType: 'manyToOne',
    titleField: 'Name',
    contentField: 'Description',
    hasDraftAndPublish: true,
    mutableFields: ['name', 'slug', 'description', 'seo', 'active', 'keywords'],
    autoSetCreator: 'owner',
    defaultPopulate: ['seo', 'seo.socialImage', 'articles', 'owner', 'store'],
    nestedMediaFields: ['seo.socialImage'],
  },
  product: {
    uid: 'api::product.product',
    storeField: 'stores',
    storeRelationType: 'manyToMany',
    titleField: 'name',
    contentField: 'description',
    hasDraftAndPublish: true,
    mutableFields: [
      'name', 'description', 'attributes', 'usd_price', 'quantity', 'active',
      'thumbnail', 'slides', 'seo', 'tag', 'prices', 'keywords', 'description'
    ],
    readOnlyFields: ['sku', 'slug'], // SKU is auto-synced with Stripe, slug is UID field
    autoSetCreator: 'creator',
    defaultPopulate: ['thumbnail', 'slides', 'seo', 'seo.socialImage', 'tag', 'prices', 'stores', 'creator'],
    mediaFields: ['thumbnail', 'slides'],
    componentFields: ['tag', 'prices'],
    nestedMediaFields: ['seo.socialImage'],
  },
  event: {
    uid: 'api::event.event',
    storeField: 'stores',
    storeRelationType: 'manyToMany',
    titleField: 'name',
    contentField: 'description',
    hasDraftAndPublish: true,
    mutableFields: [
      'name', 'description', 'usd_price', 'startDate', 'endDate', 'maxCapacity',
      'active', 'thumbnail', 'slides', 'seo', 'tag', 'prices', 'keywords', 'description', 'timezone', 'locations'
    ],
    readOnlyFields: ['stripe_product_id', 'slug', 'amountSold'],
    autoSetCreator: 'creator',
    defaultPopulate: ['thumbnail', 'slides', 'seo', 'seo.socialImage', 'tag', 'prices', 'stores', 'creator', 'locations'],
    mediaFields: ['thumbnail', 'slides'],
    componentFields: ['tag', 'prices', 'locations'],
    nestedMediaFields: ['seo.socialImage'],
  },
  shortner: {
    uid: 'api::shortner.shortner',
    storeField: 'store',
    storeRelationType: 'manyToOne',
    titleField: 'title',
    contentField: 'description',
    hasDraftAndPublish: false,
    mutableFields: ['title', 'url', 'description', 'image', 'keywords'],
    readOnlyFields: ['alias', 'visit'], // Alias is unique and immutable; visits are read-only
    autoSetCreator: 'user',
    defaultPopulate: ['image', 'store', 'user'],
  },
};

/**
 * Resolve content type config by key
 * Throws 400 if type not found
 */
export function resolveContentType(key: string): ContentTypeConfig {
  const config = CONTENT_TYPES[key];
  if (!config) {
    throw new Error(`Unknown content type: ${key}`);
  }
  return config;
}

/**
 * Get all metadata fields (should not expose to frontend)
 * Note: views/analytics fields will be added in Phase 2 with schema updates
 */
export const METADATA_FIELDS = {
  description: 'description', // short text for search
  keywords: 'keywords', // comma-separated or array of tags
  createdBy: 'createdBy', // user.id reference
  // Phase 2: views, lastViewedAt, analytics tracking
};

/**
 * Rate limit config
 */
export const RATE_LIMIT_CONFIG = {
  creatPerMin: 60, // Max creates per minute per store
  updatesPerMin: 120, // Max updates per minute per store
  deletesPerMin: 10, // Max deletes per minute per store
};
