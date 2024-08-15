/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';
import { InserterListboxGroup, InserterListboxRow } from '../inserter-listbox';

function chunk( array, size ) {
	const chunks = [];
	for ( let i = 0, j = array.length; i < j; i += size ) {
		chunks.push( array.slice( i, i + size ) );
	}
	return chunks;
}

function BlockTypesList( {
	items = [],
	onSelect,
	onHover = () => {},
	children,
	label,
	isDraggable = true,
} ) {
	const className = 'block-editor-block-types-list';
	const listId = useInstanceId( BlockTypesList, className );
	return (
		<InserterListboxGroup className={ className } aria-label={ label }>
			{ chunk( items, 3 ).map( ( row, i ) => (
				<InserterListboxRow key={ i }>
					{ row.map( ( item, j ) => (
						<InserterListItem
							key={ item.id }
							item={ item }
							className={ getBlockMenuDefaultClassName(
								item.id
							) }
							onSelect={ onSelect }
							onHover={ onHover }
							isDraggable={ isDraggable && ! item.isDisabled }
							isFirst={ i === 0 && j === 0 }
							rowId={ `${ listId }-${ i }` }
						/>
					) ) }
				</InserterListboxRow>
			) ) }
			{ children }
		</InserterListboxGroup>
	);
}

export default BlockTypesList;
