/**
 * The media the REST API embeds for the featured image of a post.
 */
interface FeaturedMedia {
	source_url?: string;
	media_details?: {
		sizes?: Record< string, { width?: number; source_url?: string } >;
	};
}

/**
 * The properties of a post the featured image field reads.
 */
export interface PostWithFeaturedMedia {
	id: number | string;
	type: string;
	featured_media?: number;
	_embedded?: {
		'wp:featuredmedia'?: FeaturedMedia[];
	};
}
