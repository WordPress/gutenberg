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

function hasOnlyToolbarItem( elements ) {
	const dataProp = 'toolbarItem';
	return ! elements.some( ( element ) => ! ( dataProp in element.dataset ) );
}

function focusFirstTabbableIn( container ) {
	const [ firstTabbable ] = focus.tabbable.find( container );
	if ( firstTabbable ) {
		firstTabbable.focus();
	}
}

function useIsAccessibleToolbar( ref ) {
	/*
	 * By default, we'll assume the starting accessible state of the Toolbar
	 * is true, as it seems to be the most common case.
	 *
	 * Transitioning from an (initial) false to true state causes the
	 * <Toolbar /> component to mount twice, which is causing undesired
	 * side-effects. These side-effects appear to only affect certain
	 * E2E tests.
	 *
	 * This was initial discovered in this pull-request:
	 * https://github.com/WordPress/gutenberg/pull/23425
	 */
	const initialAccessibleToolbarState = true;

	// By default, it's gonna render NavigableMenu. If all the tabbable elements
	// inside the toolbar are ToolbarItem components (or derived components like
	// ToolbarButton), then we can wrap them with the accessible Toolbar
	// component.
	const [ isAccessibleToolbar, setIsAccessibleToolbar ] = useState(
		initialAccessibleToolbarState
	);

	const determineIsAccessibleToolbar = useCallback( () => {
		const tabbables = focus.tabbable.find( ref.current );
		const onlyToolbarItem = hasOnlyToolbarItem( tabbables );
		if ( ! onlyToolbarItem ) {
			deprecated( 'Using custom components as toolbar controls', {
				alternative: 'ToolbarItem or ToolbarButton components',
				link:
					'https://developer.wordpress.org/block-editor/components/toolbar-button/#inside-blockcontrols',
			} );
		}
		setIsAccessibleToolbar( onlyToolbarItem );
	}, [] );

	useLayoutEffect( () => {
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
				label={ props[ 'aria-label' ] }
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
