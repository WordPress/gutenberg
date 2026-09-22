import { __ } from '@wordpress/i18n';

/**
 * An ordering of gallery images: the field to order by and the direction.
 */
export type Order = {
	orderby: string;
	order: string;
};

/**
 * Ordering options offered for gallery images. Each value is a composite
 * `"orderby/order"` string. For a dynamic source these map to the matching
 * `/wp/v2/media` collection params; for a static gallery the same orders are
 * applied client-side to the inner image blocks (see `order-images.js`), so the
 * two modes offer an identical list. `menu_order` is deliberately omitted — it
 * isn't a valid REST `orderby` value, so the editor preview couldn't reproduce
 * it (see `dynamic-source.js`).
 */
export const ORDER_OPTIONS = [
	{ label: __( 'Newest to oldest' ), value: 'date/desc' },
	{ label: __( 'Oldest to newest' ), value: 'date/asc' },
	{
		/* translators: Label for ordering images by title in ascending order. */
		label: __( 'A → Z' ),
		value: 'title/asc',
	},
	{
		/* translators: Label for ordering images by title in descending order. */
		label: __( 'Z → A' ),
		value: 'title/desc',
	},
];
