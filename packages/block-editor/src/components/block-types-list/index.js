/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';

/**
 * Stateless function component which renders its received `children` prop.
 *
 * @param {Object} props Props object.
 *
 * @return {WPElement} Rendered children.
 */
const RENDER_CHILDREN = ( props ) => props.children;

function BlockTypesList( {
	items,
	onSelect,
	onHover = () => {},
	renderItem: RenderItem = RENDER_CHILDREN,
	children,
} ) {
	items = map( items, ( item ) => {
		return (
			<RenderItem key={ item.id } item={ item }>
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
			</RenderItem>
		);
	} );

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="editor-block-types-list">
			{ items }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockTypesList;
