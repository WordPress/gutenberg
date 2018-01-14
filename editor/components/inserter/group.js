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

/**
 * Determines the inserter items that are able to be selected. These are the
 * inserter items which are not disabled.
 * 
 * @param {Editor.InserterItem[]}   items Inserter items to filter.
 * @returns {Editor.InserterItem[]}       Active inserter items.
 */
function deriveActiveItems( items ) {
	return items.filter( ( item ) => ! item.isDisabled );
}

export default class InserterGroup extends Component {
	/**
	 * @inheritdoc
	 */
	constructor() {
		super( ...arguments );

		this.onNavigate = this.onNavigate.bind( this );

		this.activeItems = deriveActiveItems( this.props.items );
		this.state = {
			current: this.activeItems.length > 0 ? this.activeItems[ 0 ] : null,
		};
	}

	/**
	 * @inheritdoc
	 */
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

	/**
	 * Renders a single inserter item as it ought to appear in the menu.
	 * 
	 * @param {Editor.InserterItem} item  Inserter item.
	 * @param {number}              index Index of the item.
	 * @returns {JSX.Element}             Rendered menu button.
	 */
	renderItem( item, index ) {
		const { current } = this.state;
		const { selectItem } = this.props;

		return (
			<button
				role="menuitem"
				key={ index }
				className="editor-inserter__block"
				onClick={ selectItem( item ) }
				tabIndex={ isEqual( current, item ) || item.isDisabled ? null : '-1' }
				disabled={ item.isDisabled }
			>
				<BlockIcon icon={ item.icon } />
				{ item.title }
			</button>
		);
	}

	/**
	 * Callback invoked when the user navigates the menu using their keyboard.
	 * 
	 * @param {number} index Index of the item selected by the user.
	 */
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
