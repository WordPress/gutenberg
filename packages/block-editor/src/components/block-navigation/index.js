/**
 * External dependencies
 */
import { isArray, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationTree from './tree';
import { isClientIdSelected } from './utils';
import { store as blockEditorStore } from '../../store';

export default function BlockNavigation( {
	onSelect = noop,
	__experimentalFeatures,
} ) {
	const { rootBlock, rootBlocks, selectedBlockClientId } = useSelect(
		( select ) => {
			const {
				getBlockHierarchyRootClientId,
				getSelectedBlockClientId,
				__unstableGetClientIdsTree,
				__unstableGetClientIdWithClientIdsTree,
			} = select( blockEditorStore );

			const _selectedBlockClientId = getSelectedBlockClientId();
			const _rootBlocks = __unstableGetClientIdsTree();
			const _rootBlock =
				_selectedBlockClientId && ! isArray( _selectedBlockClientId )
					? __unstableGetClientIdWithClientIdsTree(
							getBlockHierarchyRootClientId(
								_selectedBlockClientId
							)
					  )
					: null;

			return {
				rootBlock: _rootBlock,
				rootBlocks: _rootBlocks,
				selectedBlockClientId: _selectedBlockClientId,
			};
		}
	);
	const { selectBlock } = useDispatch( blockEditorStore );

	function selectEditorBlock( clientId ) {
		selectBlock( clientId );
		onSelect( clientId );
	}

	if ( ! rootBlocks || rootBlocks.length === 0 ) {
		return null;
	}

	const hasHierarchy =
		rootBlock &&
		( ! isClientIdSelected( rootBlock.clientId, selectedBlockClientId ) ||
			( rootBlock.innerBlocks && rootBlock.innerBlocks.length !== 0 ) );

	return (
		<div className="block-editor-block-navigation__container">
			<p className="block-editor-block-navigation__label">
				{ __( 'List view' ) }
			</p>

			<BlockNavigationTree
				blocks={ hasHierarchy ? [ rootBlock ] : rootBlocks }
				selectedBlockClientIds={ [ selectedBlockClientId ] }
				selectBlock={ selectEditorBlock }
				__experimentalFeatures={ __experimentalFeatures }
				showNestedBlocks
			/>
		</div>
	);
}
