/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

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
} ) {
	return (
		<InserterListboxGroup
			className="block-editor-block-types-list"
			aria-label={ label }
		>
			{ chunk( items, 3 ).map( ( row, i ) => (
				<InserterListboxRow key={ i }>
					{ row.map( ( item, j ) => (
						<InserterListItem
							key={ item.id }
							className={ getBlockMenuDefaultClassName(
								item.id
							) }
							icon={ item.icon }
							onClick={ () => {
								onSelect( item );
								onHover( null );
							} }
							onFocus={ () => onHover( item ) }
							onMouseEnter={ () => onHover( item ) }
							onMouseLeave={ () => onHover( null ) }
							onBlur={ () => onHover( null ) }
							isDisabled={ item.isDisabled }
							title={ item.title }
							isFirst={ i === 0 && j === 0 }
						/>
					) ) }
				</InserterListboxRow>
			) ) }
			{ children }
		</InserterListboxGroup>
	);
}

export default BlockTypesList;
