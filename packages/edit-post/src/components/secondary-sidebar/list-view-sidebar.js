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
import { useRef } from '@wordpress/element';
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

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsListViewOpened( false );
		}
	}

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This ref refers to the tab panel.
	const tabPanelRef = useRef();
	// This ref refers to the list view application area.
	const listViewRef = useRef();

	/*
	 * Callback function to handle list view or outline focus.
	 *
	 * @return void
	 */
	function handleSidebarFocus() {
		// Either focus the list view or the tab panel. Must have a fallback because the list view does not render when there are no blocks.
		const listViewApplicationFocus = focus.tabbable.find(
			listViewRef.current
		)[ 0 ];
		const listViewFocusArea = sidebarRef.current.contains(
			listViewApplicationFocus
		)
			? listViewApplicationFocus
			: focus.tabbable.find( tabPanelRef.current )[ 0 ];
		// Do not focus when focus is already there.
		if (
			sidebarRef.current.ownerDocument.activeElement === listViewFocusArea
		) {
			return;
		}
		listViewFocusArea.focus();
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
			handleSidebarFocus();
		}
	} );

	function renderTabContent( tabName ) {
		if ( tabName === 'list-view' ) {
			return (
				<div className="edit-post-editor__list-view-panel-content">
					<ListView />
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
			<div
				className="edit-post-editor__document-overview-panel-header components-panel__header edit-post-sidebar__panel-tabs"
				ref={ headerFocusReturnRef }
			>
				<Button
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
			</div>
			<TabPanel
				ref={ tabPanelRef }
				selectOnMove={ false }
				itemRef={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
					listViewRef,
				] ) }
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
				{ ( tab ) => (
					<div className="edit-post-editor__list-view-container">
						{ renderTabContent( tab.name ) }
					</div>
				) }
			</TabPanel>
		</div>
	);
}
