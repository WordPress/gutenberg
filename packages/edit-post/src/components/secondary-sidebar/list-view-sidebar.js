/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
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

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsListViewOpened( false );
		}
	}

	const [ tab, setTab ] = useState( 'list-view' );

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This ref refers to the list view tab button.
	const listViewTabRef = useRef();
	// This ref refers to the outline tab button.
	const outlineTabRef = useRef();
	// This ref refers to the list view application area.
	const listViewRef = useRef();

	/*
	 * Callback function to handle list view or outline focus.
	 *
	 * @param {string} currentTab The current tab. Either list view or outline.
	 *
	 * @return void
	 */
	function handleSidebarFocus( currentTab ) {
		// List view tab is selected.
		if ( currentTab === 'list-view' ) {
			// Either focus the list view or the list view tab button. Must have a fallback because the list view does not render when there are no blocks.
			const listViewApplicationFocus = focus.tabbable.find(
				listViewRef.current
			)[ 0 ];
			const listViewFocusArea = sidebarRef.current.contains(
				listViewApplicationFocus
			)
				? listViewApplicationFocus
				: listViewTabRef.current;
			listViewFocusArea.focus();
			// Outline tab is selected.
		} else {
			outlineTabRef.current.focus();
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

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			aria-label={ __( 'Document Overview' ) }
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
					label={ __( 'Close Document Overview Sidebar' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
				<ul>
					<li>
						<Button
							ref={ listViewTabRef }
							onClick={ () => {
								setTab( 'list-view' );
							} }
							className={ classnames(
								'edit-post-sidebar__panel-tab',
								{ 'is-active': tab === 'list-view' }
							) }
							aria-current={ tab === 'list-view' }
						>
							{ __( 'List View' ) }
						</Button>
					</li>
					<li>
						<Button
							ref={ outlineTabRef }
							onClick={ () => {
								setTab( 'outline' );
							} }
							className={ classnames(
								'edit-post-sidebar__panel-tab',
								{ 'is-active': tab === 'outline' }
							) }
							aria-current={ tab === 'outline' }
						>
							{ __( 'Outline' ) }
						</Button>
					</li>
				</ul>
			</div>
			<div
				ref={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
					listViewRef,
				] ) }
				className="edit-post-editor__list-view-container"
			>
				{ tab === 'list-view' && (
					<div className="edit-post-editor__list-view-panel-content">
						<ListView />
					</div>
				) }
				{ tab === 'outline' && <ListViewOutline /> }
			</div>
		</div>
	);
}
