/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const noop = () => {};

/**
 * Context for coordinating selection state between the editor and block sync.
 *
 * - `getSelection`: Stable getter that reads selection from entity edits imperatively.
 *                   Using a getter instead of a value avoids re-rendering the entire
 *                   block editor tree on every keystroke.
 * - `onChangeSelection`: Callback to report selection changes with external IDs back to the entity.
 */
export const SelectionContext = createContext( {
	getSelection: () => undefined,
	onChangeSelection: noop,
} );
