/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import {
	createHigherOrderComponent,
	useKeyboardShortcut,
} from '@wordpress/compose';
import { rawShortcut } from '@wordpress/keycodes';

const defaultShortcuts = {
	previous: [ 'ctrl+shift+`', rawShortcut.access( 'p' ) ],
	next: [ 'ctrl+`', rawShortcut.access( 'n' ) ],
};

export function useNavigateRegions( ref, shortcuts = defaultShortcuts ) {
	function focusRegion( offset ) {
		const regions = Array.from(
			ref.current.querySelectorAll( '[role="region"]' )
		);
		if ( ! regions.length ) {
			return;
		}
		let nextRegion = regions[ 0 ];
		const selectedIndex = regions.indexOf(
			ref.current.ownerDocument.activeElement
		);
		if ( selectedIndex !== -1 ) {
			let nextIndex = selectedIndex + offset;
			nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
			nextIndex = nextIndex === regions.length ? 0 : nextIndex;
			nextRegion = regions[ nextIndex ];
		}

		nextRegion.focus();
	}
	const focusPrevious = useCallback( () => focusRegion( -1 ), [] );
	const focusNext = useCallback( () => focusRegion( 1 ), [] );

	useKeyboardShortcut( shortcuts.previous, focusPrevious, {
		bindGlobal: true,
	} );
	useKeyboardShortcut( shortcuts.next, focusNext, { bindGlobal: true } );
}

export default createHigherOrderComponent(
	( Component ) => ( { shortcuts, ...props } ) => {
		const ref = useRef();
		useNavigateRegions( ref, shortcuts );
		return (
			<div ref={ ref }>
				<Component { ...props } />
			</div>
		);
	},
	'navigateRegions'
);
