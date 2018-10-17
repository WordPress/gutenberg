/**
 * External dependencies
 */
import { map, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { MenuItem, MenuGroup } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function BlockNavigationList( {
	blocks,
	selectedBlockClientId,
	selectBlock,
	showNestedBlocks,
} ) {
	return (
		<ul className="editor-block-navigation__list" role="presentation">
			{ map( blocks, ( block ) => {
				const blockType = getBlockType( block.name );
				return (
					<li key={ block.clientId } role="presentation">
						<div role="presentation" className="editor-block-navigation__item">
							<MenuItem
								className={ classnames( 'editor-block-navigation__item-button', {
									'is-selected': block.clientId === selectedBlockClientId,
								} ) }
								onClick={ () => selectBlock( block.clientId ) }
								isSelected={ block.clientId === selectedBlockClientId }
							>
								<BlockIcon icon={ blockType.icon } showColors />
								{ blockType.title }
							</MenuItem>
						</div>
						{ showNestedBlocks && !! block.innerBlocks && !! block.innerBlocks.length && (
							<BlockNavigationList
								blocks={ block.innerBlocks }
								selectedBlockClientId={ selectedBlockClientId }
								selectBlock={ selectBlock }
								showNestedBlocks
							/>
						) }
					</li>
				);
			} ) }
		</ul>
	);
}

function BlockNavigation( { rootBlock, rootBlocks, selectedBlockClientId, selectBlock } ) {
	const hasHierarchy = (
		rootBlock && (
			rootBlock.clientId !== selectedBlockClientId ||
			( rootBlock.innerBlocks && rootBlock.innerBlocks.length !== 0 )
		)
	);

	return (
		<MenuGroup label={ __( 'Block Navigation' ) }>
			{ hasHierarchy && (
				<BlockNavigationList
					blocks={ [ rootBlock ] }
					selectedBlockClientId={ selectedBlockClientId }
					selectBlock={ selectBlock }
					showNestedBlocks
				/>
			) }
			{ ! hasHierarchy && (
				<BlockNavigationList
					blocks={ rootBlocks }
					selectedBlockClientId={ selectedBlockClientId }
					selectBlock={ selectBlock }
				/>
			) }
			{ ( ! rootBlocks || rootBlocks.length === 0 ) && (
				// If there are no blocks in this document, don't render a list of blocks.
				// Instead: inform the user no blocks exist yet.
				<p className="editor-block-navigation__paragraph">
					{ __( 'No blocks created yet.' ) }
				</p>
			) }
		</MenuGroup>
	);
}

export default compose(
	withSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockHierarchyRootClientId,
			getBlock,
			getBlocks,
		} = select( 'core/editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			rootBlocks: getBlocks(),
			rootBlock: selectedBlockClientId ? getBlock( getBlockHierarchyRootClientId( selectedBlockClientId ) ) : null,
			selectedBlockClientId,
		};
	} ),
	withDispatch( ( dispatch, { onSelect = noop } ) => {
		return {
			selectBlock( clientId ) {
				dispatch( 'core/editor' ).selectBlock( clientId );
				onSelect( clientId );
			},
		};
	} )
)( BlockNavigation );
