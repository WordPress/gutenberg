/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useState, useRef } from '@wordpress/element';
import { createHigherOrderComponent, useKeyboardShortcut } from '@wordpress/compose';
import { rawShortcut } from '@wordpress/keycodes';

const defaultShortcuts = {
	previous: [ 'ctrl+shift+`', rawShortcut.access( 'p' ) ],
	next: [ 'ctrl+`', rawShortcut.access( 'n' ) ],
};

export default createHigherOrderComponent(
	( WrappedComponent ) => {
		return ( { shortcuts = defaultShortcuts, ...props } ) => {
			const container = useRef();
			const [ isFocusingRegions, setIsFocusingRegions ] = useState( false );
			const className = classnames( 'components-navigate-regions', {
				'is-focusing-regions': isFocusingRegions,
			} );

			function focusRegion( offset ) {
				const regions = Array.from( container.current.querySelectorAll( '[role="region"]' ) );
				if ( ! regions.length ) {
					return;
				}
				let nextRegion = regions[ 0 ];
				const selectedIndex = regions.indexOf( document.activeElement );
				if ( selectedIndex !== -1 ) {
					let nextIndex = selectedIndex + offset;
					nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
					nextIndex = nextIndex === regions.length ? 0 : nextIndex;
					nextRegion = regions[ nextIndex ];
				}

				nextRegion.focus();
				setIsFocusingRegions( true );
			}
			const focusPrevious = useCallback( () => focusRegion( -1 ), [ container ] );
			const focusNext = useCallback( () => focusRegion( 1 ), [ container ] );

			useKeyboardShortcut( shortcuts.previous, focusPrevious, { bindGlobal: true } );
			useKeyboardShortcut( shortcuts.next, focusNext, { bindGlobal: true } );

			// Disable reason: Clicking the editor should dismiss the regions focus style
			/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
			return (
				<div
					ref={ container }
					className={ className }
					onClick={ () => setIsFocusingRegions( false ) }
				>
					<WrappedComponent { ...props } />
				</div>
			);
			/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
		};
	}, 'navigateRegions'
);
