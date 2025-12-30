/**
 * WordPress dependencies
 */
import {
	__experimentalListView as ListView,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useFocusOnMount, useMergeRefs } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { ESCAPE } from '@wordpress/keycodes';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import ListViewOutline from './list-view-outline';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { TabbedSidebar } = unlock( blockEditorPrivateApis );

// Used to count how many times the component renders and determine the initial focus logic.
let renderCounter = 0;

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editorStore );

	const { listViewToggleRef, showListViewByDefault } = useSelect(
		( select ) => {
			const { getListViewToggleRef } = unlock( select( editorStore ) );
			const _showListViewByDefault = select( preferencesStore ).get(
				'core',
				'showListViewByDefault'
			);

			return {
				listViewToggleRef: getListViewToggleRef(),
				showListViewByDefault: _showListViewByDefault,
			};
		},
		[]
	);

	// This hook handles focus when the sidebar first renders.
	const focusOnMountRef = useFocusOnMount( 'firstElement' );

	// When closing the list view, focus should return to the toggle button.
	const closeListView = useCallback( () => {
		setIsListViewOpened( false );
		listViewToggleRef.current?.focus();
	}, [ listViewToggleRef, setIsListViewOpened ] );

	const closeOnEscape = useCallback(
		( event ) => {
			if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
				// Always use `event.preventDefault` before calling `closeListView`.
				// This is important to prevent the `core/editor/toggle-list-view`
				// shortcut callback from being twice.
				event.preventDefault();
				closeListView();
			}
		},
		[ closeListView ]
	);

	const firstRenderCheckRef = useRef( false );

	useEffect( () => {
		// This extra check avoids duplicate updates of the counter in development
		// mode (React.StrictMode) or because of potential re-renders triggered
		// by components higher up the tree.
		if ( firstRenderCheckRef.current ) {
			return;
		}
		renderCounter++;
		firstRenderCheckRef.current = true;
	}, [] );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the dropZoneElement updates.
	const [ dropZoneElement, setDropZoneElement ] = useState( null );
	// Tracks our current tab.
	const [ tab, setTab ] = useState( 'list-view' );

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This ref refers to the tablist.
	const tabsRef = useRef();
	// This ref refers to the list view application area.
	const listViewRef = useRef();

	// Must merge the refs together so focus can be handled properly in the next function.
	const listViewContainerRef = useMergeRefs( [
		listViewRef,
		setDropZoneElement,
	] );

	// focusOnMountRef ref is used to set initial focus to the first tab in the
	// ListViewSidebar while the tabsRef is used to manage focus for the ARIA tabs UI.
	let tabsPanelRef = useMergeRefs( [ focusOnMountRef, tabsRef ] );

	// When the 'Always open List View' preference is enabled and the ListViewSidebar
	// renders for the first time on page load, initial focus should not be managed.
	// Rather, the tab sequence should normally start from the document root. In
	// this case, we only pass the tabsRef and omit the focusOnMountRef.
	if ( showListViewByDefault && renderCounter === 1 ) {
		tabsPanelRef = tabsRef;
	}

	/*
	 * Callback function to handle list view or outline focus.
	 *
	 * @param {string} currentTab The current tab. Either list view or outline.
	 *
	 * @return void
	 */
	function handleSidebarFocus( currentTab ) {
		// Active tab in the tablist.
		const activeTab = focus.tabbable.find( tabsRef.current )[ 0 ];
		// List view tab is selected.
		if ( currentTab === 'list-view' ) {
			// Either focus the list view selected item or the active tab in the
			// tablist. Must have a fallback because the list view does not
			// render when there are no blocks.
			// Important: The `core/editor/toggle-list-view` keyboard shortcut
			// callback runs when the `keydown` event fires. At that point the
			// ListView hasn't received focus yet and its internal mechanism to
			// handle the tabindex attribute hasn't run yet. As such, there may
			// be an additional item that is 'tabbable' but it's not the
			// selected item. Filtering based on the `data-is-selected` attribute
			// makes sure to target the selected item.
			const listViewSelectedItem = focus.tabbable
				.find( listViewRef.current )
				.filter( ( item ) =>
					item.hasAttribute( 'data-is-selected' )
				)[ 0 ];
			const listViewFocusTarget = sidebarRef.current.contains(
				listViewSelectedItem
			)
				? listViewSelectedItem
				: activeTab;

			listViewFocusTarget.focus();
			// Outline tab is selected.
		} else {
			activeTab.focus();
		}
	}

	const handleToggleListViewShortcut = useCallback(
		( event ) => {
			// If the sidebar has focus, it is safe to close.
			if (
				sidebarRef.current.contains(
					sidebarRef.current.ownerDocument.activeElement
				)
			) {
				// Always use `event.preventDefault` before calling `closeListView`.
				// This is important to prevent the `core/editor/toggle-list-view`
				// shortcut callback from running twice.
				event.preventDefault();
				closeListView();
			} else {
				// If the list view or outline does not have focus, focus should be moved to it.
				handleSidebarFocus( tab );
			}
		},
		[ closeListView, tab ]
	);

	// This only fires when the sidebar is open because of the conditional rendering.
	// It is the same shortcut to open the sidebar but that is defined as a global
	// shortcut. However, when the `showListViewByDefault` preference is enabled,
	// the sidebar is open by default and the shortcut callback would be invoked
	// twice (here and in the global shortcut). To prevent that, we pass the event
	// for some additional logic in the global shortcut based on `event.defaultPrevented`.
	useShortcut( 'core/editor/toggle-list-view', ( event ) => {
		handleToggleListViewShortcut( event );
	} );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="editor-list-view-sidebar"
			onKeyDown={ closeOnEscape }
			ref={ sidebarRef }
		>
			<TabbedSidebar
				tabs={ [
					{
						name: 'list-view',
						title: _x( 'List View', 'Post overview' ),
						panel: (
							<div className="editor-list-view-sidebar__list-view-container">
								<div className="editor-list-view-sidebar__list-view-panel-content">
									<ListView
										dropZoneElement={ dropZoneElement }
									/>
								</div>
							</div>
						),
						panelRef: listViewContainerRef,
					},
					{
						name: 'outline',
						title: _x( 'Outline', 'Post overview' ),
						panel: (
							<div className="editor-list-view-sidebar__list-view-container">
								<ListViewOutline />
							</div>
						),
					},
				] }
				onClose={ closeListView }
				onSelect={ ( tabName ) => setTab( tabName ) }
				defaultTabId="list-view"
				ref={ tabsPanelRef }
				closeButtonLabel={ __( 'Close' ) }
			/>
		</div>
	);
}
