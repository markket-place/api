# Upgrading

Documentation of changes that break backwards compatibility and require code changes

# 0.x.0 to 0.8.0

V0.8.0 introduces normalization of attribute names from PascalCase to camelCase in schemas. Existing clients need to update attribute names:

## Product Schema Changes
- `Name` → `name`
- `Description` → `description`
- `SKU` → `sku`
- `Thumbnail` → `thumbnail`
- `Slides` → `slides`
- `SEO` → `seo`
- `Tag` → `tag`
- `PRICES` → `prices`

## Order Schema Changes
- `Amount` → `amount`
- `Currency` → `currency`
- `Status` → `status`
- `Details` → `details`
- `Shipping_Address` → `shippingAddress`
- `Payment_attempts` → `paymentAttempts`

## Page Schema Changes
- `Title` → `title`
- `Content` → `content`
- `Active` → `active`
- `SEO` → `seo`

## Inbox Schema Changes
- `Name` → `name`
- `Message` → `message`
- `Archived` → `archived`
- `Direction` → `direction`
- `ThreadKey` → `threadKey`
- `RoutingKey` → `routingKey`
- `FromAddress` → `fromAddress`
- `ToAddress` → `toAddress`
- `MessageId` → `messageId`
- `BodyHtml` → `bodyHtml`
- `Metadata` → `metadata`
- `Estado` → `estado`

## Album Schema Changes
- `SEO` → `seo`
- `ReleaseDate` → `releaseDate`
- `CoverArt` → `coverArt`

## Track Schema Changes
- `TrackNumber` → `trackNumber`
- `Duration` → `duration`
- `AudioFile` → `audioFile`

## User Schema Changes
- `FirstName` → `firstName`
- `LastName` → `lastName`
- `ProfilePicture` → `profilePicture`

## Store Schema Changes
- `StoreName` → `storeName`
- `ContactEmail` → `contactEmail`
- `StoreLogo` → `storeLogo`

## Category Schema Changes
- `CategoryName` → `categoryName`
- `ParentCategory` → `parentCategory`

## Review Schema Changes
- `RatingValue` → `ratingValue`
- `ReviewText` → `reviewText`

Note: When updating documents via Strapi API, don't wrap attributes in `data` object - pass them directly.

