/**
 * External dependencies
 */
import {
	filter,
	findIndex,
	flow,
	groupBy,
	includes,
	pick,
	some,
	sortBy,
	isEmpty,
} from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import {
	TabPanel,
	TabbableContainer,
	withInstanceId,
	withSpokenMessages,
	withContext,
} from '@wordpress/components';
import { getCategories, isSharedBlock } from '@wordpress/blocks';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import NoBlocks from './no-blocks';

import { getInserterItems, getFrecentInserterItems } from '../../store/selectors';
import { fetchSharedBlocks } from '../../store/actions';
import { default as InserterGroup } from './group';
import BlockPreview from '../block-preview';

export const searchItems = ( items, searchTerm ) => {
	const normalizedSearchTerm = searchTerm.toLowerCase().trim();
	const matchSearch = ( string ) => string.toLowerCase().indexOf( normalizedSearchTerm ) !== -1;

	return items.filter( ( item ) =>
		matchSearch( item.title ) || some( item.keywords, matchSearch )
	);
};

/**
 * Module constants
 */
const ARROWS = pick( keycodes, [ 'UP', 'DOWN', 'LEFT', 'RIGHT' ] );

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );
		this.nodes = {};
		this.state = {
			filterValue: '',
			tab: 'suggested',
			selectedItem: null,
		};
		this.filter = this.filter.bind( this );
		this.searchItems = this.searchItems.bind( this );
		this.getItemsForTab = this.getItemsForTab.bind( this );
		this.sortItems = this.sortItems.bind( this );
		this.selectItem = this.selectItem.bind( this );

		this.tabScrollTop = { suggested: 0, blocks: 0, embeds: 0 };
		this.switchTab = this.switchTab.bind( this );
		this.previewItem = this.previewItem.bind( this );
	}

	componentDidMount() {
		this.props.fetchSharedBlocks();
	}

	componentDidUpdate( prevProps, prevState ) {
		const searchResults = this.searchItems( this.props.items );
		// Announce the search results to screen readers.
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

	filter( event ) {
		this.setState( {
			filterValue: event.target.value,
		} );
	}

	previewItem( item ) {
		this.setState( { selectedItem: item } );
	}

	selectItem( item ) {
		this.props.onSelect( item );
		this.setState( {
			filterValue: '',
		} );
	}

	searchItems( items ) {
		return searchItems( items, this.state.filterValue );
	}

	getItemsForTab( tab ) {
		const { items, frecentItems } = this.props;

		// If we're searching, use everything, otherwise just get the items visible in this tab
		if ( this.state.filterValue ) {
			return items;
		}

		let predicate;
		switch ( tab ) {
			case 'suggested':
				return frecentItems;

			case 'blocks':
				predicate = ( item ) => item.category !== 'embed' && item.category !== 'shared';
				break;

			case 'embeds':
				predicate = ( item ) => item.category === 'embed';
				break;

			case 'shared':
				predicate = ( item ) => item.category === 'shared';
				break;
		}

		return filter( items, predicate );
	}

	sortItems( items ) {
		if ( 'suggested' === this.state.tab && ! this.state.filterValue ) {
			return items;
		}

		const getCategoryIndex = ( item ) => {
			return findIndex( getCategories(), ( category ) => category.slug === item.category );
		};

		return sortBy( items, getCategoryIndex );
	}

	groupByCategory( items ) {
		return groupBy( items, ( item ) => item.category );
	}

	getVisibleItemsByCategory( items ) {
		return flow(
			this.searchItems,
			this.sortItems,
			this.groupByCategory
		)( items );
	}

	renderItems( items, separatorSlug ) {
		const { instanceId } = this.props;
		const labelledBy = separatorSlug === undefined ? null : `editor-inserter__separator-${ separatorSlug }-${ instanceId }`;
		return (
			<InserterGroup
				items={ items }
				labelledBy={ labelledBy }
				onSelectItem={ this.selectItem }
				onHover={ this.previewItem }
			/>
		);
	}

	renderCategory( category, items ) {
		const { instanceId } = this.props;
		return items && (
			<div key={ category.slug }>
				<div
					className="editor-inserter__separator"
					id={ `editor-inserter__separator-${ category.slug }-${ instanceId }` }
					aria-hidden="true"
				>
					{ category.title }
				</div>
				{ this.renderItems( items, category.slug ) }
			</div>
		);
	}

	renderCategories( visibleItemsByCategory ) {
		if ( isEmpty( visibleItemsByCategory ) ) {
			return (
				<NoBlocks />
			);
		}

		return getCategories().map(
			( category ) => this.renderCategory( category, visibleItemsByCategory[ category.slug ] )
		);
	}

	switchTab( tab ) {
		// store the scrollTop of the tab switched from
		this.tabScrollTop[ this.state.tab ] = this.tabContainer.scrollTop;
		this.setState( { tab } );
	}

	renderTabView( tab ) {
		const itemsForTab = this.getItemsForTab( tab );

		// If the Suggested tab is selected, don't render category headers
		if ( 'suggested' === tab ) {
			return this.renderItems( itemsForTab );
		}

		// If the Shared tab is selected and we have no results, display a friendly message
		if ( 'shared' === tab && itemsForTab.length === 0 ) {
			return (
				<NoBlocks>
					{ __( 'No shared blocks.' ) }
				</NoBlocks>
			);
		}

		const visibleItemsByCategory = this.getVisibleItemsByCategory( itemsForTab );

		// If our results have only items from one category, don't render category headers
		const categories = Object.keys( visibleItemsByCategory );
		if ( categories.length === 1 ) {
			const [ soleCategory ] = categories;
			return this.renderItems( visibleItemsByCategory[ soleCategory ] );
		}

		return this.renderCategories( visibleItemsByCategory );
	}

	// Passed to TabbableContainer, extending its event-handling logic
	eventToOffset( event ) {
		// If a tab (Suggested, Blocks, …) is focused, pressing the down arrow
		// moves focus to the selected panel below.
		if (
			event.keyCode === keycodes.DOWN &&
			document.activeElement.getAttribute( 'role' ) === 'tab'
		) {
			return 1; // Move focus forward
		}

		// Prevent cases of focus being unexpectedly stolen up in the tree.
		if ( includes( ARROWS, event.keyCode ) ) {
			return 0; // Don't move focus, but prevent event propagation
		}

		// Implicit `undefined` return: let the event propagate
	}

	render() {
		const { instanceId, items } = this.props;
		const { selectedItem } = this.state;
		const isSearching = this.state.filterValue;

		// Disable reason: The inserter menu is a modal display, not one which
		// is always visible, and one which already incurs this behavior of
		// autoFocus via Popover's focusOnMount.

		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<TabbableContainer
				className="editor-inserter__menu"
				deep
				eventToOffset={ this.eventToOffset }
			>
				<label htmlFor={ `editor-inserter__search-${ instanceId }` } className="screen-reader-text">
					{ __( 'Search for a block' ) }
				</label>
				<input
					id={ `editor-inserter__search-${ instanceId }` }
					type="search"
					placeholder={ __( 'Search for a block' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
					autoFocus
				/>
				{ ! isSearching &&
					<TabPanel className="editor-inserter__tabs" activeClass="is-active"
						onSelect={ this.switchTab }
						tabs={ [
							{
								name: 'suggested',
								title: __( 'Suggested' ),
								className: 'editor-inserter__tab',
							},
							{
								name: 'blocks',
								title: __( 'Blocks' ),
								className: 'editor-inserter__tab',
							},
							{
								name: 'embeds',
								title: __( 'Embeds' ),
								className: 'editor-inserter__tab',
							},
							{
								name: 'shared',
								title: __( 'Shared' ),
								className: 'editor-inserter__tab',
							},
						] }
					>
						{ ( tabKey ) => (
							<div ref={ ( ref ) => this.tabContainer = ref }>
								{ this.renderTabView( tabKey ) }
							</div>
						) }
					</TabPanel>
				}
				{ isSearching &&
					<div role="menu" className="editor-inserter__search-results">
						{ this.renderCategories( this.getVisibleItemsByCategory( items ) ) }
					</div>
				}
				{ selectedItem && isSharedBlock( selectedItem ) &&
					<BlockPreview name={ selectedItem.name } attributes={ selectedItem.initialAttributes } />
				}
			</TabbableContainer>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default compose(
	withContext( 'editor' )( ( settings ) => {
		const { blockTypes } = settings;

		return {
			enabledBlockTypes: blockTypes,
		};
	} ),
	connect(
		( state, ownProps ) => {
			return {
				items: getInserterItems( state, ownProps.enabledBlockTypes ),
				frecentItems: getFrecentInserterItems( state, ownProps.enabledBlockTypes ),
			};
		},
		{ fetchSharedBlocks }
	),
	withSpokenMessages,
	withInstanceId
)( InserterMenu );
