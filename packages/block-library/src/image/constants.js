export const MIN_SIZE = 20;
export const LINK_DESTINATION_NONE = 'none';
export const LINK_DESTINATION_MEDIA = 'media';
export const LINK_DESTINATION_ATTACHMENT = 'attachment';
export const LINK_DESTINATION_CUSTOM = 'custom';
export const NEW_TAB_REL = [ 'noopener' ];
export const ALLOWED_MEDIA_TYPES = [ 'image' ];
export const MEDIA_ID_NO_FEATURED_IMAGE_SET = 0;
export const SIZED_LAYOUTS = [ 'flex', 'grid' ];
export const DEFAULT_MEDIA_SIZE_SLUG = 'full';

/**
 * Delay in milliseconds before preloading an image after hovering.
 * This prevents unnecessary preloading during quick scrolling or mouse movements.
 */
export const IMAGE_PRELOAD_DELAY = 200;

/**
 * Viewport height, in pixels, at or below which the lightbox treats the screen
 * as short. In practice this is a phone held in landscape; tablets and desktops
 * in either orientation stay above it.
 */
export const LIGHTBOX_SHORT_VIEWPORT_HEIGHT = 500;

/**
 * Vertical space, in pixels, reserved on a short viewport. The close and
 * navigation buttons paint above the image, so this is breathing room rather
 * than full clearance for them. Reserving the full amount would leave a phone
 * in landscape less room for the image than the same phone has in portrait.
 */
export const LIGHTBOX_SHORT_VIEWPORT_PADDING = 48;
