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

function hasOnlyToolbarItem( elements ) {
	const dataProp = 'experimentalToolbarItem';
	return ! elements.some( ( element ) => ! ( dataProp in element.dataset ) );
}

function applyOnNextRepaint( callback ) {
	const id = window.requestAnimationFrame( callback );
	return () => window.cancelAnimationFrame( id );
}

function focusFirstTabbableIn( container ) {
	const [ firstTabbable ] = focus.tabbable.find( container );
	if ( firstTabbable ) {
		firstTabbable.focus();
	}
}

function useIsAccessibleToolbar( ref ) {
	// By default, it's gonna render NavigableMenu. If all the tabbable elements
	// inside the toolbar are ToolbarItem components (or derived components like
	// ToolbarButton), then we can wrap them with the accessible Toolbar
	// component.
	const [ isAccessibleToolbar, setIsAccessibleToolbar ] = useState( false );

	const determineIsAccessibleToolbar = useCallback( () => {
		const tabbables = focus.tabbable.find( ref.current );
		setIsAccessibleToolbar( hasOnlyToolbarItem( tabbables ) );
	}, [] );

	useLayoutEffect( () => {
		determineIsAccessibleToolbar();
		// We do an additional check on re-paint because some custom block toolbar
		// buttons aren't there in the first paint.
		return applyOnNextRepaint( determineIsAccessibleToolbar );
	}, [] );

	return isAccessibleToolbar;
}

function useToolbarFocus( ref, focusOnMount, isAccessibleToolbar ) {
	// Make sure we don't use modified versions of this prop
	const [ initialFocusOnMount ] = useState( focusOnMount );

	const focusToolbar = useCallback( () => {
		focusFirstTabbableIn( ref.current );
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
