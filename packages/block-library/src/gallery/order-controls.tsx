import { __ } from '@wordpress/i18n';
import { SelectControl as WCSelectControl } from '@wordpress/components';
import { ORDER_OPTIONS, RANDOM_OPTION, RANDOM_ORDER } from './order-options';
import type { Order } from './order-options';

type OrderSelectProps = {
	/** The select value: a composite `"orderby/order"`, or a special value. */
	value: string;
	/** Select options. */
	options: NonNullable<
		React.ComponentProps< typeof WCSelectControl >[ 'options' ]
	>;
	/** Called with the raw select value when an option is chosen. */
	onChange: ( value: string ) => void;
	help?: string;
};

/**
 * The "Order by" select shared by both gallery modes, mirroring the Query Loop
 * block's `OrderControl`. It only knows how to present the options; what
 * choosing one *means* belongs to the two wrappers below, which differ in kind
 * rather than in look.
 */
function OrderSelect( { value, options, onChange, help }: OrderSelectProps ) {
	return (
		<WCSelectControl
			label={ __( 'Order by' ) }
			value={ value }
			options={ options }
			help={ help }
			onChange={ onChange }
		/>
	);
}

/**
 * Splits a composite `"orderby/order"` select value.
 */
function toOrder( value: string ): Order {
	const [ orderby, order ] = value.split( '/' );
	return { orderby, order };
}

const SOURCE_ORDER_OPTIONS = [ ...ORDER_OPTIONS, RANDOM_OPTION ];

type SourceOrderControlProps = {
	/** Stored `orderby` value. */
	orderby: string;
	/** Stored `order` value (`asc`/`desc`). */
	order: string;
	/** Whether the gallery's `randomOrder` attribute is set. */
	isRandom: boolean;
	/** Called with `{ orderby, order }` to update the query. */
	onChange: ( order: Order ) => void;
	/** Called to set or clear the `randomOrder` attribute. */
	onRandomChange: ( isRandom: boolean ) => void;
};

/**
 * Ordering control for a dynamic gallery, shown in the Source panel. The
 * chosen order is a *setting*: it's stored in the source's query and re-applied
 * every time the source resolves. "Random" is stored separately (the
 * `randomOrder` attribute) and overrides the query order on the front end, so
 * while it's set the control shows it instead of the query order.
 */
export function SourceOrderControl( {
	orderby,
	order,
	isRandom,
	onChange,
	onRandomChange,
}: SourceOrderControlProps ) {
	return (
		<OrderSelect
			value={ isRandom ? RANDOM_ORDER : `${ orderby }/${ order }` }
			options={ SOURCE_ORDER_OPTIONS }
			onChange={ ( value ) => {
				if ( value === RANDOM_ORDER ) {
					onRandomChange( true );
					return;
				}
				if ( isRandom ) {
					onRandomChange( false );
				}
				onChange( toOrder( value ) );
			} }
		/>
	);
}

const CUSTOM_ORDER = 'custom';

type SortImagesControlProps = {
	/** The detected `{ orderby, order }`, or `null` for a custom order. */
	currentOrder: Order | null;
	/** Whether the gallery's `randomOrder` attribute is set. */
	isRandom: boolean;
	/** Whether the sort orders can be applied (false while media resolves). */
	canSort: boolean;
	/** Called with `{ orderby, order }` to sort the images. */
	onSort: ( order: Order ) => void;
	/** Called to set or clear the `randomOrder` attribute. */
	onRandomChange: ( isRandom: boolean ) => void;
};

/**
 * Ordering control for a static gallery, shown in the Settings panel.
 *
 * The date and title orders are one-off *actions*: choosing one reorders the
 * inner image blocks once, and the user can drag them into any other order
 * afterwards. Nothing is stored for them, so the displayed value is derived
 * from the order the images are currently in, or "Custom" when that matches
 * none of them. "Custom" is also choosable: it means the order arranged in the
 * editor, so picking it turns "Random" off without reordering anything.
 *
 * "Random" is the one stored value (the `randomOrder` attribute). It applies
 * on the front end only, leaving the editor order as it is, and choosing any
 * other option clears it.
 */
export function SortImagesControl( {
	currentOrder,
	isRandom,
	canSort,
	onSort,
	onRandomChange,
}: SortImagesControlProps ) {
	const options = [
		{ label: __( 'Custom' ), value: CUSTOM_ORDER },
		...ORDER_OPTIONS.map( ( option ) => ( {
			...option,
			disabled: ! canSort,
		} ) ),
		RANDOM_OPTION,
	];

	let value = CUSTOM_ORDER;
	if ( isRandom ) {
		value = RANDOM_ORDER;
	} else if ( currentOrder ) {
		value = `${ currentOrder.orderby }/${ currentOrder.order }`;
	}

	return (
		<OrderSelect
			value={ value }
			options={ options }
			help={
				isRandom
					? __(
							'Images are shown in a random order each time the page loads.'
						)
					: __(
							'Sorts the images now. You can still drag them into a different order.'
						)
			}
			onChange={ ( nextValue ) => {
				if ( nextValue === RANDOM_ORDER ) {
					onRandomChange( true );
					return;
				}
				if ( isRandom ) {
					onRandomChange( false );
				}
				if ( nextValue !== CUSTOM_ORDER ) {
					onSort( toOrder( nextValue ) );
				}
			} }
		/>
	);
}
