/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

class ItemList extends Component {
	render() {
		const { items, onSelect, onHover } = this.props;

		return (
			<div className="editor-inserter__item-list">
				{ items.map( ( item ) => {
					return (
						<button
							key={ item.id }
							className={
								classnames(
									'editor-inserter__item',
									getBlockMenuDefaultClassName( item.id ),
									{
										'editor-inserter__item-has-children': item.hasChildBlocks,
									}
								)
							}
							onClick={ () => onSelect( item ) }
							disabled={ item.isDisabled }
							onMouseEnter={ () => onHover( item ) }
							onMouseLeave={ () => onHover( null ) }
							onFocus={ () => onHover( item ) }
							onBlur={ () => onHover( null ) }
							aria-label={ item.title } // Fix for IE11 and JAWS 2018.
						>
							<span className="editor-inserter__item-icon">
								<BlockIcon icon={ item.icon } />
								{ item.hasChildBlocks && <span className="editor-inserter__item-icon-stack" /> }
							</span>

							<span className="editor-inserter__item-title">
								{ item.title }
							</span>
						</button>
					);
				} ) }
			</div>
		);
	}
}

export default ItemList;
