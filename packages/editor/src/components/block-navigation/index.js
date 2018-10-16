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
		<ul className="editor-block-navigation__list">
			{ map( blocks, ( block ) => {
				const blockType = getBlockType( block.name );
				return (
					<li key={ block.clientId }>
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
		<MenuGroup>
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
