/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';

class Sortable extends Component {
	//constructor
	constructor() {
		super( ...arguments );

		this.focusIndex = null;

		this.onSortStart = this.onSortStart.bind( this );
		this.onSortEnd = this.onSortEnd.bind( this );
		this.state = {
			justSorted: false,
		};
	}

	/**
     * Get the sortable list:
	 * @return {function} the Container creator
     */
	getSortableList() {
		const { items, children, className, firstNode, lastNode } = this.props;

		//create the sortable container:
		return SortableContainer( () => {
			//loop through all available children
			return (
				<ul className={ `components-sortable ${ className }` }>
					{ firstNode }
					{ children.map( ( child, index ) => {
						child.props.tabindex = '0';

						//generate a SortableElement using the item and the child
						const SortableItem = SortableElement( () => {
							return ( child );
						} );

						//set a temporary class so we can find it post-render:
						if ( index === this.focusIndex ) {
							child.props.class = `sortable-focus ${ child.props.className }`;
						}

						//display Sortable Element
						return (
							<SortableItem key={ `item-${ index }` } index={ index } item={ items[ index ] } />
						);
					} ) }
					{ lastNode }
				</ul>
			);
		} );
	}

	shouldComponentUpdate( nextProps ) {
		const should = nextProps.items.every( ( item, index ) => {
			return this.props.items[ index ] === item;
		} );
		const justSorted = this.state.justSorted;
		if ( justSorted ) {
			this.setState( {
				justSorted: false,
			} );
		}
		const lengthChanged = nextProps.items.length !== this.props.items.length;

		return should || justSorted || lengthChanged;
	}

	render() {
		const items = this.props.items;
		const SortableList = this.getSortableList();

		return (
		//return the sortable list, with props from our upper-lever component
			<SortableList
				axis="xy"
				items={ items }
				onSortStart={ this.onSortStart }
				onSortEnd={ this.onSortEnd }
				distance={ 10 }
				helperClass={ this.props.className }
			/>
		);
	}

	/*************************************/
	/**         Events                    */
	/*************************************/

	/**
     * What to do on sort start ?
     * @param {Object} object with access to the element, its index and the collection
	 * @param {Event} event with the event info
     */
	onSortStart( { node, index, collection }, event ) {
		//run the corresponding function in the upper-lever component:
		if ( typeof ( this.props.onSortStart ) === 'function' ) {
			this.props.onSortStart( { node, index, collection }, event );
		}
	}

	/**
     * What to do on sort end?
     *
     * @param {Object} object holding old and new indexes and the collection
     */
	onSortEnd( { oldIndex, newIndex } ) {
		//create a new items array:
		const _items = arrayMove( this.props.items, oldIndex, newIndex );
		this.setState( {
			justSorted: true,
		} );

		//and run the corresponding function in the upper-lever component:
		if ( typeof ( this.props.onSortEnd ) === 'function' ) {
			this.props.onSortEnd( _items );
		}
	}
}

export default Sortable;
