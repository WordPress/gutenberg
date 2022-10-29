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

	// This ref refers to the list view only.
	const listViewRef = useRef();
	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This only fires when the sidebar is open because of the conditional rendering. It is the same shortcut to open but that is defined as a global shortcut and only fires when the sidebar is closed.
	useShortcut( 'core/edit-post/toggle-list-view', () => {
		// If the sidebar has focus, it is safe to close.
		if (
			sidebarRef.current.contains(
				sidebarRef.current.ownerDocument.activeElement
			)
		) {
			setIsListViewOpened( false );
			// If the list view does not have focus, we should move focus to it.
		} else if ( tab === 'list-view' ) {
			// Find the 1st tabbable based on the attached list view ref.
			focus.tabbable.find( listViewRef.current )[ 0 ].focus();
			// If the outline does not have focus, we should move focus to it.
		} else if ( tab === 'outline' ) {
			// Find the 3rd tabbable based on the attached sidebar ref. This is to skip over the close button, list view tab button, and landing on outline tab button since there is nothing else to focus after.
			focus.tabbable.find( sidebarRef.current )[ 2 ].focus();
		}
	} );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
<<<<<<< HEAD
			aria-label={ __( 'Document Overview' ) }
			className="edit-post-editor__document-overview-panel"
			onKeyDown={ closeOnEscape }
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
