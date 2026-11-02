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
 * The part of the field the control reads. The control passes its props on
 * to the media control of `@wordpress/media-utils`, whose props type is
 * private, as the control is, so it is not typed with the
 * `DataFormControlProps` of `@wordpress/dataviews`.
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
