/**
 * WordPress dependencies
 */
import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Button, TabPanel } from '@wordpress/components';
import {
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import ListViewOutline from './list-view-outline';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editPostStore );

	// This hook handles focus when the sidebar first renders.
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	// The next 2 hooks handle focus for when the sidebar closes and returning focus to the element that had focus before sidebar opened.
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsListViewOpened( false );
		}
	}

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the dropZoneElement updates.
	const [ dropZoneElement, setDropZoneElement ] = useState( null );
	// Tracks our current tab.
	const [ tab, setTab ] = useState( 'list-view' );

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This ref refers to the tab panel.
	const tabPanelRef = useRef();
	// This ref refers to the list view application area.
	const listViewRef = useRef();

	// Must merge the refs together so focus can be handled properly in the next function.
	const listViewContainerRef = useMergeRefs( [
		contentFocusReturnRef,
		focusOnMountRef,
		listViewRef,
		setDropZoneElement,
	] );

	/*
	 * Callback function to handle list view or outline focus.
	 *
	 * @param {string} currentTab The current tab. Either list view or outline.
	 *
	 * @return void
	 */
	function handleSidebarFocus( currentTab ) {
		// Tab panel focus.
		const tabPanelFocus = focus.tabbable.find( tabPanelRef.current )[ 0 ];
		// List view tab is selected.
		if ( currentTab === 'list-view' ) {
			// Either focus the list view or the tab panel. Must have a fallback because the list view does not render when there are no blocks.
			const listViewApplicationFocus = focus.tabbable.find(
				listViewRef.current
			)[ 0 ];
			const listViewFocusArea = sidebarRef.current.contains(
				listViewApplicationFocus
			)
				? listViewApplicationFocus
				: tabPanelFocus;
			listViewFocusArea.focus();
			// Outline tab is selected.
		} else {
			tabPanelFocus.focus();
		}
	}

	// This only fires when the sidebar is open because of the conditional rendering. It is the same shortcut to open but that is defined as a global shortcut and only fires when the sidebar is closed.
	useShortcut( 'core/edit-post/toggle-list-view', () => {
		// If the sidebar has focus, it is safe to close.
		if (
			sidebarRef.current.contains(
				sidebarRef.current.ownerDocument.activeElement
			)
		) {
			setIsListViewOpened( false );
			// If the list view or outline does not have focus, focus should be moved to it.
		} else {
			handleSidebarFocus( tab );
		}
	} );

	/**
	 * Render tab content for a given tab name.
	 *
	 * @param {string} tabName The name of the tab to render.
	 */
	function renderTabContent( tabName ) {
		if ( tabName === 'list-view' ) {
			return (
				<div className="edit-post-editor__list-view-panel-content">
					<ListView dropZoneElement={ dropZoneElement } />
				</div>
			);
		}
		return <ListViewOutline />;
	}

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="edit-post-editor__document-overview-panel"
			onKeyDown={ closeOnEscape }
			ref={ sidebarRef }
		>
			<Button
				className="edit-post-editor__document-overview-panel__close-button"
				ref={ headerFocusReturnRef }
				icon={ closeSmall }
				label={ __( 'Close' ) }
				onClick={ () => setIsListViewOpened( false ) }
			/>
			<TabPanel
				className="edit-post-editor__document-overview-panel__tab-panel"
				ref={ tabPanelRef }
				onSelect={ ( tabName ) => setTab( tabName ) }
				selectOnMove={ false }
				tabs={ [
					{
						name: 'list-view',
						title: 'List View',
						className: 'edit-post-sidebar__panel-tab',
					},
					{
						name: 'outline',
						title: 'Outline',
						className: 'edit-post-sidebar__panel-tab',
					},
				] }
			>
				{ ( currentTab ) => (
					<div
						className="edit-post-editor__list-view-container"
						ref={ listViewContainerRef }
					>
						{ renderTabContent( currentTab.name ) }
					</div>
				) }
			</TabPanel>
		</div>
	);
}
