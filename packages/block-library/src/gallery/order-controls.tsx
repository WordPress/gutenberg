import type { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { SelectControl as WCSelectControl } from '@wordpress/components';
import { ORDER_OPTIONS } from './order-options';
import type { Order } from './order-options';

type OrderSelectProps = {
	/** Composite `"orderby/order"` value to display. */
	value: string;
	/** Select options. */
	options: NonNullable<
		React.ComponentProps< typeof WCSelectControl >[ 'options' ]
	>;
	/** Called with `{ orderby, order }` when an order is chosen. */
	onChange: ( order: Order ) => void;
	className?: string;
	disabled?: boolean;
	help?: ReactNode;
};

/**
 * The "Order by" select shared by both gallery modes, mirroring the Query Loop
 * block's `OrderControl`: a single `SelectControl` whose value composites
 * `orderby` and `order`, split apart again on change. It only knows how to
 * present an order; what choosing one *means* belongs to the two wrappers
 * below, which differ in kind rather than in look.
 */
function OrderSelect( {
	value,
	options,
	onChange,
	className,
	disabled,
	help,
}: OrderSelectProps ) {
	return (
		<WCSelectControl
			className={ className }
			label={ __( 'Order by' ) }
			value={ value }
			options={ options }
			disabled={ disabled }
			help={ help }
			onChange={ ( nextValue ) => {
				const [ orderby, order ] = nextValue.split( '/' );
				onChange( { orderby, order } );
			} }
		/>
	);
}

type SourceOrderControlProps = {
	/** Stored `orderby` value. */
	orderby: string;
	/** Stored `order` value (`asc`/`desc`). */
	order: string;
	/** Called with `{ orderby, order }` to update the query. */
	onChange: ( order: Order ) => void;
};

/**
 * Ordering control for a dynamic gallery, shown in the Source panel. The
 * chosen order is a *setting*: it's stored in the source's query and re-applied
 * every time the source resolves.
 */
export function SourceOrderControl( {
	orderby,
	order,
	onChange,
}: SourceOrderControlProps ) {
	return (
		<OrderSelect
			value={ `${ orderby }/${ order }` }
			options={ ORDER_OPTIONS }
			onChange={ onChange }
		/>
	);
}

const CUSTOM_ORDER = 'custom';

/**
 * Options for `SortImagesControl`: the shared orders plus a "Custom" entry the
 * select displays when the images are in none of them. It's disabled because it
 * isn't an order to apply — the user gets there by dragging images — so it only
 * ever reflects state.
 */
const SORT_IMAGES_OPTIONS = [
	{ label: __( 'Custom' ), value: CUSTOM_ORDER, disabled: true },
	...ORDER_OPTIONS,
];

type SortImagesControlProps = {
	/** The detected `{ orderby, order }`, or `null` for a custom order. */
	currentOrder: Order | null;
	/** Whether sorting is unavailable (e.g. media still resolving). */
	disabled: boolean;
	/** Called with `{ orderby, order }` to sort the images. */
	onSort: ( order: Order ) => void;
};

/**
 * Ordering control for a static gallery, shown in the Settings panel below
 * "Randomize order". Choosing an order is a one-off *action*: it reorders the
 * inner image blocks once, and the user can drag them into any other order
 * afterwards. Nothing is stored, so the displayed value is derived from the
 * order the images are currently in, or "Custom" when that matches none of the
 * options.
 */
export function SortImagesControl( {
	currentOrder,
	disabled,
	onSort,
}: SortImagesControlProps ) {
	return (
		<OrderSelect
			className="wp-block-gallery__sort-images"
			value={
				currentOrder
					? `${ currentOrder.orderby }/${ currentOrder.order }`
					: CUSTOM_ORDER
			}
			options={ SORT_IMAGES_OPTIONS }
			disabled={ disabled }
			help={ __(
				'Sorts the images now. You can still drag them into a different order.'
			) }
			onChange={ onSort }
		/>
	);
}
