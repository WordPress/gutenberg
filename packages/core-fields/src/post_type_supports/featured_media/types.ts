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

/**
 * The part of the field the control reads. `@wordpress/fields` types the
 * control with the `DataFormControlProps` of `@wordpress/dataviews`, which
 * this package does not depend on, and the props type of the media control
 * is private to `@wordpress/media-utils`, as the control is.
 */
export interface FeaturedMediaField {
	label: string;
	placeholder?: string;
	getValue: ( args: { item: PostWithFeaturedMedia } ) => number | undefined;
	setValue: ( args: {
		item: PostWithFeaturedMedia;
		value: number | undefined;
	} ) => Record< string, any >;
}
