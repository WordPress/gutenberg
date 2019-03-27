/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';

function BlockTypesList( { items, onSelect, onHover = () => {}, children } ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="editor-block-types-list block-editor-block-types-list">
			{ items && items.map( ( item ) =>
				<InserterListItem
					key={ item.id }
					className={ getBlockMenuDefaultClassName( item.id ) }
					icon={ item.icon }
					hasChildBlocksWithInserterSupport={
						item.hasChildBlocksWithInserterSupport
					}
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
				/>
			) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
