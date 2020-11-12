/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';
import { useContext } from '@wordpress/element';
/**
 * External dependencies
 */
import { CompositeGroup } from 'reakit/Composite';

function chunk( array, size ) {
	const chunks = [];
	for ( let i = 0, j = array.length; i < j; i += size ) {
		chunks.push( array.slice( i, i + size ) );
	}
	return chunks;
}

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';
import InserterContext from '../inserter/context';

function BlockTypesList( {
	items = [],
	onSelect,
	onHover = () => {},
	children,
	label,
} ) {
	const compositeState = useContext( InserterContext );
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<div
			role="listbox"
			className="block-editor-block-types-list"
			aria-label={ label }
		>
			{ chunk( items, 3 ).map( ( row, i ) => (
				<CompositeGroup
					state={ compositeState }
					key={ i }
					role="presentation"
				>
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
							isFirst={ i + j === 0 }
						/>
					) ) }
				</CompositeGroup>
			) ) }
			{ children }
		</div>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
