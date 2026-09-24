import { __ } from '@wordpress/i18n';

/**
 * An ordering of gallery images: the field to order by and the direction.
 */
export type Order = {
	orderby: string;
	order: string;
};

/**
 * The composite `"orderby/order"` select value for an order. A select needs one
 * string per option, so this format exists only at the select boundary; the
 * rest of the feature passes `Order` objects.
 *
 * @param order The order.
 * @return The select value.
 */
export function toOrderValue( order: Order ): string {
	return `${ order.orderby }/${ order.order }`;
}

/**
 * Parses a composite `"orderby/order"` select value back into an order.
 *
 * @param value The select value.
 * @return The order.
 */
export function parseOrderValue( value: string ): Order {
	const [ orderby, order ] = value.split( '/' );
	return { orderby, order };
}

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

/**
 * The "Random" order. Unlike the orders above it isn't an `orderby`: it is the
 * gallery's `randomOrder` attribute, applied only on the front end by shuffling
 * the rendered images (see `index.php`), so the editor keeps showing the
 * underlying order. Offered as the last option of both modes' "Order by"
 * control, since it overrides whatever other order is in place.
 */
export const RANDOM_ORDER = 'random';
export const RANDOM_OPTION = { label: __( 'Random' ), value: RANDOM_ORDER };
