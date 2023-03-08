/**
 * WordPress dependencies
 */
import {
	__experimentalListView as ListView,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import {
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../../store';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editWidgetsStore );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { hasBlockSelection } = useSelect(
		( select ) => ( {
			hasBlockSelection:
				!! select( blockEditorStore ).getBlockSelectionStart(),
		} ),
		[]
	);

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the dropZoneElement updates.
	const [ dropZoneElement, setDropZoneElement ] = useState( null );

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();

	function closeOnEscape( event ) {
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
			return;
		}

		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsListViewOpened( false );
		}
	}

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="edit-widgets-editor__list-view-panel"
			onKeyDown={ closeOnEscape }
		>
			<div
				className="edit-widgets-editor__list-view-panel-header"
				ref={ headerFocusReturnRef }
			>
				<strong>{ __( 'List View' ) }</strong>
				<Button
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
			</div>
			<div
				className="edit-widgets-editor__list-view-panel-content"
				ref={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
					setDropZoneElement,
				] ) }
			>
				<ListView dropZoneElement={ dropZoneElement } />
			</div>
		</div>
	);
}
