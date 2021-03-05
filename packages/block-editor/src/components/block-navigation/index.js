/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationTree from './tree';
import { store as blockEditorStore } from '../../store';

function BlockNavigation( {
	rootBlock,
	rootBlocks,
	selectedBlockClientId,
	selectBlock,
	__experimentalFeatures,
} ) {
	if ( ! rootBlocks || rootBlocks.length === 0 ) {
		return null;
	}

	const hasHierarchy =
		rootBlock &&
		( rootBlock.clientId !== selectedBlockClientId ||
			( rootBlock.innerBlocks && rootBlock.innerBlocks.length !== 0 ) );

	return (
		<div className="block-editor-block-navigation__container">
			<p className="block-editor-block-navigation__label">
				{ __( 'List view' ) }
			</p>

			<BlockNavigationTree
				blocks={ hasHierarchy ? [ rootBlock ] : rootBlocks }
				selectedBlockClientId={ selectedBlockClientId }
				selectBlock={ selectBlock }
				__experimentalFeatures={ __experimentalFeatures }
				showNestedBlocks
			/>
		</div>
	);
}

export default compose(
	withSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockHierarchyRootClientId,
			__unstableGetBlockWithBlockTree,
			__unstableGetBlockTree,
		} = select( blockEditorStore );
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			rootBlocks: __unstableGetBlockTree(),
			rootBlock: selectedBlockClientId
				? __unstableGetBlockWithBlockTree(
						getBlockHierarchyRootClientId( selectedBlockClientId )
				  )
				: null,
			selectedBlockClientId,
		};
	} ),
	withDispatch( ( dispatch, { onSelect = noop } ) => {
		return {
			selectBlock( clientId ) {
				dispatch( blockEditorStore ).selectBlock( clientId );
				onSelect( clientId );
			},
		};
	} )
)( BlockNavigation );
