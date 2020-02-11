/**
 * External dependencies
 */
import {
	filter,
	findIndex,
	flow,
	groupBy,
	isEmpty,
	map,
	sortBy,
	without,
	includes,
} from 'lodash';
import scrollIntoView from 'dom-scroll-into-view';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import {
	Component,
	__experimentalCreateInterpolateElement,
	createRef,
} from '@wordpress/element';
import { PanelBody, withSpokenMessages, Tip } from '@wordpress/components';
import {
	isReusableBlock,
	createBlock,
	isUnmodifiedDefaultBlock,
	getBlockType,
	getBlockFromExample,
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
import BlockCard from '../block-card';
import ChildBlocks from './child-blocks';
import __experimentalInserterMenuExtension from '../inserter-menu-extension';
import { searchItems } from './search-items';

const MAX_SUGGESTED_ITEMS = 9;

const stopKeyPropagation = ( event ) => event.stopPropagation();

const getBlockNamespace = ( item ) => item.name.split( '/' )[ 0 ];

// Copied over from the Columns block. It seems like it should become part of public API.
const createBlocksFromInnerBlocksTemplate = ( innerBlocksTemplate ) => {
	return map(
		innerBlocksTemplate,
		( [ name, attributes, innerBlocks = [] ] ) =>
			createBlock(
				name,
				attributes,
				createBlocksFromInnerBlocksTemplate( innerBlocks )
			)
	);
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
			itemsPerCollection: {},
			openPanels: [ 'suggested' ],
		};
		this.onChangeSearchInput = this.onChangeSearchInput.bind( this );
		this.onHover = this.onHover.bind( this );
		this.panels = {};
		this.inserterResults = createRef();
	}

	componentDidMount() {
		if ( this.props.fetchReusableBlocks ) {
			this.props.fetchReusableBlocks();
		}
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
					openPanels: [ ...this.state.openPanels, panel ],
				} );

				this.props.setTimeout( () => {
					// We need a generic way to access the panel's container
					scrollIntoView(
						this.panels[ panel ],
						this.inserterResults.current,
						{
							alignWithTop: true,
						}
					);
				} );
			}
		};
	}

	filterOpenPanels(
		filterValue,
		itemsPerCategory,
		itemsPerCollection,
		filteredItems,
		reusableItems
	) {
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
				Object.keys( itemsPerCategory ),
				Object.keys( itemsPerCollection )
			);
		}

		return openPanels;
	}

	filter( filterValue = '' ) {
		const {
			categories,
			collections,
			debouncedSpeak,
			items,
			rootChildBlocks,
		} = this.props;

		const filteredItems = searchItems(
			items,
			categories,
			collections,
			filterValue
		);

		const childItems = filter( filteredItems, ( { name } ) =>
			includes( rootChildBlocks, name )
		);

		let suggestedItems = [];
		if ( ! filterValue ) {
			const maxSuggestedItems =
				this.props.maxSuggestedItems || MAX_SUGGESTED_ITEMS;
			suggestedItems = filter(
				items,
				( item ) => item.utility > 0
			).slice( 0, maxSuggestedItems );
		}

		const reusableItems = filter( filteredItems, { category: 'reusable' } );

		const getCategoryIndex = ( item ) => {
			return findIndex(
				categories,
				( category ) => category.slug === item.category
			);
		};
		const itemsPerCategory = flow(
			( itemList ) =>
				filter( itemList, ( item ) => item.category !== 'reusable' ),
			( itemList ) => sortBy( itemList, getCategoryIndex ),
			( itemList ) => groupBy( itemList, 'category' )
		)( filteredItems );

		// Create a new Object to avoid mutating this.props.collection
		const itemsPerCollection = { ...collections };
		Object.keys( collections ).forEach( ( namespace ) => {
			itemsPerCollection[ namespace ] = filteredItems.filter(
				( item ) => getBlockNamespace( item ) === namespace
			);
			if ( itemsPerCollection[ namespace ].length === 0 ) {
				delete itemsPerCollection[ namespace ];
			}
		} );

		this.setState( {
			hoveredItem: null,
			childItems,
			filterValue,
			suggestedItems,
			reusableItems,
			itemsPerCategory,
			itemsPerCollection,
			openPanels: this.filterOpenPanels(
				filterValue,
				itemsPerCategory,
				itemsPerCollection,
				filteredItems,
				reusableItems
			),
		} );

		const resultCount = Object.keys( itemsPerCategory ).reduce(
			( accumulator, currentCategorySlug ) => {
				return (
					accumulator + itemsPerCategory[ currentCategorySlug ].length
				);
			},
			0
		);

		const resultsFoundMessage = sprintf(
			_n( '%d result found.', '%d results found.', resultCount ),
			resultCount
		);
		debouncedSpeak( resultsFoundMessage );
	}

	onKeyDown( event ) {
		if (
			includes(
				[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ],
				event.keyCode
			)
		) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	}

	render() {
		const {
			categories,
			collections,
			instanceId,
			onSelect,
			rootClientId,
			showInserterHelpPanel,
		} = this.props;
		const {
			childItems,
			hoveredItem,
			itemsPerCategory,
			itemsPerCollection,
			openPanels,
			reusableItems,
			suggestedItems,
			filterValue,
		} = this.state;
		const isPanelOpen = ( panel ) => openPanels.indexOf( panel ) !== -1;
		const hasItems =
			! isEmpty( suggestedItems ) ||
			! isEmpty( reusableItems ) ||
			! isEmpty( itemsPerCategory ) ||
			! isEmpty( itemsPerCollection );
		const hoveredItemBlockType = hoveredItem
			? getBlockType( hoveredItem.name )
			: null;
		const hasHelpPanel = hasItems && showInserterHelpPanel;

		// Disable reason (no-autofocus): The inserter menu is a modal display, not one which
		// is always visible, and one which already incurs this behavior of autoFocus via
		// Popover's focusOnMount.
		// Disable reason (no-static-element-interactions): Navigational key-presses within
		// the menu are prevented from triggering WritingFlow and ObserveTyping interactions.
		/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
		return (
			<div
				className={ classnames( 'block-editor-inserter__menu', {
					'has-help-panel': hasHelpPanel,
				} ) }
				onKeyPress={ stopKeyPropagation }
				onKeyDown={ this.onKeyDown }
			>
				<div className="block-editor-inserter__main-area">
					<label
						htmlFor={ `block-editor-inserter__search-${ instanceId }` }
						className="screen-reader-text"
					>
						{ __( 'Search for a block' ) }
					</label>
					<input
						id={ `block-editor-inserter__search-${ instanceId }` }
						type="search"
						placeholder={ __( 'Search for a block' ) }
						className="block-editor-inserter__search"
						autoFocus
						onChange={ this.onChangeSearchInput }
					/>

					<div
						className="block-editor-inserter__results"
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

						{ !! suggestedItems.length && (
							<PanelBody
								title={ _x( 'Most used', 'blocks' ) }
								opened={ isPanelOpen( 'suggested' ) }
								onToggle={ this.onTogglePanel( 'suggested' ) }
								ref={ this.bindPanel( 'suggested' ) }
							>
								<BlockTypesList
									items={ suggestedItems }
									onSelect={ onSelect }
									onHover={ this.onHover }
								/>
							</PanelBody>
						) }

						{ map( categories, ( category ) => {
							const categoryItems =
								itemsPerCategory[ category.slug ];
							if ( ! categoryItems || ! categoryItems.length ) {
								return null;
							}
							return (
								<PanelBody
									key={ category.slug }
									title={ category.title }
									icon={ category.icon }
									opened={ isPanelOpen( category.slug ) }
									onToggle={ this.onTogglePanel(
										category.slug
									) }
									ref={ this.bindPanel( category.slug ) }
								>
									<BlockTypesList
										items={ categoryItems }
										onSelect={ onSelect }
										onHover={ this.onHover }
									/>
								</PanelBody>
							);
						} ) }

						{ map( collections, ( collection, namespace ) => {
							const collectionItems =
								itemsPerCollection[ namespace ];
							if (
								! collectionItems ||
								! collectionItems.length
							) {
								return null;
							}

							return (
								<PanelBody
									key={ namespace }
									title={ collection.title }
									icon={ collection.icon }
									opened={ isPanelOpen( namespace ) }
									onToggle={ this.onTogglePanel( namespace ) }
									ref={ this.bindPanel( namespace ) }
								>
									<BlockTypesList
										items={ collectionItems }
										onSelect={ onSelect }
										onHover={ this.onHover }
									/>
								</PanelBody>
							);
						} ) }

						{ !! reusableItems.length && (
							<PanelBody
								className="block-editor-inserter__reusable-blocks-panel"
								title={ __( 'Reusable' ) }
								opened={ isPanelOpen( 'reusable' ) }
								onToggle={ this.onTogglePanel( 'reusable' ) }
								icon="controls-repeat"
								ref={ this.bindPanel( 'reusable' ) }
							>
								<BlockTypesList
									items={ reusableItems }
									onSelect={ onSelect }
									onHover={ this.onHover }
								/>
								<a
									className="block-editor-inserter__manage-reusable-blocks"
									href={ addQueryArgs( 'edit.php', {
										post_type: 'wp_block',
									} ) }
								>
									{ __( 'Manage all reusable blocks' ) }
								</a>
							</PanelBody>
						) }

						<__experimentalInserterMenuExtension.Slot
							fillProps={ {
								onSelect,
								onHover: this.onHover,
								filterValue,
								hasItems,
							} }
						>
							{ ( fills ) => {
								if ( fills.length ) {
									return fills;
								}
								if ( ! hasItems ) {
									return (
										<p className="block-editor-inserter__no-results">
											{ __( 'No blocks found.' ) }
										</p>
									);
								}
								return null;
							} }
						</__experimentalInserterMenuExtension.Slot>
					</div>
				</div>

				{ hasHelpPanel && (
					<div className="block-editor-inserter__menu-help-panel">
						{ hoveredItem && (
							<>
								{ ! isReusableBlock( hoveredItem ) && (
									<BlockCard blockType={ hoveredItem } />
								) }
								<div className="block-editor-inserter__preview">
									{ isReusableBlock( hoveredItem ) ||
									hoveredItemBlockType.example ? (
										<div className="block-editor-inserter__preview-content">
											<BlockPreview
												padding={ 10 }
												viewportWidth={ 500 }
												blocks={
													hoveredItemBlockType.example
														? getBlockFromExample(
																hoveredItem.name,
																{
																	attributes: {
																		...hoveredItemBlockType
																			.example
																			.attributes,
																		...hoveredItem.initialAttributes,
																	},
																	innerBlocks:
																		hoveredItemBlockType
																			.example
																			.innerBlocks,
																}
														  )
														: createBlock(
																hoveredItem.name,
																hoveredItem.initialAttributes
														  )
												}
											/>
										</div>
									) : (
										<div className="block-editor-inserter__preview-content-missing">
											{ __( 'No Preview Available.' ) }
										</div>
									) }
								</div>
							</>
						) }
						{ ! hoveredItem && (
							<div className="block-editor-inserter__menu-help-panel-no-block">
								<div className="block-editor-inserter__menu-help-panel-no-block-text">
									<div className="block-editor-inserter__menu-help-panel-title">
										{ __( 'Content blocks' ) }
									</div>
									<p>
										{ __(
											'Welcome to the wonderful world of blocks! Blocks are the basis of all content within the editor.'
										) }
									</p>
									<p>
										{ __(
											'There are blocks available for all kinds of content: insert text, headings, images, lists, videos, tables, and lots more.'
										) }
									</p>
									<p>
										{ __(
											'Browse through the library to learn more about what each block does.'
										) }
									</p>
								</div>
								<Tip>
									{ __experimentalCreateInterpolateElement(
										__(
											'While writing, you can press <kbd>/</kbd> to quickly insert new blocks.'
										),
										{ kbd: <kbd /> }
									) }
								</Tip>
							</div>
						) }
					</div>
				) }
			</div>
		);
		/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
	}
}

export default compose(
	withSelect(
		(
			select,
			{ clientId, isAppender, rootClientId, showInserterHelpPanel }
		) => {
			const {
				getInserterItems,
				getBlockName,
				getBlockRootClientId,
				getBlockSelectionEnd,
				getSettings,
			} = select( 'core/block-editor' );
			const {
				getCategories,
				getCollections,
				getChildBlockNames,
			} = select( 'core/blocks' );

			let destinationRootClientId = rootClientId;
			if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
				const end = getBlockSelectionEnd();
				if ( end ) {
					destinationRootClientId =
						getBlockRootClientId( end ) || undefined;
				}
			}
			const destinationRootBlockName = getBlockName(
				destinationRootClientId
			);

			const {
				showInserterHelpPanel: showInserterHelpPanelSetting,
				__experimentalFetchReusableBlocks: fetchReusableBlocks,
			} = getSettings();

			return {
				categories: getCategories(),
				collections: getCollections(),
				rootChildBlocks: getChildBlockNames( destinationRootBlockName ),
				items: getInserterItems( destinationRootClientId ),
				showInserterHelpPanel:
					showInserterHelpPanel && showInserterHelpPanelSetting,
				destinationRootClientId,
				fetchReusableBlocks,
			};
		}
	),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const { showInsertionPoint, hideInsertionPoint } = dispatch(
			'core/block-editor'
		);

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
			showInsertionPoint() {
				const index = getInsertionIndex();
				showInsertionPoint( ownProps.destinationRootClientId, index );
			},
			hideInsertionPoint,
			onSelect( item ) {
				const { replaceBlocks, insertBlock } = dispatch(
					'core/block-editor'
				);
				const { getSelectedBlock } = select( 'core/block-editor' );
				const {
					isAppender,
					onSelect,
					__experimentalSelectBlockOnInsert: selectBlockOnInsert,
				} = ownProps;
				const { name, title, initialAttributes, innerBlocks } = item;
				const selectedBlock = getSelectedBlock();
				const insertedBlock = createBlock(
					name,
					initialAttributes,
					createBlocksFromInnerBlocksTemplate( innerBlocks )
				);

				if (
					! isAppender &&
					selectedBlock &&
					isUnmodifiedDefaultBlock( selectedBlock )
				) {
					replaceBlocks( selectedBlock.clientId, insertedBlock );
				} else {
					insertBlock(
						insertedBlock,
						getInsertionIndex(),
						ownProps.destinationRootClientId,
						selectBlockOnInsert
					);

					if ( ! selectBlockOnInsert ) {
						// translators: %s: the name of the block that has been added
						const message = sprintf(
							__( '%s block added' ),
							title
						);
						speak( message );
					}
				}

				onSelect();
				return insertedBlock;
			},
		};
	} ),
	withSpokenMessages,
	withInstanceId,
	withSafeTimeout
)( InserterMenu );
