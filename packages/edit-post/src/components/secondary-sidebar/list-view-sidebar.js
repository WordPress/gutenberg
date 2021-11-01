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
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp, closeSmall } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editPostStore );

	const { clearSelectedBlock, selectBlock } = useDispatch( blockEditorStore );
	async function selectEditorBlock( clientId ) {
		await clearSelectedBlock();
		selectBlock( clientId, -1 );
	}

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const focusReturnRef = useFocusReturn();
	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsListViewOpened( false );
		}
	}

	const [ allItemsCollapsed, setAllItemsCollapsed ] = useState( false );

	const instanceId = useInstanceId( ListViewSidebar );
	const labelId = `edit-post-editor__list-view-panel-label-${ instanceId }`;

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			aria-labelledby={ labelId }
			className="edit-post-editor__list-view-panel"
			onKeyDown={ closeOnEscape }
		>
			<div className="edit-post-editor__list-view-panel-header">
				<strong id={ labelId }>{ __( 'List view' ) }</strong>
				<Button
					icon={ chevronUp }
					label={ __( 'Collapse all list items' ) }
					onClick={ () => setAllItemsCollapsed( true ) }
				/>
				<Button
					icon={ chevronDown }
					label={ __( 'Expand all list items' ) }
					onClick={ () => setAllItemsCollapsed( false ) }
				/>
				<Button
					icon={ closeSmall }
					label={ __( 'Close list view sidebar' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
			</div>
			<div
				className="edit-post-editor__list-view-panel-content"
				ref={ useMergeRefs( [ focusReturnRef, focusOnMountRef ] ) }
			>
				<ListView
					onSelect={ selectEditorBlock }
					allItemsCollapsed={ allItemsCollapsed }
					showNestedBlocks
					__experimentalFeatures
					__experimentalPersistentListViewFeatures
				/>
			</div>
		</div>
	);
}
