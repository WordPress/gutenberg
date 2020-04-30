/**
 * WordPress dependencies
 */
import { NavigableMenu, Toolbar } from '@wordpress/components';
import {
	useState,
	useRef,
	useLayoutEffect,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

function useIsAccessibleToolbar( ref ) {
	// By default, it's gonna render NavigableMenu. If all the tabbable elements
	// inside the toolbar are ToolbarItem components (or derived components like
	// ToolbarButton), then we can wrap them with the accessible Toolbar
	// component.
	const [ isAccessibleToolbar, setIsAccessibleToolbar ] = useState( false );
	useLayoutEffect( () => {
		const tabbables = focus.tabbable.find( ref.current );
		const notToolbarItem = tabbables.some(
			( tabbable ) => ! ( 'experimentalToolbarItem' in tabbable.dataset )
		);
		if ( ! notToolbarItem ) {
			setIsAccessibleToolbar( true );
		}
	} );
	return isAccessibleToolbar;
}

function useToolbarFocus( ref, focusOnMount, isAccessibleToolbar ) {
	// Make sure we don't use modified versions of this prop
	const [ initialFocusOnMount ] = useState( focusOnMount );

	const focusToolbar = useCallback( () => {
		const tabbables = focus.tabbable.find( ref.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}, [] );

	useShortcut( 'core/block-editor/focus-toolbar', focusToolbar, {
		bindGlobal: true,
		eventName: 'keydown',
	} );

	useEffect( () => {
		if ( initialFocusOnMount ) {
			focusToolbar();
		}
	}, [ isAccessibleToolbar, initialFocusOnMount, focusToolbar ] );
}

function NavigableToolbar( { children, focusOnMount, ...props } ) {
	const wrapper = useRef();
	const isAccessibleToolbar = useIsAccessibleToolbar( wrapper );

	useToolbarFocus( wrapper, focusOnMount, isAccessibleToolbar );

	if ( isAccessibleToolbar ) {
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
