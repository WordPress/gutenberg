/**
 * External dependencies
 */
import { flow, groupBy, sortBy, findIndex, filter, includes } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { Dashicon, Popover, withFocusReturn, withInstanceId } from 'components';
import { TAB, ESCAPE, LEFT, UP, RIGHT, DOWN } from 'utils/keycodes';
import { getCategories, getBlockTypes } from 'blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { showInsertionPoint, hideInsertionPoint } from '../actions';

const recentlyUsed = [];
const recentlyUsedLimit = 4;

class InserterMenu extends Component {
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
		this.addRecentlyUsedBlocks = this.addRecentlyUsedBlocks.bind( this );
		this.prependRecentlyUsedBlocks = this.prependRecentlyUsedBlocks.bind( this );
		this.getRecentlyUsedBlocks = this.getRecentlyUsedBlocks.bind( this );
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

	recordBlockUse( name ) {
		if ( includes( recentlyUsed, name ) ) {
			return;
		}
		recentlyUsed.unshift( name );
		if ( recentlyUsed.length > recentlyUsedLimit ) {
			recentlyUsed.pop();
		}
	}

	selectBlock( blockKey ) {
		return () => {
			// strip off the '_{ category }' part of the block reference key, so
			// other hooks work properly
			const name = blockKey.replace( /_[a-zA-Z]+$/, '' );
			this.props.onSelect( name );
			this.setState( {
				filterValue: '',
				currentFocus: null,
			} );
			this.recordBlockUse( name );
		};
	}

	getVisibleBlocks( blockTypes ) {
		return filter( blockTypes, this.isShownBlock );
	}

	sortBlocksByCategory( blockTypes ) {
		const getCategoryIndex = ( item ) => {
			return findIndex( getCategories(), ( category ) => category.slug === item.category );
		};

		return sortBy( blockTypes, getCategoryIndex );
	}

	groupByCategory( blockTypes ) {
		return groupBy( blockTypes, ( blockType ) => blockType.category );
	}

	getRecentlyUsedBlocks() {
		if ( 0 === recentlyUsed.length ) {
			return [];
		}
		const getRecentIndex = ( item ) => {
			return findIndex( recentlyUsed, ( blockName ) => blockName === item.name );
		};
		return sortBy( filter( getBlockTypes(), ( block ) => includes( recentlyUsed, block.name ) ), getRecentIndex );
	}

	prependRecentlyUsedBlocks( blockTypes ) {
		return [ ...this.getRecentlyUsedBlocks(), ...blockTypes ];
	}

	addRecentlyUsedBlocks( blockTypes ) {
		if ( recentlyUsed.length > 0 ) {
			blockTypes.recent = this.getRecentlyUsedBlocks();
		}
		return blockTypes;
	}

	getVisibleBlocksByCategory( blockTypes ) {
		return flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
			this.groupByCategory,
			this.addRecentlyUsedBlocks
		)( blockTypes );
	}

	getBlockRefName( blockList, blockIndex ) {
		const refNameBase = blockList[ blockIndex ].name + '_';

		if ( 'search_' === refNameBase ) {
			return 'search';
		}

		// blocks have a different reference name depending on where they are in the list,
		// because blocks can be duplicated in the 'recent' category too,
		// so this assigns the _recent suffix if they are at the top
		// of the list, inside the bounds of the recently used category
		if ( blockIndex < recentlyUsed.length ) {
			return refNameBase + 'recent';
		}

		return refNameBase + blockList[ blockIndex ].category;
	}

	findByIncrement( blockTypes, increment = 1 ) {
		// Add on a fake search block to the list to cycle through.
		const list = blockTypes.concat( { name: 'search' } );

		let currentIndex = 0;
		list.forEach( ( block, blockIndex ) => {
			const refName = this.getBlockRefName( list, blockIndex );
			if ( refName === this.state.currentFocus ) {
				currentIndex = blockIndex;
			}
		} );

		const nextIndex = currentIndex + increment;
		const highestIndex = list.length - 1;
		const lowestIndex = 0;
		let nextRef;

		if ( nextIndex > highestIndex ) {
			nextRef = this.getBlockRefName( list, lowestIndex );
		} else if ( nextIndex < lowestIndex ) {
			nextRef = this.getBlockRefName( list, highestIndex );
		} else {
			nextRef = this.getBlockRefName( list, nextIndex );
		}

		return nextRef;
	}

	findNext( blockTypes ) {
		/**
		 * null is the initial state value and triggers start at beginning.
		 */
		if ( null === this.state.currentFocus ) {
			return this.getBlockRefName( blockTypes, 0 );
		}

		return this.findByIncrement( blockTypes, 1 );
	}

	findPrevious( blockTypes ) {
		/**
		 * null is the initial state value and triggers start at beginning.
		 */
		if ( null === this.state.currentFocus ) {
			return this.getBlockRefName( blockTypes, 0 );
		}

		return this.findByIncrement( blockTypes, -1 );
	}

	focusNext() {
		const sortedByCategory = flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
			this.prependRecentlyUsedBlocks
		)( getBlockTypes() );

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
			this.prependRecentlyUsedBlocks
		)( getBlockTypes() );

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
		const visibleBlocksByCategory = this.getVisibleBlocksByCategory( getBlockTypes() );

		return (
			<Popover position={ position } className="editor-inserter__menu">
				<div role="menu" className="editor-inserter__content">
					{ getCategories()
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
									{ visibleBlocksByCategory[ category.slug ].map( ( block ) => {
										// because blocks can be in multiple categories (e.g. 'common' and 'recent')
										// we construct a key using the current category name
										let blockKey = block.name + '_';
										blockKey += 'recent' === category.slug ? 'recent' : category.slug;
										return (
											<button
												role="menuitem"
												key={ blockKey }
												className="editor-inserter__block"
												onClick={ this.selectBlock( blockKey ) }
												ref={ this.bindReferenceNode( blockKey ) }
												tabIndex="-1"
												onMouseEnter={ this.props.showInsertionPoint }
												onMouseLeave={ this.props.hideInsertionPoint }
											>
												<Dashicon icon={ block.icon } />
												{ block.title }
											</button>
										);
									} ) }
								</div>
							</div>
						) )
					}
				</div>
				<label htmlFor={ `editor-inserter__search-${ instanceId }` } className="screen-reader-text">
					{ __( 'Search blocks' ) }
				</label>
				<input
					id={ `editor-inserter__search-${ instanceId }` }
					type="search"
					placeholder={ __( 'Search…' ) }
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
