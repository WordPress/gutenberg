/**
 * WordPress dependencies
 */
import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useFocusOnMount, useMergeRefs } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editWidgetsStore );
	const { getListViewToggleRef } = unlock( useSelect( editWidgetsStore ) );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the dropZoneElement updates.
	const [ dropZoneElement, setDropZoneElement ] = useState( null );

	const focusOnMountRef = useFocusOnMount( 'firstElement' );

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

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="edit-widgets-editor__list-view-panel"
			onKeyDown={ closeOnEscape }
		>
			<div className="edit-widgets-editor__list-view-panel-header">
				<strong>{ __( 'List View' ) }</strong>
				<Button
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ closeListView }
					size="compact"
				/>
			</div>
			<div
				className="edit-widgets-editor__list-view-panel-content"
				ref={ useMergeRefs( [ focusOnMountRef, setDropZoneElement ] ) }
			>
				<ListView dropZoneElement={ dropZoneElement } />
			</div>
		</div>
	);
}
