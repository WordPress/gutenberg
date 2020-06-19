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
import deprecated from '@wordpress/deprecated';
import { focus } from '@wordpress/dom';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

function useUpdateLayoutEffect( effect, deps ) {
	const mounted = useRef( false );
	useLayoutEffect( () => {
		if ( mounted.current ) {
			return effect();
		}
		mounted.current = true;
	}, deps );
}

function hasOnlyToolbarItem( elements ) {
	const dataProp = 'experimentalToolbarItem';
	return ! elements.some( ( element ) => ! ( dataProp in element.dataset ) );
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
		const onlyToolbarItem = hasOnlyToolbarItem( tabbables );
		if ( ! onlyToolbarItem ) {
			deprecated( 'Using custom components as toolbar controls', {
				alternative: 'ToolbarItem or ToolbarButton components',
			} );
		}
		setIsAccessibleToolbar( onlyToolbarItem );
	}, [] );

	useLayoutEffect( determineIsAccessibleToolbar, [] );

	useUpdateLayoutEffect( () => {
		// Toolbar buttons may be rendered asynchronously, so we use
		// MutationObserver to check if the toolbar subtree has been modified
		const observer = new window.MutationObserver(
			determineIsAccessibleToolbar
		);
		observer.observe( ref.current, { childList: true, subtree: true } );
		return () => observer.disconnect();
	}, [ isAccessibleToolbar ] );

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
