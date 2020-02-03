/**
 * WordPress dependencies
 */
import { NavigableMenu, Toolbar } from '@wordpress/components';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

function useShouldDisplayAccessibleToolbar( ref ) {
	const [ shouldDisplayAccessibleToolbar, setShouldDisplayAccessibleToolbar ] = useState( false );
	useEffect( () => {
		const wrapper = ref.current;
		window.requestAnimationFrame( () => {
			const focusables = focus.focusable.find( wrapper );
			const notToolbarItem = focusables.find(
				( focusable ) => ! ( 'experimentalToolbarItem' in focusable.dataset )
			);
			if ( ! notToolbarItem ) {
				setShouldDisplayAccessibleToolbar( true );
			}
		} );
	} );
	return shouldDisplayAccessibleToolbar;
}

function NavigableToolbar( { children, focusOnMount, ...props } ) {
	const wrapper = useRef();
	const shouldDisplayAccessibleToolbar = useShouldDisplayAccessibleToolbar( wrapper );

	const focusToolbar = useCallback( () => {
		const tabbables = focus.tabbable.find( wrapper.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}, [] );
	useShortcut( 'core/block-editor/focus-toolbar', focusToolbar, {
		bindGlobal: true,
		eventName: 'keydown',
	} );
	useEffect( () => {
		if ( focusOnMount ) {
			focusToolbar();
		}
	}, [] );

	if ( shouldDisplayAccessibleToolbar ) {
		return (
			<Toolbar
				__experimentalAccessibilityLabel={ props[ 'aria-label' ] }
				ref={ wrapper }
				{ ...props }
			>
				{ children }
			</Toolbar>
		);
	}

	return (
		<NavigableMenu
			orientation="horizontal"
			role="toolbar"
			ref={ wrapper }
			{ ...props }
		>
			{ children }
		</NavigableMenu>
	);
}

export default NavigableToolbar;
