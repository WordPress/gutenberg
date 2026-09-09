import {
	__experimentalListView as ListView,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useMergeRefs } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { ESCAPE } from '@wordpress/keycodes';
import ListViewOutline from './list-view-outline';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { TabbedSidebar } = unlock( blockEditorPrivateApis );

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editorStore );
	const { getListViewToggleRef } = unlock( useSelect( editorStore ) );

	// When closing the list view, focus should return to the toggle button.
	const closeListView = useCallback( () => {
		setIsListViewOpened( false );
		getListViewToggleRef().current?.focus();
	}, [ getListViewToggleRef, setIsListViewOpened ] );

	const closeOnEscape = useCallback(
		( event ) => {
			if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
				event.preventDefault();
				closeListView();
			}
		},
		[ closeListView ]
	);

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the dropZoneElement updates.
	const [ dropZoneElement, setDropZoneElement ] = useState( null );
	// Tracks our current tab.
	const [ tab, setTab ] = useState( 'list-view' );

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This ref refers to the tab panel.
	const tabsRef = useRef();
	// This ref refers to the list view application area.
	const listViewRef = useRef();

	// Must merge the refs together so focus can be handled properly in the next function.
	const listViewContainerRef = useMergeRefs( [
		listViewRef,
		setDropZoneElement,
	] );

	// The sidebar only renders while it is open, so this handles the shortcut
	// from there on. Opening is left to the global shortcut.
	useShortcut( 'core/editor/toggle-list-view', () => {
		const sidebar = sidebarRef.current;

		// If the sidebar has focus, it is safe to close.
		if ( sidebar.contains( sidebar.ownerDocument.activeElement ) ) {
			closeListView();
			return;
		}

		// The list view does not render when there are no blocks, so focus
		// falls back to the tabs.
		const target =
			( tab === 'list-view' &&
				focus.tabbable.find( listViewRef.current )[ 0 ] ) ||
			focus.tabbable.find( tabsRef.current )[ 0 ];

		target?.focus();
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
										focusOnMount
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
				ref={ tabsRef }
				closeButtonLabel={ __( 'Close' ) }
			/>
		</div>
	);
}
