/**
 * External dependencies
 */
import { connect } from 'react-redux';

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
			focusedElementRef: null
		};
		this.filter = this.filter.bind( this );
		this.instanceId = this.constructor.instances++;
		this.isShownBlock = this.isShownBlock.bind( this );
		this.changeMenuSelection = this.changeMenuSelection.bind( this );
		this.setSearchFocus = this.setSearchFocus.bind( this );
		this.bindReferenceNode = this.bindReferenceNode.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.listVisibleBlocksByCategory = this.listVisibleBlocksByCategory.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	isShown( filterValue, string ) {
		return string.toLowerCase().indexOf( filterValue.toLowerCase() ) !== -1;
	}

	isShownBlock( filterValue, block ) {
		return this.isShown( filterValue, block.title );
	}

	visibleFocusables( nodes, filterValue ) {
		const focusables = [];

		for ( const refName in nodes ) {
			if ( this.isShown( filterValue, refName ) && 'search' !== refName ) {
				focusables.push( refName );
			}
		}

		// Add search regardless at the end.
		focusables.push( 'search' );

		return focusables;
	}

	nextFocusableRef( component ) {
		const focusables = this.visibleFocusables( component.nodes, component.state.filterValue );

		// Initiate the menu with the first block.
		if ( null === component.state.focusedElementRef ) {
			return focusables[ 0 ];
		}

		const currentIndex = focusables.findIndex( ( elementRef ) => elementRef === component.state.focusedElementRef );
		return this.nextFocusInList( currentIndex, focusables );
	}

	previousFocusableRef( component ) {
		const focusables = this.visibleFocusables( component.nodes, component.state.filterValue );

		// Initiate the menu with the first block.
		if ( null === component.state.focusedElementRef ) {
			return focusables[ 0 ];
		}

		const currentIndex = focusables.findIndex( ( elementRef ) => elementRef === component.state.focusedElementRef );
		return this.previousFocusInList( currentIndex, focusables );
	}

	/**
	 * Get the next focusable element in list.
	 *
	 * @param {int} currentIndex Current index in the list.
	 * @param {array} focusables List of focusable elements attached to node references.
	 * @return {string} Name of the next focus.
	 */
	nextFocusInList( currentIndex, focusables ) {
		const nextIndex = currentIndex + 1;
		const highestIndex = focusables.length - 1;

		// Check boundary so that the index is does not exceed the length.
		if ( nextIndex > highestIndex ) {
			// Cycle back to other end.
			return focusables[ 0 ];
		}

		return focusables[ nextIndex ];
	}

	/**
	 * Get the previousFocusInList.
	 *
	 * @param {int} currentIndex Current index in the list.
	 * @param {array} focusables List of focusable elements attached to node references.
	 * @return {string} Name of the previous focus.
	 */
	previousFocusInList( currentIndex, focusables ) {
		const nextIndex = currentIndex - 1;
		const lowestIndex = 0;

		// Check boundary so that the index is does not exceed the length.
		if ( nextIndex < lowestIndex ) {
			// Cycle back to other end.
			return focusables[ focusables.length - 1 ];
		}

		return focusables[ nextIndex ];
	}

	focusNextFocusableRef( component ) {
		const next = component.nextFocusableRef( component );
		component.changeMenuSelection( next );
	}

	focusPreviousFocusableRef( component ) {
		const previous = component.previousFocusableRef( component );
		component.changeMenuSelection( previous );
	}

	listVisibleBlocksByCategory( blocks ) {
		return blocks.reduce( ( groups, block ) => {
			if ( ! this.isShownBlock( this.state.filterValue, block ) ) {
				return groups;
			}
			if ( ! groups[ block.category ] ) {
				groups[ block.category ] = [];
			}
			groups[ block.category ].push( block );
			return groups;
		}, {} );
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
				focusedElementRef: null
			} );
		};
	}

	onKeyDown( keydown ) {
		keydown.preventDefault();

		if ( this.isNextKeydown( keydown ) ) {
			this.focusNextFocusableRef( this );
		}

		if ( this.isPreviousKeydown( keydown ) ) {
			this.focusPreviousFocusableRef( this );
		}

		if ( this.isEscapeKey( keydown ) ) {
			this.props.closeMenu();
		}
	}

	changeMenuSelection( refName ) {
		this.setState( {
			focusedElementRef: refName
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
		const visibleBlocksByCategory = this.listVisibleBlocksByCategory( blocks );
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
