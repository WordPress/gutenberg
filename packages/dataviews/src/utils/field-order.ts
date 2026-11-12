import type { NormalizedField, View } from '../types';
import getHideableFields from './get-hideable-fields';

/**
 * Returns the ids of the fields the user can show or hide, in the order they
 * sit in the view, hidden ones included.
 *
 * `view.fields` only holds the visible fields, so on its own it can't say
 * where a hidden field belongs. `view.fieldOrder` remembers that. The two are
 * reconciled here:
 *
 * - Visible fields always follow `view.fields`, because the table header
 *   menus (Move left/right, Insert left/right) change that without touching
 *   `view.fieldOrder`.
 * - Hidden fields keep the place `view.fieldOrder` gives them.
 * - Anything `view.fieldOrder` doesn't mention yet (a view that predates it,
 *   or a field the consumer has just added) goes at the end: visible fields
 *   first, then hidden ones alphabetically.
 *
 * @param view   The current view.
 * @param fields The normalized fields.
 *
 * @return The ordered ids of the hideable fields.
 */
export function getFieldOrder< Item >(
	view: View,
	fields: NormalizedField< Item >[]
): string[] {
	const hideableIds = getHideableFields( view, fields ).map( ( f ) => f.id );
	const visibleIds = ( view.fields ?? [] ).filter( ( id ) =>
		hideableIds.includes( id )
	);

	const order = ( view.fieldOrder ?? [] ).filter(
		( id, index, all ) =>
			hideableIds.includes( id ) && all.indexOf( id ) === index
	);
	for ( const id of visibleIds ) {
		if ( ! order.includes( id ) ) {
			order.push( id );
		}
	}

	// Fill the visible slots in the order `view.fields` has them.
	const queue = [ ...visibleIds ];
	const reconciled = order.map( ( id ) =>
		visibleIds.includes( id ) ? ( queue.shift() as string ) : id
	);

	for ( const id of hideableIds ) {
		if ( ! reconciled.includes( id ) ) {
			reconciled.push( id );
		}
	}
	return reconciled;
}

/**
 * Returns the view with a new order and set of visible fields applied to
 * both `view.fields` and `view.fieldOrder`.
 *
 * Ids in `view.fields` that aren't in the order (fields that can't be hidden)
 * stay next to the field they followed before.
 *
 * @param view       The current view.
 * @param order      Every hideable field id, in its new order.
 * @param visibleIds The hideable field ids that should be visible.
 *
 * @return The updated view.
 */
export function applyFieldOrder(
	view: View,
	order: string[],
	visibleIds: string[]
): View {
	const following = new Map< string | null, string[] >();
	let previous: string | null = null;
	for ( const id of view.fields ?? [] ) {
		if ( order.includes( id ) ) {
			previous = id;
		} else {
			following.set( previous, [
				...( following.get( previous ) ?? [] ),
				id,
			] );
		}
	}

	const fields = [ ...( following.get( null ) ?? [] ) ];
	for ( const id of order ) {
		if ( visibleIds.includes( id ) ) {
			fields.push( id );
		}
		fields.push( ...( following.get( id ) ?? [] ) );
	}

	return { ...view, fields, fieldOrder: order };
}
