/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { ifCondition, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import BlockIcon from '../block-icon';

function ChildBlocks( { rootBlockIcon, rootBlockTitle, items, ...props } ) {
	return (
		<div className="block-editor-inserter__child-blocks">
			{ ( rootBlockIcon || rootBlockTitle ) && (
				<div className="block-editor-inserter__parent-block-header">
					<BlockIcon icon={ rootBlockIcon } showColors />
					{ rootBlockTitle && <h2>{ rootBlockTitle }</h2> }
				</div>
			) }
			<BlockTypesList items={ items } { ...props } />
		</div>
	);
}

export default compose(
	ifCondition( ( { items } ) => items && items.length > 0 ),
	withSelect( ( select, { rootClientId } ) => {
		const { getBlockType } = select( 'core/blocks' );
		const { getBlockName } = select( 'core/block-editor' );
		const rootBlockName = getBlockName( rootClientId );
		const rootBlockType = getBlockType( rootBlockName );
		return {
			rootBlockTitle: rootBlockType && rootBlockType.title,
			rootBlockIcon: rootBlockType && rootBlockType.icon,
		};
	} )
)( ChildBlocks );
