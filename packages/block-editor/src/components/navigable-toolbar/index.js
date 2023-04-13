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

function getAllToolbarItemsIn( container ) {
	return Array.from( container.querySelectorAll( '[data-toolbar-item]' ) );
}

function hasFocusWithin( container ) {
	return container.contains( container.ownerDocument.activeElement );
}

function focusFirstTabbableIn( container ) {
	const [ firstTabbable ] = focus.tabbable.find( container );
	if ( firstTabbable ) {
		firstTabbable.focus( {
			// When focusing newly mounted toolbars,
			// the position of the popover is often not right on the first render
			// This prevents the layout shifts when focusing the dialogs.
			preventScroll: true,
		} );
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
				since: '5.6',
				alternative:
					'ToolbarItem, ToolbarButton or ToolbarDropdownMenu components',
				link: 'https://developer.wordpress.org/block-editor/components/toolbar-button/#inside-blockcontrols',
			} );
		}
		setIsAccessibleToolbar( onlyToolbarItem );
	}, [] );

	useLayoutEffect( () => {
		// Toolbar buttons may be rendered asynchronously, so we use
		// MutationObserver to check if the toolbar subtree has been modified.
		const observer = new window.MutationObserver(
			determineIsAccessibleToolbar
		);
		observer.observe( ref.current, { childList: true, subtree: true } );
		return () => observer.disconnect();
	}, [ isAccessibleToolbar ] );

	return isAccessibleToolbar;
}

function useToolbarFocus(
	ref,
	focusOnMount,
	isAccessibleToolbar,
	defaultIndex,
	onIndexChange
) {
	// Make sure we don't use modified versions of this prop.
	const [ initialFocusOnMount ] = useState( focusOnMount );
	const [ initialIndex ] = useState( defaultIndex );

	const focusToolbar = useCallback( () => {
		focusFirstTabbableIn( ref.current );
	}, [] );

	// Focus on toolbar when pressing alt+F10 when the toolbar is visible.
	useShortcut( 'core/block-editor/focus-toolbar', focusToolbar );

	useEffect( () => {
		if ( initialFocusOnMount ) {
			focusToolbar();
		}
	}, [ isAccessibleToolbar, initialFocusOnMount, focusToolbar ] );

	useEffect( () => {
		// If initialIndex is passed, we focus on that toolbar item when the
		// toolbar gets mounted and initial focus is not forced.
		// We have to wait for the next browser paint because block controls aren't
		// rendered right away when the toolbar gets mounted.
		let raf = 0;
		if ( initialIndex && ! initialFocusOnMount ) {
			raf = window.requestAnimationFrame( () => {
				const items = getAllToolbarItemsIn( ref.current );
				const index = initialIndex || 0;
				if ( items[ index ] && hasFocusWithin( ref.current ) ) {
					items[ index ].focus( {
						// When focusing newly mounted toolbars,
						// the position of the popover is often not right on the first render
						// This prevents the layout shifts when focusing the dialogs.
						preventScroll: true,
					} );
				}
			} );
		}
		return () => {
			window.cancelAnimationFrame( raf );
			if ( ! onIndexChange || ! ref.current ) return;
			// When the toolbar element is unmounted and onIndexChange is passed, we
			// pass the focused toolbar item index so it can be hydrated later.
			const items = getAllToolbarItemsIn( ref.current );
			const index = items.findIndex( ( item ) => item.tabIndex === 0 );
			onIndexChange( index );
		};
	}, [ initialIndex, initialFocusOnMount ] );
}

function NavigableToolbar( {
	children,
	focusOnMount,
	__experimentalInitialIndex: initialIndex,
	__experimentalOnIndexChange: onIndexChange,
	...props
} ) {
	const ref = useRef();
	const isAccessibleToolbar = useIsAccessibleToolbar( ref );

	useToolbarFocus(
		ref,
		focusOnMount,
		isAccessibleToolbar,
		initialIndex,
		onIndexChange
	);

	if ( isAccessibleToolbar ) {
		return (
			<Toolbar label={ props[ 'aria-label' ] } ref={ ref } { ...props }>
				{ children }
			</Toolbar>
		);
	}

	return (
		<NavigableMenu
			orientation="horizontal"
			role="toolbar"
			ref={ ref }
			{ ...props }
		>
			{ children }
		</NavigableMenu>
	);
}

export default NavigableToolbar;
