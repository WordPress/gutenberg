/**
 * External dependencies
 */
import { flow, groupBy, sortBy, findIndex, filter, find, some } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Popover, withFocusReturn, withInstanceId, withSpokenMessages } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';
import { getCategories, getBlockTypes, BlockIcon } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlocks, getRecentlyUsedBlocks } from '../selectors';
import { showInsertionPoint, hideInsertionPoint } from '../actions';

const { TAB, ESCAPE, LEFT, UP, RIGHT, DOWN } = keycodes;

export const searchBlocks = ( blocks, searchTerm ) => {
	const normalizedSearchTerm = searchTerm.toLowerCase().trim();
	const matchSearch = ( string ) => string.toLowerCase().indexOf( normalizedSearchTerm ) !== -1;

	return blocks.filter( ( block ) =>
		matchSearch( block.title ) || some( block.keywords, matchSearch )
	);
};

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );
		this.nodes = {};
		this.state = {
			filterValue: '',
			currentFocus: 'search',
			tab: 'recent',
		};
		this.filter = this.filter.bind( this );
		this.setSearchFocus = this.setSearchFocus.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.searchBlocks = this.searchBlocks.bind( this );
		this.getBlocksForCurrentTab = this.getBlocksForCurrentTab.bind( this );
		this.sortBlocks = this.sortBlocks.bind( this );
		this.addRecentBlocks = this.addRecentBlocks.bind( this );

		this.tabScrollTop = { recent: 0, blocks: 0, embeds: 0 };
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	componentDidUpdate( prevProps, prevState ) {
		const searchResults = this.searchBlocks( getBlockTypes() );
		// Announce the blocks search results to screen readers.
		if ( !! searchResults.length ) {
			this.props.debouncedSpeak( sprintf( _n(
				'%d result found',
				'%d results found',
				searchResults.length
			), searchResults.length ), 'assertive' );
		} else {
			this.props.debouncedSpeak( __( 'No results.' ), 'assertive' );
		}

		if ( this.state.tab !== prevState.tab ) {
			this.tabContainer.scrollTop = this.tabScrollTop[ this.state.tab ];
		}
	}

	isDisabledBlock( blockType ) {
		return blockType.useOnce && find( this.props.blocks, ( { name } ) => blockType.name === name );
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

	searchBlocks( blockTypes ) {
		return searchBlocks( blockTypes, this.state.filterValue );
	}

	getBlocksForCurrentTab() {
		// if we're searching, use everything, otherwise just get the blocks visible in this tab
		if ( this.state.filterValue ) {
			return getBlockTypes();
		}
		switch ( this.state.tab ) {
			case 'recent':
				return this.props.recentlyUsedBlocks;
			case 'blocks':
				return filter( getBlockTypes(), ( block ) => block.category !== 'embed' );
			case 'embeds':
				return filter( getBlockTypes(), ( block ) => block.category === 'embed' );
		}
	}

	sortBlocks( blockTypes ) {
		if ( 'recent' === this.state.tab && ! this.state.filterValue ) {
			return blockTypes;
		}

		const getCategoryIndex = ( item ) => {
			return findIndex( getCategories(), ( category ) => category.slug === item.category );
		};

		return sortBy( blockTypes, getCategoryIndex );
	}

	addRecentBlocks( blocksByCategory ) {
		blocksByCategory.recent = this.props.recentlyUsedBlocks;
		return blocksByCategory;
	}

	groupByCategory( blockTypes ) {
		return groupBy( blockTypes, ( blockType ) => blockType.category );
	}

	getVisibleBlocksByCategory( blockTypes ) {
		return flow(
			this.searchBlocks,
			this.sortBlocks,
			this.groupByCategory,
			this.addRecentBlocks
		)( blockTypes );
	}

	findByIncrement( blockTypes, increment = 1 ) {
		const currentIndex = findIndex( blockTypes, ( blockType ) => this.state.currentFocus === blockType.name );
		const highestIndex = blockTypes.length - 1;
		const lowestIndex = 0;

		let nextIndex = currentIndex;
		let blockType;
		do {
			nextIndex += increment;
			// Return the name of the next block type.
			blockType = blockTypes[ nextIndex ];
			if ( blockType && ! this.isDisabledBlock( blockType ) ) {
				return blockType.name;
			}
		} while ( blockType );

		if ( nextIndex > highestIndex ) {
			return 'search';
		}

		if ( nextIndex < lowestIndex ) {
			return 'search';
		}
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
			this.searchBlocks,
			this.sortBlocks,
		)( this.getBlocksForCurrentTab() );

		// If the block list is empty return early.
		if ( ! sortedByCategory.length ) {
			return;
		}

		const nextBlock = this.findNext( sortedByCategory );
		this.changeMenuSelection( nextBlock );
	}

	focusPrevious() {
		const sortedByCategory = flow(
			this.searchBlocks,
			this.sortBlocks,
		)( this.getBlocksForCurrentTab() );

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

	getBlockItem( block ) {
		const disabled = this.isDisabledBlock( block );
		return (
			<button
				role="menuitem"
				key={ block.name }
				className="editor-inserter__block"
				onClick={ this.selectBlock( block.name ) }
				ref={ this.bindReferenceNode( block.name ) }
				tabIndex="-1"
				onMouseEnter={ ! disabled && this.props.showInsertionPoint }
				onMouseLeave={ ! disabled && this.props.hideInsertionPoint }
				disabled={ disabled }
			>
				<BlockIcon icon={ block.icon } />
				{ block.title }
			</button>
		);
	}

	switchTab( tab ) {
		// store the scrollTop of the tab switched from
		this.tabScrollTop[ this.state.tab ] = this.tabContainer.scrollTop;
		this.setState( { tab: tab } );
	}

	render() {
		const { position, onClose, instanceId } = this.props;
		const isSearching = this.state.filterValue;
		const visibleBlocksByCategory = this.getVisibleBlocksByCategory( this.getBlocksForCurrentTab() );

		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<Popover
				position={ position }
				isOpen
				onClose={ onClose }
				className="editor-inserter__menu">
				<label htmlFor={ `editor-inserter__search-${ instanceId }` } className="screen-reader-text">
					{ __( 'Search blocks' ) }
				</label>
				<input
					autoFocus
					id={ `editor-inserter__search-${ instanceId }` }
					type="search"
					placeholder={ __( 'Search…' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
					onClick={ this.setSearchFocus }
					ref={ this.bindReferenceNode( 'search' ) }
					tabIndex="-1"
				/>
				<div role="menu" className="editor-inserter__content"
					ref={ ( ref ) => this.tabContainer = ref }>
					{ this.state.tab === 'recent' && ! isSearching &&
						<div className="editor-inserter__recent">
							<div
								className="editor-inserter__category-blocks"
								role="menu"
								tabIndex="0"
								aria-labelledby={ `editor-inserter__separator-${ 'recent' }-${ instanceId }` }
								key={ 'recent' }
							>
								{ visibleBlocksByCategory.recent.map( ( block ) => this.getBlockItem( block ) ) }
							</div>
						</div>
					}
					{ this.state.tab === 'blocks' && ! isSearching &&
						getCategories()
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
										{ visibleBlocksByCategory[ category.slug ].map( ( block ) => this.getBlockItem( block ) ) }
									</div>
								</div>
							) )
					}
					{ this.state.tab === 'embeds' && ! isSearching &&
						getCategories()
							.map( ( category ) => !! visibleBlocksByCategory[ category.slug ] && (
								<div
									className="editor-inserter__category-blocks"
									role="menu"
									tabIndex="0"
									aria-labelledby={ `editor-inserter__separator-${ category.slug }-${ instanceId }` }
									key={ category.slug }
								>
									{ visibleBlocksByCategory[ category.slug ].map( ( block ) => this.getBlockItem( block ) ) }
								</div>
							) )
					}
					{ isSearching &&
						getCategories()
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
										{ visibleBlocksByCategory[ category.slug ].map( ( block ) => this.getBlockItem( block ) ) }
									</div>
								</div>
							) )
					}
				</div>
				{ ! isSearching &&
					<div className="editor-inserter__tabs is-recent">
						<button
							className={ `editor-inserter__tab ${ this.state.tab === 'recent' ? 'is-active' : '' }` }
							onClick={ () => this.switchTab( 'recent' ) }
						>
							{ __( 'Recent' ) }
						</button>
						<button
							className={ `editor-inserter__tab ${ this.state.tab === 'blocks' ? 'is-active' : '' }` }
							onClick={ () => this.switchTab( 'blocks' ) }
						>
							{ __( 'Blocks' ) }
						</button>
						<button
							className={ `editor-inserter__tab ${ this.state.tab === 'embeds' ? 'is-active' : '' }` }
							onClick={ () => this.switchTab( 'embeds' ) }
						>
							{ __( 'Embeds' ) }
						</button>
					</div>
				}
			</Popover>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

const connectComponent = connect(
	( state ) => {
		return {
			recentlyUsedBlocks: getRecentlyUsedBlocks( state ),
			blocks: getBlocks( state ),
		};
	},
	{ showInsertionPoint, hideInsertionPoint }
);

export default flow(
	withInstanceId,
	withSpokenMessages,
	withFocusReturn,
	connectComponent
)( InserterMenu );
