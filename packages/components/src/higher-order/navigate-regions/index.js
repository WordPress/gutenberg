/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
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
	const [ isFocusingRegions, setIsFocusingRegions ] = useState( false );

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
		setIsFocusingRegions( true );
	}
	const focusPrevious = () => focusRegion( -1 );
	const focusNext = () => focusRegion( 1 );

	useKeyboardShortcut( shortcuts.previous, focusPrevious, {
		bindGlobal: true,
	} );
	useKeyboardShortcut( shortcuts.next, focusNext, { bindGlobal: true } );

	useEffect( () => {
		function onClick() {
			setIsFocusingRegions( false );
		}

		ref.current.addEventListener( 'click', onClick );

		return () => {
			ref.current.removeEventListener( 'click', onClick );
		};
	}, [ setIsFocusingRegions ] );

	if ( ! isFocusingRegions ) {
		return;
	}

	return 'is-focusing-regions';
}

export default createHigherOrderComponent(
	( Component ) => ( { shortcuts, ...props } ) => {
		const ref = useRef();
		const className = useNavigateRegions( ref, shortcuts );
		return (
			<div ref={ ref } className={ className }>
				<Component { ...props } />
			</div>
		);
	},
	'navigateRegions'
);
