import { __ } from '@wordpress/i18n';
import { SelectControl as WCSelectControl } from '@wordpress/components';
import {
	ORDER_OPTIONS,
	RANDOM_OPTION,
	RANDOM_ORDER,
	parseOrderValue,
	toOrderValue,
} from './order-options';
import type { Order } from './order-options';

// Both controls below are a single "Order by" `SelectControl`, mirroring the
// Query Loop block's `OrderControl`. They differ in what choosing an option
// *means*, not in how they look.

/**
 * Help text for the control while "Random" is selected. It's the one order the
 * editor can't show (the shuffle happens on the front end), so say so; the
 * other orders are self-evident from the canvas and get no help.
 */
function getOrderHelp( isRandom: boolean ): string | undefined {
	return isRandom
		? __( 'Images are shown in a random order each time the page loads.' )
		: undefined;
}

const SOURCE_ORDER_OPTIONS = [ ...ORDER_OPTIONS, RANDOM_OPTION ];

type SourceOrderControlProps = {
	/** The stored query order. */
	order: Order;
	/** Whether the gallery's `randomOrder` attribute is set. */
	isRandom: boolean;
	/** Called with `{ orderby, order }` to update the query. */
	onChange: ( order: Order ) => void;
	/** Called to set or clear the `randomOrder` attribute. */
	onRandomChange: ( isRandom: boolean ) => void;
};

/**
 * Ordering control for a dynamic gallery, shown in the Settings panel. The
 * chosen order is a *setting*: it's stored in the source's query and re-applied
 * every time the source resolves. "Random" is stored separately (the
 * `randomOrder` attribute) and overrides the query order on the front end, so
 * while it's set the control shows it instead of the query order.
 */
export function SourceOrderControl( {
	order,
	isRandom,
	onChange,
	onRandomChange,
}: SourceOrderControlProps ) {
	return (
		<WCSelectControl
			label={ __( 'Order by' ) }
			value={ isRandom ? RANDOM_ORDER : toOrderValue( order ) }
			options={ SOURCE_ORDER_OPTIONS }
			help={ getOrderHelp( isRandom ) }
			onChange={ ( value ) => {
				if ( value === RANDOM_ORDER ) {
					onRandomChange( true );
					return;
				}
				if ( isRandom ) {
					onRandomChange( false );
				}
				onChange( parseOrderValue( value ) );
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
		value = toOrderValue( currentOrder );
	}

	return (
		<WCSelectControl
			label={ __( 'Order by' ) }
			value={ value }
			options={ options }
			help={ getOrderHelp( isRandom ) }
			onChange={ ( nextValue ) => {
				if ( nextValue === RANDOM_ORDER ) {
					onRandomChange( true );
					return;
				}
				if ( isRandom ) {
					onRandomChange( false );
				}
				if ( nextValue !== CUSTOM_ORDER ) {
					onSort( parseOrderValue( nextValue ) );
				}
			} }
		/>
	);
}
