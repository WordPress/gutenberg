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
	useInstanceId,
	useMergeRefs,
} from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editSiteStore );

	const { getBlockParents, getBlockSelectionStart } = useSelect(
		blockEditorStore
	);

	const { clearSelectedBlock, multiSelect, selectBlock } = useDispatch(
		blockEditorStore
	);

	async function selectEditorBlock( clientId, event ) {
		if ( ! event.shiftKey ) {
			await clearSelectedBlock();
			selectBlock( clientId, -1 );
		} else if ( event.shiftKey ) {
			event.preventDefault();

			const blockSelectionStart = getBlockSelectionStart();

			// By checking `blockSelectionStart` to be set, we handle the
			// case where we select a single block. We also have to check
			// the selectionEnd (clientId) not to be included in the
			// `blockSelectionStart`'s parents because the click event is
			// propagated.
			const startParents = getBlockParents( blockSelectionStart );

			if (
				blockSelectionStart &&
				blockSelectionStart !== clientId &&
				! startParents?.includes( clientId )
			) {
				const startPath = [ ...startParents, blockSelectionStart ];
				const endPath = [ ...getBlockParents( clientId ), clientId ];
				const depth = Math.min( startPath.length, endPath.length ) - 1;
				const start = startPath[ depth ];
				const end = endPath[ depth ];

				// Handle the case of having selected a parent block and
				// then shift+click on a child.
				if ( start !== end ) {
					multiSelect( start, end );
				}
			}
		}
	}

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();
	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			setIsListViewOpened( false );
		}
	}

	const instanceId = useInstanceId( ListViewSidebar );
	const labelId = `edit-site-editor__list-view-panel-label-${ instanceId }`;

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			aria-labelledby={ labelId }
			className="edit-site-editor__list-view-panel"
			onKeyDown={ closeOnEscape }
		>
			<div
				className="edit-site-editor__list-view-panel-header"
				ref={ headerFocusReturnRef }
			>
				<strong id={ labelId }>{ __( 'List View' ) }</strong>
				<Button
					icon={ closeSmall }
					label={ __( 'Close List View Sidebar' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
			</div>
			<div
				className="edit-site-editor__list-view-panel-content"
				ref={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
				] ) }
			>
				<ListView
					onSelect={ selectEditorBlock }
					showNestedBlocks
					__experimentalFeatures
					__experimentalPersistentListViewFeatures
				/>
			</div>
		</div>
	);
}
