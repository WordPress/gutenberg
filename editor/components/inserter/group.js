/**
 * External dependencies
 */
import { isEqual, find } from 'lodash';

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
			const current = find( this.activeItems, ( item ) => isEqual( item, this.state.current ) );
			if ( ! current ) {
				this.setState( {
					current: this.activeItems.length > 0 ? this.activeItems[ 0 ] : null,
				} );
			}
		}
	}

	renderItem( item, index ) {
		const { current } = this.state;
		const { onSelectItem } = this.props;

		return (
			<button
				role="menuitem"
				key={ index }
				className="editor-inserter__block"
				onClick={ () => onSelectItem( item ) }
				tabIndex={ isEqual( current, item ) || item.isDisabled ? null : '-1' }
				disabled={ item.isDisabled }
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
