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
import scrollIntoView from 'dom-scroll-into-view';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import {
	TabbableContainer,
	withInstanceId,
	withSpokenMessages,
	IconButton,
	withSafeTimeout,
} from '@wordpress/components';
import { getCategories, isSharedBlock, withEditorSettings } from '@wordpress/blocks';
import { keycodes } from '@wordpress/utils';
import { withSelect, withDispatch } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import './style.scss';
import NoBlocks from './no-blocks';
import BlockInserterNavigation from './navigation';
import InserterGroup from './group';
import BlockPreview from '../block-preview';
import tabs from './tabs';

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
		this.tabs = {};
		this.state = {
			filterValue: '',
			tab: 'suggested',
			selectedItem: null,
			isNavigationOpened: false,
			selectedTab: null,
		};
		this.filter = this.filter.bind( this );
		this.searchItems = this.searchItems.bind( this );
		this.getItemsForTab = this.getItemsForTab.bind( this );
		this.sortItems = this.sortItems.bind( this );
		this.selectItem = this.selectItem.bind( this );
		this.previewItem = this.previewItem.bind( this );
		this.toggleNavigation = this.toggleNavigation.bind( this );
		this.selectTab = this.selectTab.bind( this );
		this.bindScrollContainer = this.bindScrollContainer.bind( this );
	}

	componentDidMount() {
		this.props.fetchSharedBlocks();
	}

	componentDidUpdate() {
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
	}

	bindScrollContainer( ref ) {
		this.scrollContainer = ref;
	}

	bindTab( tab ) {
		return ( ref ) => this.tabs[ tab ] = ref;
	}

	selectTab( tab ) {
		this.setState( {
			selectedTab: tab,
			filterValue: '',
		} );

		if ( ! this.props.isLargeViewport ) {
			this.setState( { isNavigationOpened: false } );
		}

		// Wait for a rerender so the tab is rendered
		this.props.setTimeout( () => {
			scrollIntoView( this.tabs[ tab ], this.scrollContainer, {
				onlyScrollIfNeeded: true,
				alignWithTop: true,
			} );
		} );
	}

	toggleNavigation() {
		this.setState( ( state ) => ( {
			isNavigationOpened: ! state.isNavigationOpened,
		} ) );
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
		const { selectedItem, isNavigationOpened } = this.state;
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
				<div className="editor-inserter__filter-form">
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
					<IconButton
						className="editor-inserter__navigation-toggle"
						icon="filter-alt"
						label={ __( 'Toggle inserter navigation' ) }
						onClick={ this.toggleNavigation }
					/>
				</div>
				{ isNavigationOpened && <BlockInserterNavigation onSelect={ this.selectTab } onClose={ this.toggleNavigation } /> }
				<div className="editor-inserter__results" ref={ this.bindScrollContainer }>
					{ ! isSearching && tabs.map( ( tab ) => (
						<div
							key={ tab.name }
							role="menu"
							className={ classnames( 'editor-inserter__tab', 'is-' + tab.name ) }
							ref={ this.bindTab( tab.name ) }
						>
							<div className="editor-inserter__tab-title">{ tab.title }</div>
							{ this.renderTabView( tab.name ) }
						</div>
					) ) }
					{ isSearching &&
						<div role="menu">
							{ this.renderCategories( this.getVisibleItemsByCategory( items ) ) }
						</div>
					}
				</div>
				{ selectedItem && isSharedBlock( selectedItem ) &&
					<BlockPreview name={ selectedItem.name } attributes={ selectedItem.initialAttributes } />
				}
			</TabbableContainer>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default compose(
	withEditorSettings( ( settings ) => {
		const { allowedBlockTypes } = settings;

		return {
			allowedBlockTypes,
		};
	} ),
	withSelect( ( select, { allowedBlockTypes } ) => {
		const { getInserterItems, getFrecentInserterItems } = select( 'core/editor' );
		return {
			items: getInserterItems( allowedBlockTypes ),
			frecentItems: getFrecentInserterItems( allowedBlockTypes ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		fetchSharedBlocks: dispatch( 'core/editor' ).fetchSharedBlocks,
	} ) ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withSpokenMessages,
	withInstanceId,
	withSafeTimeout
)( InserterMenu );
