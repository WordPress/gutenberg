/**
 * External dependencies
 */
import {
	filter,
	find,
	findIndex,
	flow,
	groupBy,
	isEmpty,
	map,
	some,
	sortBy,
	without,
	includes,
	deburr,
} from 'lodash';
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withSpokenMessages, PanelBody } from '@wordpress/components';
import {
	getCategories,
	isReusableBlock,
	createBlock,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose, withSafeTimeout } from '@wordpress/compose';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import BlockTypesList from '../block-types-list';
import ChildBlocks from './child-blocks';

const MAX_SUGGESTED_ITEMS = 9;

const stopKeyPropagation = ( event ) => event.stopPropagation();

/**
 * Filters an item list given a search term.
 *
 * @param {Array} items        Item list
 * @param {string} searchTerm  Search term.
 *
 * @return {Array}             Filtered item list.
 */
export const searchItems = ( items, searchTerm ) => {
	const normalizedSearchTerm = normalizeTerm( searchTerm );
	const matchSearch = ( string ) => normalizeTerm( string ).indexOf( normalizedSearchTerm ) !== -1;
	const categories = getCategories();

	return items.filter( ( item ) => {
		const itemCategory = find( categories, { slug: item.category } );
		return matchSearch( item.title ) || some( item.keywords, matchSearch ) || ( itemCategory && matchSearch( itemCategory.title ) );
	} );
};

/**
 * Converts the search term into a normalized term.
 *
 * @param {string} term The search term to normalize.
 *
 * @return {string} The normalized search term.
 */
export const normalizeTerm = ( term ) => {
	// Disregard diacritics.
	//  Input: "média"
	term = deburr( term );

	// Accommodate leading slash, matching autocomplete expectations.
	//  Input: "/media"
	term = term.replace( /^\//, '' );

	// Lowercase.
	//  Input: "MEDIA"
	term = term.toLowerCase();

	// Strip leading and trailing whitespace.
	//  Input: " media "
	term = term.trim();

	return term;
};

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			childItems: [],
			filterValue: '',
			hoveredItem: null,
			suggestedItems: [],
			reusableItems: [],
			itemsPerCategory: {},
			openPanels: [ 'suggested' ],
		};
		this.onChangeSearchInput = this.onChangeSearchInput.bind( this );
		this.onHover = this.onHover.bind( this );
		this.panels = {};
		this.inserterResults = createRef();
	}

	componentDidMount() {
		// This could be replaced by a resolver.
		this.props.fetchReusableBlocks();
		this.filter();
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.items !== this.props.items ) {
			this.filter( this.state.filterValue );
		}
	}

	onChangeSearchInput( event ) {
		this.filter( event.target.value );
	}

	onHover( item ) {
		this.setState( {
			hoveredItem: item,
		} );

		const { showInsertionPoint, hideInsertionPoint } = this.props;
		if ( item ) {
			showInsertionPoint();
		} else {
			hideInsertionPoint();
		}
	}

	bindPanel( name ) {
		return ( ref ) => {
			this.panels[ name ] = ref;
		};
	}

	onTogglePanel( panel ) {
		return () => {
			const isOpened = this.state.openPanels.indexOf( panel ) !== -1;
			if ( isOpened ) {
				this.setState( {
					openPanels: without( this.state.openPanels, panel ),
				} );
			} else {
				this.setState( {
					openPanels: [
						...this.state.openPanels,
						panel,
					],
				} );

				this.props.setTimeout( () => {
					// We need a generic way to access the panel's container
					// eslint-disable-next-line react/no-find-dom-node
					scrollIntoView( this.panels[ panel ], this.inserterResults.current, {
						alignWithTop: true,
					} );
				} );
			}
		};
	}

	filterOpenPanels( filterValue, itemsPerCategory, filteredItems, reusableItems ) {
		if ( filterValue === this.state.filterValue ) {
			return this.state.openPanels;
		}
		if ( ! filterValue ) {
			return [ 'suggested' ];
		}
		let openPanels = [];
		if ( reusableItems.length > 0 ) {
			openPanels.push( 'reusable' );
		}
		if ( filteredItems.length > 0 ) {
			openPanels = openPanels.concat(
				Object.keys( itemsPerCategory )
			);
		}
		return openPanels;
	}

	filter( filterValue = '' ) {
		const { debouncedSpeak, items, rootChildBlocks } = this.props;
		const filteredItems = searchItems( items, filterValue );

		const childItems = filter( filteredItems, ( { name } ) => includes( rootChildBlocks, name ) );

		let suggestedItems = [];
		if ( ! filterValue ) {
			const maxSuggestedItems = this.props.maxSuggestedItems || MAX_SUGGESTED_ITEMS;
			suggestedItems = filter( items, ( item ) => item.utility > 0 ).slice( 0, maxSuggestedItems );
		}

		const reusableItems = filter( filteredItems, { category: 'reusable' } );

		const getCategoryIndex = ( item ) => {
			return findIndex( getCategories(), ( category ) => category.slug === item.category );
		};
		const itemsPerCategory = flow(
			( itemList ) => filter( itemList, ( item ) => item.category !== 'reusable' ),
			( itemList ) => sortBy( itemList, getCategoryIndex ),
			( itemList ) => groupBy( itemList, 'category' )
		)( filteredItems );

		this.setState( {
			hoveredItem: null,
			childItems,
			filterValue,
			suggestedItems,
			reusableItems,
			itemsPerCategory,
			openPanels: this.filterOpenPanels(
				filterValue,
				itemsPerCategory,
				filteredItems,
				reusableItems
			),
		} );

		const resultCount = Object.keys( itemsPerCategory ).reduce( ( accumulator, currentCategorySlug ) => {
			return accumulator + itemsPerCategory[ currentCategorySlug ].length;
		}, 0 );

		const resultsFoundMessage = sprintf(
			_n( '%d result found.', '%d results found.', resultCount ),
			resultCount
		);

		debouncedSpeak( resultsFoundMessage );
	}

	onKeyDown( event ) {
		if ( includes( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ], event.keyCode ) ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	}

	render() {
		const { instanceId, onSelect, rootClientId } = this.props;
		const {
			childItems,
			hoveredItem,
			itemsPerCategory,
			openPanels,
			reusableItems,
			suggestedItems,
		} = this.state;
		const isPanelOpen = ( panel ) => openPanels.indexOf( panel ) !== -1;

		// Disable reason (no-autofocus): The inserter menu is a modal display, not one which
		// is always visible, and one which already incurs this behavior of autoFocus via
		// Popover's focusOnMount.
		// Disable reason (no-static-element-interactions): Navigational key-presses within
		// the menu are prevented from triggering WritingFlow and ObserveTyping interactions.
		/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
		return (
			<div
				className="editor-inserter__menu block-editor-inserter__menu"
				onKeyPress={ stopKeyPropagation }
				onKeyDown={ this.onKeyDown }
			>
				<label htmlFor={ `block-editor-inserter__search-${ instanceId }` } className="screen-reader-text">
					{ __( 'Search for a block' ) }
				</label>
				<input
					id={ `block-editor-inserter__search-${ instanceId }` }
					type="search"
					placeholder={ __( 'Search for a block' ) }
					className="editor-inserter__search block-editor-inserter__search"
					autoFocus
					onChange={ this.onChangeSearchInput }
				/>

				<div
					className="editor-inserter__results block-editor-inserter__results"
					ref={ this.inserterResults }
					tabIndex="0"
					role="region"
					aria-label={ __( 'Available block types' ) }
				>

					<ChildBlocks
						rootClientId={ rootClientId }
						items={ childItems }
						onSelect={ onSelect }
						onHover={ this.onHover }
					/>

					{ !! suggestedItems.length &&
						<PanelBody
							title={ _x( 'Most Used', 'blocks' ) }
							opened={ isPanelOpen( 'suggested' ) }
							onToggle={ this.onTogglePanel( 'suggested' ) }
							ref={ this.bindPanel( 'suggested' ) }
						>
							<BlockTypesList items={ suggestedItems } onSelect={ onSelect } onHover={ this.onHover } />
						</PanelBody>
					}

					{ map( getCategories(), ( category ) => {
						const categoryItems = itemsPerCategory[ category.slug ];
						if ( ! categoryItems || ! categoryItems.length ) {
							return null;
						}
						return (
							<PanelBody
								key={ category.slug }
								title={ category.title }
								icon={ category.icon }
								opened={ isPanelOpen( category.slug ) }
								onToggle={ this.onTogglePanel( category.slug ) }
								ref={ this.bindPanel( category.slug ) }
							>
								<BlockTypesList items={ categoryItems } onSelect={ onSelect } onHover={ this.onHover } />
							</PanelBody>
						);
					} ) }

					{ !! reusableItems.length && (
						<PanelBody
							className="editor-inserter__reusable-blocks-panel block-editor-inserter__reusable-blocks-panel"
							title={ __( 'Reusable' ) }
							opened={ isPanelOpen( 'reusable' ) }
							onToggle={ this.onTogglePanel( 'reusable' ) }
							icon="controls-repeat"
							ref={ this.bindPanel( 'reusable' ) }
						>
							<BlockTypesList items={ reusableItems } onSelect={ onSelect } onHover={ this.onHover } />
							<a
								className="editor-inserter__manage-reusable-blocks block-editor-inserter__manage-reusable-blocks"
								href={ addQueryArgs( 'edit.php', { post_type: 'wp_block' } ) }
							>
								{ __( 'Manage All Reusable Blocks' ) }
							</a>
						</PanelBody>
					) }
					{ isEmpty( suggestedItems ) && isEmpty( reusableItems ) && isEmpty( itemsPerCategory ) && (
						<p className="editor-inserter__no-results block-editor-inserter__no-results">{ __( 'No blocks found.' ) }</p>
					) }
				</div>

				{ hoveredItem && isReusableBlock( hoveredItem ) &&
					<BlockPreview name={ hoveredItem.name } attributes={ hoveredItem.initialAttributes } />
				}
			</div>
		);
		/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/no-noninteractive-element-interactions */
	}
}

export default compose(
	withSelect( ( select, { clientId, isAppender, rootClientId } ) => {
		const {
			getInserterItems,
			getBlockName,
			getBlockRootClientId,
			getBlockSelectionEnd,
		} = select( 'core/block-editor' );
		const {
			getChildBlockNames,
		} = select( 'core/blocks' );

		let destinationRootClientId = rootClientId;
		if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
			const end = getBlockSelectionEnd();
			if ( end ) {
				destinationRootClientId = getBlockRootClientId( end ) || undefined;
			}
		}
		const destinationRootBlockName = getBlockName( destinationRootClientId );

		return {
			rootChildBlocks: getChildBlockNames( destinationRootBlockName ),
			items: getInserterItems( destinationRootClientId ),
			destinationRootClientId,
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			showInsertionPoint,
			hideInsertionPoint,
		} = dispatch( 'core/block-editor' );

		// This should be an external action provided in the editor settings.
		const {
			__experimentalFetchReusableBlocks: fetchReusableBlocks,
		} = dispatch( 'core/editor' );

		// To avoid duplication, getInsertionIndex is extracted and used in two event handlers
		// This breaks the withDispatch not containing any logic rule.
		// Since it's a function only called when the event handlers are called,
		// it's fine to extract it.
		// eslint-disable-next-line no-restricted-syntax
		function getInsertionIndex() {
			const {
				getBlockIndex,
				getBlockSelectionEnd,
				getBlockOrder,
			} = select( 'core/block-editor' );
			const { clientId, destinationRootClientId, isAppender } = ownProps;

			// If the clientId is defined, we insert at the position of the block.
			if ( clientId ) {
				return getBlockIndex( clientId, destinationRootClientId );
			}

			// If there a selected block, we insert after the selected block.
			const end = getBlockSelectionEnd();
			if ( ! isAppender && end ) {
				return getBlockIndex( end, destinationRootClientId ) + 1;
			}

			// Otherwise, we insert at the end of the current rootClientId
			return getBlockOrder( destinationRootClientId ).length;
		}

		return {
			fetchReusableBlocks,
			showInsertionPoint() {
				const index = getInsertionIndex();
				showInsertionPoint( ownProps.destinationRootClientId, index );
			},
			hideInsertionPoint,
			onSelect( item ) {
				const {
					replaceBlocks,
					insertBlock,
				} = dispatch( 'core/block-editor' );
				const {
					getSelectedBlock,
				} = select( 'core/block-editor' );
				const { isAppender } = ownProps;
				const { name, initialAttributes } = item;
				const selectedBlock = getSelectedBlock();
				const insertedBlock = createBlock( name, initialAttributes );
				if ( ! isAppender && selectedBlock && isUnmodifiedDefaultBlock( selectedBlock ) ) {
					replaceBlocks( selectedBlock.clientId, insertedBlock );
				} else {
					insertBlock(
						insertedBlock,
						getInsertionIndex(),
						ownProps.destinationRootClientId
					);
				}

				ownProps.onSelect();
			},
		};
	} ),
	withSpokenMessages,
	withInstanceId,
	withSafeTimeout
)( InserterMenu );
