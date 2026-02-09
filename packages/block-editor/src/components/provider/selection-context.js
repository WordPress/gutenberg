/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const noop = () => {};

/**
 * Context for coordinating selection state between the editor and block sync.
 *
 * - `selection`: External (original) clientId selection from entity edits, for restoration.
 * - `onChangeSelection`: Callback to report selection changes with external IDs back to the entity.
 */
export const SelectionContext = createContext( {
	selection: undefined,
	onChangeSelection: noop,
} );
