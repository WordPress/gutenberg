/**
 * External dependencies
 */
import { flow, groupBy, sortBy, findIndex, filter } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Dashicon, Popover, withFocusReturn, withInstanceId } from 'components';
import { TAB, ESCAPE, LEFT, UP, RIGHT, DOWN } from 'utils/keycodes';

/**
 * Internal dependencies
 */
import './style.scss';
import { showInsertionPoint, hideInsertionPoint } from '../actions';

class InserterMenu extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.nodes = {};
		this.state = {
			filterValue: '',
			currentFocus: null,
		};
		this.filter = this.filter.bind( this );
		this.isShownBlock = this.isShownBlock.bind( this );
		this.setSearchFocus = this.setSearchFocus.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.getVisibleBlocks = this.getVisibleBlocks.bind( this );
		this.sortBlocksByCategory = this.sortBlocksByCategory.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	isShownBlock( block ) {
		return block.title.toLowerCase().indexOf( this.state.filterValue.toLowerCase() ) !== -1;
	}

	bindReferenceNode( nodeName ) {
		return ( node ) => this.nodes[ nodeName ] = node;
	}

	filter( event ) {
		this.setState( {
			filterValue: event.target.value,
		} );
	}

	selectBlock( name ) {
		return () => {
			this.props.onSelect( name );
			this.setState( {
				filterValue: '',
				currentFocus: null,
			} );
		};
	}

	getVisibleBlocks( blockTypes ) {
		return filter( blockTypes, this.isShownBlock );
	}

	sortBlocksByCategory( blockTypes ) {
		const getCategoryIndex = ( item ) => {
			return findIndex( wp.blocks.getCategories(), ( category ) => category.slug === item.category );
		};

		return sortBy( blockTypes, getCategoryIndex );
	}

	groupByCategory( blockTypes ) {
		return groupBy( blockTypes, ( blockType ) => blockType.category );
	}

	getVisibleBlocksByCategory( blockTypes ) {
		return flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
			this.groupByCategory
		)( blockTypes );
	}

	findByIncrement( blockTypes, increment = 1 ) {
		// Add on a fake search block to the list to cycle through.
		const list = blockTypes.concat( { name: 'search' } );

		const currentIndex = findIndex( list, ( blockType ) => this.state.currentFocus === blockType.name );
		const nextIndex = currentIndex + increment;
		const highestIndex = list.length - 1;
		const lowestIndex = 0;

		if ( nextIndex > highestIndex ) {
			return list[ lowestIndex ].name;
		}

		if ( nextIndex < lowestIndex ) {
			return list[ highestIndex ].name;
		}

		// Return the name of the next block type.
		return list[ nextIndex ].name;
	}

	findNext( blockTypes ) {
		/**
		 * null is the initial state value and triggers start at beginning.
		 */
		if ( null === this.state.currentFocus ) {
			return blockTypes[ 0 ].name;
		}

		return this.findByIncrement( blockTypes, 1 );
	}

	findPrevious( blockTypes ) {
		/**
		 * null is the initial state value and triggers start at beginning.
		 */
		if ( null === this.state.currentFocus ) {
			return blockTypes[ 0 ].name;
		}

		return this.findByIncrement( blockTypes, -1 );
	}

	focusNext() {
		const sortedByCategory = flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
		)( wp.blocks.getBlockTypes() );

		// If the block list is empty return early.
		if ( ! sortedByCategory.length ) {
			return;
		}

		const nextBlock = this.findNext( sortedByCategory );
		this.changeMenuSelection( nextBlock );
	}

	focusPrevious() {
		const sortedByCategory = flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
		)( wp.blocks.getBlockTypes() );

		// If the block list is empty return early.
		if ( ! sortedByCategory.length ) {
			return;
		}

		const nextBlock = this.findPrevious( sortedByCategory );
		this.changeMenuSelection( nextBlock );
	}

	onKeyDown( keydown ) {
		switch ( keydown.keyCode ) {
			case TAB:
				if ( keydown.shiftKey ) {
					// Previous.
					keydown.preventDefault();
					this.focusPrevious( this );
					break;
				}
				// Next.
				keydown.preventDefault();
				this.focusNext( this );
				break;
			case ESCAPE:
				keydown.preventDefault();
				this.props.onSelect( null );

				break;
			case LEFT:
				if ( this.state.currentFocus === 'search' ) {
					return;
				}
				this.focusPrevious( this );

				break;
			case UP:
				keydown.preventDefault();
				this.focusPrevious( this );

				break;
			case RIGHT:
				if ( this.state.currentFocus === 'search' ) {
					return;
				}
				this.focusNext( this );

				break;
			case DOWN:
				keydown.preventDefault();
				this.focusNext( this );

				break;
			default :
				break;
		}
	}

	changeMenuSelection( refName ) {
		this.setState( {
			currentFocus: refName,
		} );

		// Focus the DOM node.
		this.nodes[ refName ].focus();
	}

	setSearchFocus() {
		this.changeMenuSelection( 'search' );
	}

	render() {
		const { position, instanceId } = this.props;
		const visibleBlocksByCategory = this.getVisibleBlocksByCategory( wp.blocks.getBlockTypes() );

		return (
			<Popover position={ position } className="editor-inserter__menu">
				<div role="menu" className="editor-inserter__content">
					{ wp.blocks.getCategories()
						.map( ( category ) => !! visibleBlocksByCategory[ category.slug ] && (
							<div key={ category.slug }>
								<div
									className="editor-inserter__separator"
									id={ `editor-inserter__separator-${ category.slug }-${ instanceId }` }
									aria-hidden="true"
								>
									{ category.title }
								</div>
								<div
									className="editor-inserter__category-blocks"
									role="menu"
									tabIndex="0"
									aria-labelledby={ `editor-inserter__separator-${ category.slug }-${ instanceId }` }
								>
									{ visibleBlocksByCategory[ category.slug ].map( ( block ) => (
										<button
											role="menuitem"
											key={ block.name }
											className="editor-inserter__block"
											onClick={ this.selectBlock( block.name ) }
											ref={ this.bindReferenceNode( block.name ) }
											tabIndex="-1"
											onMouseEnter={ this.props.showInsertionPoint }
											onMouseLeave={ this.props.hideInsertionPoint }
										>
											<Dashicon icon={ block.icon } />
											{ block.title }
										</button>
									) ) }
								</div>
							</div>
						) )
					}
				</div>
				<label htmlFor={ `editor-inserter__search-${ instanceId }` } className="screen-reader-text">
					{ wp.i18n.__( 'Search blocks' ) }
				</label>
				<input
					id={ `editor-inserter__search-${ instanceId }` }
					type="search"
					placeholder={ wp.i18n.__( 'Search…' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
					onClick={ this.setSearchFocus }
					ref={ this.bindReferenceNode( 'search' ) }
					tabIndex="-1"
				/>
			</Popover>
		);
	}
}

const connectComponent = connect(
	undefined,
	{ showInsertionPoint, hideInsertionPoint }
);

export default flow(
	withInstanceId,
	withFocusReturn,
	connectComponent
)( InserterMenu );
