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
	/** Called when "Random" is chosen. */
	onSelectRandom: () => void;
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
	onSelectRandom,
}: SourceOrderControlProps ) {
	return (
		<WCSelectControl
			label={ __( 'Order by' ) }
			value={ isRandom ? RANDOM_ORDER : toOrderValue( order ) }
			options={ SOURCE_ORDER_OPTIONS }
			help={ getOrderHelp( isRandom ) }
			onChange={ ( value ) => {
				if ( value === RANDOM_ORDER ) {
					onSelectRandom();
					return;
				}
				onChange( parseOrderValue( value ) );
			} }
		/>
	);
}

const CUSTOM_ORDER = 'custom';

type SortImagesControlProps = {
	/** The last sort applied, while it still holds, or `null` for a custom order. */
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
	/** Called when "Custom" is chosen, which turns "Random" off. */
	onSelectCustom: () => void;
	/** Called when "Random" is chosen. */
	onSelectRandom: () => void;
};

/**
 * Ordering control for a static gallery, shown in the Settings panel.
 *
 * The date and title orders are one-off *actions*: choosing one reorders the
 * inner image blocks once, and the user can drag them into any other order
 * afterwards. Nothing is stored for them, so the caller passes back the last
 * sort it applied for as long as the images remain in that sequence, and
 * `null` ("Custom") otherwise. "Custom" means the order arranged in the
 * editor, and is choosable only while "Random" is on: picking it turns
 * "Random" off without reordering anything.
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
	onSelectCustom,
	onSelectRandom,
}: SortImagesControlProps ) {
	const options = [
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
					onSelectRandom();
					return;
				}
				if ( nextValue === CUSTOM_ORDER ) {
					onSelectCustom();
					return;
				}
				onSort( parseOrderValue( nextValue ) );
			} }
		/>
	);
}
