/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { NavigableMenu } from '@wordpress/components';
import { BlockIcon } from '@wordpress/blocks';

function deriveActiveItems( items ) {
	return items.filter( ( item ) => ! item.isDisabled );
}

export default class InserterGroup extends Component {
	constructor() {
		super( ...arguments );

		this.onNavigate = this.onNavigate.bind( this );

		this.activeItems = deriveActiveItems( this.props.items );
		this.state = {
			current: this.activeItems.length > 0 ? this.activeItems[ 0 ] : null,
		};
	}

	componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( this.props.items, nextProps.items ) ) {
			this.activeItems = deriveActiveItems( nextProps.items );

			// Try and preserve any still valid selected state.
			const currentIsStillActive = this.state.current && this.activeItems.some( item =>
				item.id === this.state.current.id
			);

			if ( ! currentIsStillActive ) {
				this.setState( {
					current: this.activeItems.length > 0 ? this.activeItems[ 0 ] : null,
				} );
			}
		}
	}

	/**
	 * Returns an event handler triggered when hovering a block.
	 *
	 * @param   {Object} block Block object.
	 * @return  {Func}         Event Handler.
	 */
	createToggleBlockHover( block ) {
		if ( ! this.props.onHover ) {
			return null;
		}
		return () => this.props.onHover( block );
	}

	renderItem( item ) {
		const { current } = this.state;
		const { onSelectItem } = this.props;

		const isCurrent = current && current.id === item.id;

		return (
			<button
				role="menuitem"
				key={ item.id }
				className="editor-inserter__block"
				onClick={ () => onSelectItem( item ) }
				tabIndex={ isCurrent || item.isDisabled ? null : '-1' }
				disabled={ item.isDisabled }
				onMouseEnter={ this.createToggleBlockHover( item ) }
				onMouseLeave={ this.createToggleBlockHover( null ) }
			>
				<BlockIcon icon={ item.icon } />
				{ item.title }
			</button>
		);
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
		const { labelledBy, items } = this.props;

		return (
			<NavigableMenu
				className="editor-inserter__category-blocks"
				orientation="both"
				aria-labelledby={ labelledBy }
				cycle={ false }
				onNavigate={ this.onNavigate }>
				{ items.map( this.renderItem, this ) }
			</NavigableMenu>
		);
	}
}
