// These embeds do not work in sandboxes due to the iframe's security restrictions.
export const HOSTS_NO_PREVIEWS = [ 'facebook.com', 'smugmug.com' ];

export const ASPECT_RATIOS = [
	// Common video resolutions.
	{ ratio: '2.33', className: 'wp-embed-aspect-21-9' },
	{ ratio: '2.00', className: 'wp-embed-aspect-18-9' },
	{ ratio: '1.78', className: 'wp-embed-aspect-16-9' },
	{ ratio: '1.33', className: 'wp-embed-aspect-4-3' },
	// Vertical video and instagram square video support.
	{ ratio: '1.00', className: 'wp-embed-aspect-1-1' },
	{ ratio: '0.56', className: 'wp-embed-aspect-9-16' },
	{ ratio: '0.50', className: 'wp-embed-aspect-1-2' },
];

export const DEFAULT_EMBED_BLOCK = 'core/embed';
export const WORDPRESS_EMBED_BLOCK = 'core-embed/wordpress';
