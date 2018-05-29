/**
 * External dependencies
 */
import { isEqual } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { NavigableMenu } from '@wordpress/components';
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function deriveActiveItems( items ) {
	return items.filter( ( item ) => ! item.isDisabled );
}

class ItemList extends Component {
	constructor() {
		super( ...arguments );
		this.onNavigate = this.onNavigate.bind( this );
		this.activeItems = deriveActiveItems( this.props.items );
		this.state = {
			current: this.activeItems.length > 0 ? this.activeItems[ 0 ] : null,
		};
	}

	componentDidUpdate( prevProps ) {
		if ( ! isEqual( this.props.items, prevProps.items ) ) {
			this.activeItems = deriveActiveItems( this.props.items );

			// Try and preserve any still valid selected state.
			const currentIsStillActive = this.state.current && this.activeItems.some( ( item ) =>
				item.id === this.state.current.id
			);

			if ( ! currentIsStillActive ) {
				this.setState( {
					current: this.activeItems.length > 0 ? this.activeItems[ 0 ] : null,
				} );
			}
		}
	}

	onNavigate( index ) {
		const { activeItems } = this;
		const dest = activeItems[ index ];
		if ( dest ) {
			this.setState( {
				current: dest,
			} );
		}
	}

	render() {
		const { items, onSelect, onHover } = this.props;
		const { current } = this.state;

		return (
			<NavigableMenu
				className="editor-inserter__item-list"
				orientation="both"
				cycle={ false }
				onNavigate={ this.onNavigate }
			>
				{ items.map( ( item ) => {
					const isCurrent = current && current.id === item.id;
					return (
						<button
							role="menuitem"
							key={ item.id }
							className={
								classnames(
									'editor-inserter__item',
									getBlockMenuDefaultClassName( item.id ),
									{
										'editor-inserter__item-with-childs': item.hasChildBlocks,
									}
								)
							}
							onClick={ () => onSelect( item ) }
							tabIndex={ isCurrent || item.isDisabled ? null : '-1' }
							disabled={ item.isDisabled }
							onMouseEnter={ () => onHover( item ) }
							onMouseLeave={ () => onHover( null ) }
							onFocus={ () => onHover( item ) }
							onBlur={ () => onHover( null ) }
							aria-label={ item.title } // Fix for IE11 and JAWS 2018.
						>
							<span className="editor-inserter__item-icon">
								<BlockIcon icon={ item.icon } />
							</span>

							<span className="editor-inserter__item-title">
								{ item.title }
							</span>
						</button>
					);
				} ) }
			</NavigableMenu>
		);
	}
}

export default ItemList;
