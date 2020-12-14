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
			{ hasHierarchy && (
				<BlockNavigationTree
					blocks={ [ rootBlock ] }
					selectedBlockClientId={ selectedBlockClientId }
					selectBlock={ selectBlock }
					__experimentalFeatures={ __experimentalFeatures }
					showNestedBlocks
				/>
			) }
			{ ! hasHierarchy && (
				<BlockNavigationTree
					blocks={ rootBlocks }
					selectedBlockClientId={ selectedBlockClientId }
					selectBlock={ selectBlock }
					__experimentalFeatures={ __experimentalFeatures }
				/>
			) }
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
		} = select( 'core/block-editor' );
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
				dispatch( 'core/block-editor' ).selectBlock( clientId );
				onSelect( clientId );
			},
		};
	} )
)( BlockNavigation );
