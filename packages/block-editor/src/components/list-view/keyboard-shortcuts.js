/**
 * WordPress dependencies
 */
import { KeyboardShortcuts as BindKeyboardShortcuts } from '@wordpress/components';
import { modifiers, isAppleOS } from '@wordpress/keycodes';

const access = modifiers.access( isAppleOS ).join( '+' );

/**
 * @param {Object}                     props
 * @param {import('react').ReactNode}  props.children
 * @param {(clientId: string) => void} props.removeRow
 */
function KeyboardShortcuts( { removeRow, children } ) {
	return (
		<BindKeyboardShortcuts
			shortcuts={ {
				[ `${ access }+z` ]: ( event ) => {
					const row = event.target.closest( '[role=row]' );
					if ( ! row ) return;
					const clientId = row.dataset.block;
					if ( clientId ) {
						removeRow( clientId );
					}
				},
			} }
		>
			{ children }
		</BindKeyboardShortcuts>
	);
}

export default KeyboardShortcuts;
