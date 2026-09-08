import { NavigableMenu, Toolbar } from '@wordpress/components';
import {
	useState,
	useRef,
	useContext,
	useLayoutEffect,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { focus, isTextField } from '@wordpress/dom';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { ESCAPE } from '@wordpress/keycodes';
import { store as blockEditorStore } from '../../store';
import { BlockRefs } from '../provider/block-refs-provider';
import { unlock } from '../../lock-unlock';

// A toolbar that unmounts while one of its items has focus hands the item's
// position to a toolbar with the same label mounting in the same task. The
// block toolbar is keyed on the selected block and its parent, so it
// remounts when its block moves (a list item indented from it), and the
// focused item is removed with it, which drops focus without an event.
let handoff = null;

function hasOnlyToolbarItem( elements ) {
	const dataProp = 'toolbarItem';
	return ! elements.some( ( element ) => ! ( dataProp in element.dataset ) );
}

function getAllFocusableToolbarItemsIn( container ) {
	return Array.from(
		container.querySelectorAll( '[data-toolbar-item]:not([disabled])' )
	);
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

function useIsAccessibleToolbar( toolbarRef ) {
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
		const tabbables = focus.tabbable.find( toolbarRef.current );
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
	}, [ toolbarRef ] );

	useLayoutEffect( () => {
		// Toolbar buttons may be rendered asynchronously, so we use
		// MutationObserver to check if the toolbar subtree has been modified.
		const observer = new window.MutationObserver(
			determineIsAccessibleToolbar
		);
		observer.observe( toolbarRef.current, {
			childList: true,
			subtree: true,
		} );
		return () => observer.disconnect();
	}, [ determineIsAccessibleToolbar, isAccessibleToolbar, toolbarRef ] );

	return isAccessibleToolbar;
}

function useToolbarFocus( {
	toolbarRef,
	focusOnMount,
	isAccessibleToolbar,
	defaultIndex,
	onIndexChange,
	shouldUseKeyboardFocusShortcut,
	focusEditorOnEscape,
} ) {
	// Make sure we don't use modified versions of this prop.
	const [ initialFocusOnMount ] = useState( focusOnMount );
	const [ initialIndex ] = useState( defaultIndex );

	const { getLastFocus, getSelectedBlockClientId } = unlock(
		useSelect( blockEditorStore )
	);
	const { refsMap } = useContext( BlockRefs );

	const focusToolbar = useCallback( () => {
		focusFirstTabbableIn( toolbarRef.current );
	}, [ toolbarRef ] );

	const focusToolbarViaShortcut = () => {
		if ( shouldUseKeyboardFocusShortcut ) {
			focusToolbar();
		}
	};

	// Focus on toolbar when pressing alt+F10 when the toolbar is visible.
	useShortcut( 'core/block-editor/focus-toolbar', focusToolbarViaShortcut );

	useEffect( () => {
		if ( initialFocusOnMount ) {
			focusToolbar();
		}
	}, [ isAccessibleToolbar, initialFocusOnMount, focusToolbar ] );

	useEffect( () => {
		// Store ref so we have access on useEffect cleanup: https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup-timing
		const navigableToolbarRef = toolbarRef.current;
		// If initialIndex is passed, we focus on that toolbar item when the
		// toolbar gets mounted and initial focus is not forced.
		// We have to wait for the next browser paint because block controls aren't
		// rendered right away when the toolbar gets mounted.
		let raf = 0;

		// If the toolbar already had focus before the render, we don't want to move it.
		// https://github.com/WordPress/gutenberg/issues/58511
		if (
			! initialFocusOnMount &&
			! hasFocusWithin( navigableToolbarRef )
		) {
			const received =
				handoff?.label ===
				navigableToolbarRef.getAttribute( 'aria-label' )
					? handoff
					: null;
			raf = window.requestAnimationFrame( () => {
				const items =
					getAllFocusableToolbarItemsIn( navigableToolbarRef );
				const index = received
					? Math.min( received.index, items.length - 1 )
					: initialIndex || 0;
				const { activeElement, body } =
					navigableToolbarRef.ownerDocument;
				if (
					items[ index ] &&
					( hasFocusWithin( navigableToolbarRef ) ||
						( received &&
							( ! activeElement || activeElement === body ) ) )
				) {
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
			if ( ! onIndexChange || ! navigableToolbarRef ) {
				return;
			}
			// When the toolbar element is unmounted and onIndexChange is passed, we
			// pass the focused toolbar item index so it can be hydrated later.
			const items = getAllFocusableToolbarItemsIn( navigableToolbarRef );
			const index = items.findIndex( ( item ) => item.tabIndex === 0 );
			onIndexChange( index );
		};
	}, [ initialIndex, initialFocusOnMount, onIndexChange, toolbarRef ] );

	// Track which item has focus, and hand its position over on unmount.
	useEffect( () => {
		const toolbar = toolbarRef.current;
		let index = -1;

		function onFocusIn( event ) {
			index = getAllFocusableToolbarItemsIn( toolbar ).indexOf(
				event.target
			);
		}

		function onFocusOut( event ) {
			// Focus moved somewhere on purpose.
			if ( event.relatedTarget ) {
				index = -1;
				return;
			}
			// No related target: focus went to another document (the
			// canvas), to something not focusable, or the item was
			// removed. Chrome fires no event at all for a removal; the
			// others report it before the item is detached.
			const { target } = event;
			window.queueMicrotask( () => {
				if ( target.isConnected ) {
					index = -1;
				}
			} );
		}

		toolbar.addEventListener( 'focusin', onFocusIn );
		toolbar.addEventListener( 'focusout', onFocusOut );

		return () => {
			toolbar.removeEventListener( 'focusin', onFocusIn );
			toolbar.removeEventListener( 'focusout', onFocusOut );

			if ( index < 0 ) {
				return;
			}

			handoff = { label: toolbar.getAttribute( 'aria-label' ), index };
			window.queueMicrotask( () => {
				handoff = null;
			} );
		};
	}, [ toolbarRef ] );

	/**
	 * Handles returning focus to the block editor canvas when pressing escape.
	 */
	useEffect( () => {
		if ( ! focusEditorOnEscape ) {
			return;
		}

		const navigableToolbar = toolbarRef.current;
		const handleKeyDown = ( event ) => {
			if ( event.keyCode !== ESCAPE ) {
				return;
			}
			// The last focused element is only recorded once focus has left
			// the canvas, so fall back to the selected block. Without it
			// escape leaves focus stranded in the toolbar, with no way back
			// to the canvas by keyboard. The recorded element may no longer
			// take focus: it was removed (the block re-rendered after it
			// moved), or it was an editing host that has since been
			// disabled. Return to the block's first text field then, where
			// focus left from.
			const lastFocus = getLastFocus()?.current;
			const blockElement = refsMap.get( getSelectedBlockClientId() );
			let target = lastFocus ?? blockElement;
			if (
				lastFocus &&
				blockElement &&
				( ! lastFocus.isConnected ||
					lastFocus.contentEditable === 'false' )
			) {
				target =
					focus.tabbable.find( blockElement ).find( isTextField ) ??
					blockElement;
			}
			if ( target ) {
				event.preventDefault();
				target.focus();
			}
		};
		navigableToolbar.addEventListener( 'keydown', handleKeyDown );
		return () => {
			navigableToolbar.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [
		focusEditorOnEscape,
		getLastFocus,
		getSelectedBlockClientId,
		refsMap,
		toolbarRef,
	] );
}

export default function NavigableToolbar( {
	children,
	focusOnMount,
	focusEditorOnEscape = false,
	shouldUseKeyboardFocusShortcut = true,
	__experimentalInitialIndex: initialIndex,
	__experimentalOnIndexChange: onIndexChange,
	orientation = 'horizontal',
	...props
} ) {
	const toolbarRef = useRef();
	const isAccessibleToolbar = useIsAccessibleToolbar( toolbarRef );

	useToolbarFocus( {
		toolbarRef,
		focusOnMount,
		defaultIndex: initialIndex,
		onIndexChange,
		isAccessibleToolbar,
		shouldUseKeyboardFocusShortcut,
		focusEditorOnEscape,
	} );

	if ( isAccessibleToolbar ) {
		return (
			<Toolbar
				label={ props[ 'aria-label' ] }
				ref={ toolbarRef }
				orientation={ orientation }
				{ ...props }
			>
				{ children }
			</Toolbar>
		);
	}

	return (
		<NavigableMenu
			orientation={ orientation }
			role="toolbar"
			ref={ toolbarRef }
			{ ...props }
		>
			{ children }
		</NavigableMenu>
	);
}
