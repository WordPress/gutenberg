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
import { withInstanceId, withSpokenMessages, TabPanel, TabbableContainer, NavigableGrid } from '@wordpress/components';
import { getCategories, getBlockTypes, BlockIcon } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlocks, getRecentlyUsedBlocks } from '../selectors';
import { showInsertionPoint, hideInsertionPoint } from '../actions';

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
			tab: 'recent',
		};
		this.filter = this.filter.bind( this );
		this.searchBlocks = this.searchBlocks.bind( this );
		this.getBlocksForTab = this.getBlocksForTab.bind( this );
		this.sortBlocks = this.sortBlocks.bind( this );

		this.tabScrollTop = { recent: 0, blocks: 0, embeds: 0 };
		this.switchTab = this.switchTab.bind( this );
	}

	componentDidUpdate( prevProps, prevState ) {
		const searchResults = this.searchBlocks( getBlockTypes() );
		// Announce the blocks search results to screen readers.
		if ( this.state.filterValue && !! searchResults.length ) {
			this.props.debouncedSpeak( sprintf( _n(
				'%d result found',
				'%d results found',
				searchResults.length
			), searchResults.length ), 'assertive' );
		} else if ( this.state.filterValue ) {
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
			} );
		};
	}

	searchBlocks( blockTypes ) {
		return searchBlocks( blockTypes, this.state.filterValue );
	}

	getBlocksForTab( tab ) {
		// if we're searching, use everything, otherwise just get the blocks visible in this tab
		if ( this.state.filterValue ) {
			return getBlockTypes();
		}
		switch ( tab ) {
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

	groupByCategory( blockTypes ) {
		return groupBy( blockTypes, ( blockType ) => blockType.category );
	}

	getVisibleBlocksByCategory( blockTypes ) {
		return flow(
			this.searchBlocks,
			this.sortBlocks,
			this.groupByCategory
		)( blockTypes );
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
				onMouseEnter={ ! disabled ? this.props.showInsertionPoint : null }
				onMouseLeave={ ! disabled ? this.props.hideInsertionPoint : null }
				disabled={ disabled }
			>
				<BlockIcon icon={ block.icon } />
				{ block.title }
			</button>
		);
	}

	renderBlocks( blocks, separatorSlug ) {
		const { instanceId } = this.props;
		const labelledBy = separatorSlug === undefined ? null : `editor-inserter__separator-${ separatorSlug }-${ instanceId }`;
		return (
			<NavigableGrid width={ 2 }
				className="editor-inserter__category-blocks"
				tabIndex="0"
				aria-labelledby={ labelledBy }
			>
				{ blocks.map( ( block ) => this.getBlockItem( block ) ) }
			</NavigableGrid>
		);
	}

	renderCategory( category, blocks ) {
		const { instanceId } = this.props;
		return blocks && (
			<div key={ category.slug }>
				<div
					className="editor-inserter__separator"
					id={ `editor-inserter__separator-${ category.slug }-${ instanceId }` }
					aria-hidden="true"
				>
					{ category.title }
				</div>
				{ this.renderBlocks( blocks, category.slug ) }
			</div>
		);
	}

	renderCategories( visibleBlocksByCategory ) {
		return getCategories().map(
			( category ) => this.renderCategory( category, visibleBlocksByCategory[ category.slug ] )
		);
	}

	switchTab( tab ) {
		// store the scrollTop of the tab switched from
		this.tabScrollTop[ this.state.tab ] = this.tabContainer.scrollTop;
		this.setState( { tab } );
	}

	renderTabView( tab, visibleBlocks ) {
		switch ( tab ) {
			case 'recent':
				return this.renderBlocks( this.props.recentlyUsedBlocks, undefined );

			case 'embed':
				return this.renderBlocks( visibleBlocks.embed, undefined );

			default:
				return this.renderCategories( visibleBlocks, undefined );
		}
	}

	render() {
		const { instanceId } = this.props;
		const isSearching = this.state.filterValue;

		return (
			<TabbableContainer className="editor-inserter__menu">
				<label htmlFor={ `editor-inserter__search-${ instanceId }` } className="screen-reader-text">
					{ __( 'Search for a block' ) }
				</label>
				<input
					id={ `editor-inserter__search-${ instanceId }` }
					type="search"
					placeholder={ __( 'Search for a block' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
					ref={ this.bindReferenceNode( 'search' ) }
				/>
				{ ! isSearching &&
					<TabPanel className="editor-inserter__tabs" activeClass={ 'is-active' }
						tabs={ [
							{
								name: 'recent',
								title: __( 'Recent' ),
								className: 'editor-inserter__tab',
								onSelect: this.switchTab,
							},
							{
								name: 'blocks',
								title: __( 'Blocks' ),
								className: 'editor-inserter__tab',
								onSelect: this.switchTab,
							},
							{
								name: 'embeds',
								title: __( 'Embeds' ),
								className: 'editor-inserter__tab',
								onSelect: this.switchTab,
							},
						] }>
						{
							( tabKey ) => {
								const blocksForTab = this.getBlocksForTab( tabKey );
								const visibleBlocks = this.getVisibleBlocksByCategory( blocksForTab );

								return <div ref={ ( ref ) => this.tabContainer = ref }
									className="editor-inserter__content">
									{ this.renderTabView( tabKey, visibleBlocks ) }
								</div>;
							}
						}
					</TabPanel>
				}
				{ isSearching &&
					<div role="menu" className="editor-inserter__content">
						{ this.renderCategories( this.getVisibleBlocksByCategory( getBlockTypes() ) ) }
					</div>
				}
			</TabbableContainer>
		);
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
	connectComponent
)( InserterMenu );
