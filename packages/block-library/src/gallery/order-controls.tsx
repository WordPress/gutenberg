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
	/**
	 * Called with `{ orderby, order }` to update the query. Choosing an order
	 * also turns "Random" off; the handler owns that so both writes land in one
	 * undo level.
	 */
	onChange: ( order: Order ) => void;
	/** Called to set the `randomOrder` attribute. */
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
	/**
	 * Called with `{ orderby, order }` to sort the images. Sorting also turns
	 * "Random" off; the handler owns that so both writes land in one undo level.
	 */
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
 * none of them. "Custom" means the order arranged in the editor, and is
 * choosable only while "Random" is on: picking it turns "Random" off without
 * reordering anything.
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
		// Choosing Custom only turns Random off, so it's only choosable while
		// Random is on; otherwise it's a read-only status for a hand-arranged
		// order. It stays in the list either way so the options never shift.
		{ label: __( 'Custom' ), value: CUSTOM_ORDER, disabled: ! isRandom },
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
				if ( nextValue === CUSTOM_ORDER ) {
					// Custom means the editor order, so this only turns
					// Random off (the option is disabled when it's off).
					onRandomChange( false );
					return;
				}
				onSort( parseOrderValue( nextValue ) );
			} }
		/>
	);
}
