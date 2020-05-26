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
	__experimentalWithBlockNavigationSlots,
	__experimentalWithBlockNavigationBlockSettings,
	__experimentalWithBlockNavigationBlockSettingsMinLevel,
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
				{ __( 'Block navigation' ) }
			</p>
			{ hasHierarchy && (
				<BlockNavigationTree
					blocks={ [ rootBlock ] }
					selectedBlockClientId={ selectedBlockClientId }
					selectBlock={ selectBlock }
					__experimentalWithBlockNavigationBlockSettings={
						__experimentalWithBlockNavigationBlockSettings
					}
					__experimentalWithBlockNavigationBlockSettingsMinLevel={
						__experimentalWithBlockNavigationBlockSettingsMinLevel
					}
					__experimentalWithBlockNavigationSlots={
						__experimentalWithBlockNavigationSlots
					}
					showNestedBlocks
				/>
			) }
			{ ! hasHierarchy && (
				<BlockNavigationTree
					blocks={ rootBlocks }
					selectedBlockClientId={ selectedBlockClientId }
					selectBlock={ selectBlock }
					__experimentalWithBlockNavigationBlockSettings={
						__experimentalWithBlockNavigationBlockSettings
					}
					__experimentalWithBlockNavigationBlockSettingsMinLevel={
						__experimentalWithBlockNavigationBlockSettingsMinLevel
					}
					__experimentalWithBlockNavigationSlots={
						__experimentalWithBlockNavigationSlots
					}
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
			getBlock,
			getBlocks,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			rootBlocks: getBlocks(),
			rootBlock: selectedBlockClientId
				? getBlock(
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
