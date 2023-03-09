/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import {
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { PrivateListView } = unlock( blockEditorPrivateApis );

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editSiteStore );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { hasBlockSelection } = useSelect(
		( select ) => ( {
			hasBlockSelection:
				!! select( blockEditorStore ).getBlockSelectionStart(),
		} ),
		[]
	);

	// This hook handles focus when the sidebar first renders.
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	// The next 2 hooks handle focus for when the sidebar closes and returning focus to the element that had focus before sidebar opened.
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			setIsListViewOpened( false );
		}
	}

	function clearSelectionOnEscape( event ) {
		// If there is a block selection, then skip closing the list view
		// and clear out the block selection instead.
		if (
			event.keyCode === ESCAPE &&
			! event.defaultPrevented &&
			hasBlockSelection
		) {
			event.preventDefault();
			clearSelectedBlock();
			speak( __( 'All blocks deselected.' ), 'assertive' );
		}
	}

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the dropZoneElement updates.
	const [ dropZoneElement, setDropZoneElement ] = useState( null );

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This ref refers to the close button.
	const sidebarCloseButtonRef = useRef();
	// This ref refers to the list view application area.
	const listViewRef = useRef();

	/*
	 * Callback function to handle list view or close button focus.
	 *
	 * @return void
	 */
	function handleSidebarFocus() {
		// Either focus the list view or the sidebar close button. Must have a fallback because the list view does not render when there are no blocks.
		const listViewApplicationFocus = focus.tabbable.find(
			listViewRef.current
		)[ 0 ];
		const listViewFocusArea = sidebarRef.current.contains(
			listViewApplicationFocus
		)
			? listViewApplicationFocus
			: sidebarCloseButtonRef.current;
		listViewFocusArea.focus();
	}

	// This only fires when the sidebar is open because of the conditional rendering. It is the same shortcut to open but that is defined as a global shortcut and only fires when the sidebar is closed.
	useShortcut( 'core/edit-site/toggle-list-view', () => {
		// If the sidebar has focus, it is safe to close.
		if (
			sidebarRef.current.contains(
				sidebarRef.current.ownerDocument.activeElement
			)
		) {
			setIsListViewOpened( false );
			// If the list view or close button does not have focus, focus should be moved to it.
		} else {
			handleSidebarFocus();
		}
	} );

	return (
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		<div
			className="edit-site-editor__list-view-panel"
			onKeyDown={ closeOnEscape }
			ref={ sidebarRef }
		>
			<div
				className="edit-site-editor__list-view-panel-header"
				ref={ headerFocusReturnRef }
			>
				<strong>{ __( 'List View' ) }</strong>
				<Button
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ () => setIsListViewOpened( false ) }
					ref={ sidebarCloseButtonRef }
				/>
			</div>
			<div
				className="edit-site-editor__list-view-panel-content"
				ref={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
					setDropZoneElement,
					listViewRef,
				] ) }
				onKeyDown={ clearSelectionOnEscape }
			>
				<PrivateListView dropZoneElement={ dropZoneElement } />
			</div>
		</div>
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	);
}
