/**
 * Internal dependencies
 */
import './style.scss';
import ItemList from './item-list';
import BlockIcon from '../block-icon';

function ChildBlocks( { rootBlockIcon, rootBlockTitle, items, ...props } ) {
	if ( ! items || ! items.length ) {
		return null;
	}
	return (
		<div className="editor-inserter__child-blocks">
			{ ( rootBlockIcon || rootBlockTitle ) && (
				<div className="editor-inserter__parent-block-header">
					{ rootBlockIcon && (
						<div className="editor-inserter__parent-block-icon">
							<BlockIcon icon={ rootBlockIcon } />
						</div>
					) }
					{ rootBlockTitle && <h2>{ rootBlockTitle }</h2> }
				</div>
			) }
			<ItemList items={ items } { ...props } />
		</div>
	);
}

export default ChildBlocks;
