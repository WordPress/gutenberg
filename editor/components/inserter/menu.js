/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from 'components/dashicon';

class InserterMenu extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.blockTypes = wp.blocks.getBlocks();
		this.categories = wp.blocks.getCategories();
		this.nodes = {};
		this.state = {
			filterValue: '',
			currentFocus: null
		};
		this.filter = this.filter.bind( this );
		this.instanceId = this.constructor.instances++;
		this.isShownBlock = this.isShownBlock.bind( this );
		this.changeMenuSelection = this.changeMenuSelection.bind( this );
		this.setSearchFocus = this.setSearchFocus.bind( this );
		this.bindReferenceNode = this.bindReferenceNode.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.getVisibleBlocks = this.getVisibleBlocks.bind( this );
		this.getVisibleBlocksByCategory = this.getVisibleBlocksByCategory.bind( this );
		this.getCategoryIndex = this.getCategoryIndex.bind( this );
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
		const binder = ( node ) => this.nodes[ nodeName ] = node;
		binder.bind( this );

		return binder;
	}

	isNextKeydown( keydown ) {
		return keydown.code === 'ArrowDown'
			|| keydown.code === 'ArrowRight'
			|| ( keydown.code === 'Tab' && keydown.shiftKey === false );
	}

	isPreviousKeydown( keydown ) {
		return keydown.code === 'ArrowUp'
			|| keydown.code === 'ArrowLeft'
			|| ( keydown.code === 'Tab' && keydown.shiftKey === true );
	}

	isEscapeKey( keydown ) {
		return keydown.code === 'Escape';
	}

	filter( event ) {
		this.setState( {
			filterValue: event.target.value
		} );
	}

	selectBlock( slug ) {
		return () => {
			this.props.onInsertBlock( slug );
			this.props.onSelect();
			this.setState( {
				filterValue: '',
				currentFocus: null
			} );
		};
	}

	getVisibleBlocks( blockTypes ) {
		return blockTypes.filter( this.isShownBlock );
	}

	getCategoryIndex( item ) {
		const categories = this.categories;
		return categories.findIndex( ( category ) => category.slug === item.slug );
	}

	sortBlocksByCategory( blockTypes ) {
		return blockTypes.sort( ( a, b ) => {
			return this.getCategoryIndex( a ) - this.getCategoryIndex( b );
		} );
	}

	groupByCategory( blockTypes ) {
		return blockTypes.reduce( ( accumulator, block ) => {
			// If already an array push block on else add array of block.
			if ( Array.isArray( accumulator[ block.category ] ) ) {
				accumulator[ block.category ].push( block );
				return accumulator;
			}

			accumulator[ block.category ] = [ block ];
			return accumulator;
		}, {} );
	}

	getVisibleBlocksByCategory( blockTypes ) {
		return flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
			this.groupByCategory
		)( blockTypes );
	}

	findNext( currentBlock, blockTypes ) {
		/**
		 * 'search' or null are the values that will trigger iterating back to
		 * the top of the list of block types.
		 */
		if ( null === currentBlock || 'search' === currentBlock ) {
			return blockTypes[ 0 ].slug;
		}

		const currentIndex = blockTypes.findIndex( ( blockType ) => currentBlock === blockType.slug );
		const nextIndex = currentIndex + 1;
		const highestIndex = blockTypes.length - 1;

		/**
		 * Default currently for going past the blocks is search, may need to be
		 * revised in the future as more focusable elements are added.
		 */
		if ( nextIndex > highestIndex ) {
			return 'search';
		}

		// Return the slug of the next block type.
		return blockTypes[ nextIndex ].slug;
	}

	findPrevious( currentBlock, blockTypes ) {
		/**
		 * null will trigger iterating back to the top of the list of block
		 * types.
		 */
		if ( null === currentBlock ) {
			return blockTypes[ 0 ].slug;
		}

		const highestIndex = blockTypes.length - 1;

		// If the search bar is focused navigate to the bottom of the block list.
		if ( 'search' === currentBlock ) {
			return blockTypes[ highestIndex ].slug;
		}

		const currentIndex = blockTypes.findIndex( ( blockType ) => currentBlock === blockType.slug );
		const previousIndex = currentIndex - 1;
		const lowestIndex = 0;

		/**
		 * Default currently for going past the blocks is search, may need to be
		 * revised in the future as more non block focusable elements are added.
		 */
		if ( previousIndex < lowestIndex ) {
			return 'search';
		}

		// Return the slug of the next block type.
		return blockTypes[ previousIndex ].slug;
	}

	focusNext( component ) {
		const sortedByCategory = flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
		)( component.blockTypes );
		const currentBlock = component.state.currentFocus;

		const nextBlock = this.findNext( currentBlock, sortedByCategory );
		this.changeMenuSelection( nextBlock );
	}

	focusPrevious( component ) {
		const sortedByCategory = flow(
			this.getVisibleBlocks,
			this.sortBlocksByCategory,
		)( component.blockTypes );
		const currentBlock = component.state.currentFocus;

		const nextBlock = this.findPrevious( currentBlock, sortedByCategory );
		this.changeMenuSelection( nextBlock );
	}

	onKeyDown( keydown ) {
		if ( this.isNextKeydown( keydown ) ) {
			keydown.preventDefault();
			this.focusNext( this );
		}

		if ( this.isPreviousKeydown( keydown ) ) {
			keydown.preventDefault();
			this.focusPrevious( this );
		}

		if ( this.isEscapeKey( keydown ) ) {
			keydown.preventDefault();
			this.props.closeMenu();
		}
	}

	changeMenuSelection( refName ) {
		this.setState( {
			currentFocus: refName
		} );

		// Focus the DOM node.
		this.nodes[ refName ].focus();
	}

	setSearchFocus() {
		this.changeMenuSelection( 'search' );
	}

	render() {
		const { position = 'top' } = this.props;
		const blocks = this.blockTypes;
		const visibleBlocksByCategory = this.getVisibleBlocksByCategory( blocks );
		const categories = this.categories;

		return (
			<div className={ `editor-inserter__menu is-${ position }` } tabIndex="0">
				<div className="editor-inserter__arrow" />
				<div role="menu" className="editor-inserter__content">
					{ categories
						.map( ( category ) => !! visibleBlocksByCategory[ category.slug ] && (
							<div key={ category.slug }>
								<div
									className="editor-inserter__separator"
									id={ `editor-inserter__separator-${ category.slug }-${ this.instanceId }` }
									aria-hidden="true"
								>
									{ category.title }
								</div>
								<div
									className="editor-inserter__category-blocks"
									role="menu"
									tabIndex="0"
									aria-labelledby={ `editor-inserter__separator-${ category.slug }-${ this.instanceId }` }
								>
									{ visibleBlocksByCategory[ category.slug ].map( ( { slug, title, icon } ) => (
										<button
											role="menuitem"
											key={ slug }
											className="editor-inserter__block"
											onClick={ this.selectBlock( slug ) }
											ref={ this.bindReferenceNode( slug ) }
											tabIndex="-1"
										>
											<Dashicon icon={ icon } />
											{ title }
										</button>
									) ) }
								</div>
							</div>
						) )
					}
				</div>
				<label htmlFor={ `editor-inserter__search-${ this.instanceId }` } className="screen-reader-text">
					{ wp.i18n.__( 'Search blocks' ) }
				</label>
				<input
					id={ `editor-inserter__search-${ this.instanceId }` }
					type="search"
					placeholder={ wp.i18n.__( 'Search…' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
					onClick={ this.setSearchFocus }
					ref={ this.bindReferenceNode( 'search' ) }
				/>
			</div>
		);
	}
}

InserterMenu.instances = 0;

export default connect(
	undefined,
	( dispatch ) => ( {
		onInsertBlock( slug ) {
			dispatch( {
				type: 'INSERT_BLOCK',
				block: wp.blocks.createBlock( slug )
			} );
		}
	} )
)( InserterMenu );
