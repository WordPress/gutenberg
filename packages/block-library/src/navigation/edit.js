/**
 * External dependencies
 */
import { escape, upperFirst, reduce, map, filter, difference, concat, isEqual, includes } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	useEffect,
	useState,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	__experimentalUseColors,
} from '@wordpress/block-editor';

import { createBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	Button,
	CheckboxControl,
	PanelBody,
	Placeholder,
	Spinner,
	Toolbar,
	ToolbarGroup,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';
import BlockNavigationList from './block-navigation-list';
import BlockColorsStyleSelector from './block-colors-selector';
import * as navIcons from './icons';
import { useQueryPages } from './use-query';

/**
 * Return a page object according to the given id.
 * @param {array} pages Current blog pages.
 * @param {number} id Page id.
 * @return {object} Page object.
 */
const getPageById = ( pages, id ) => filter( pages, ( { id: page_id } ) => page_id === id )[0];

/**
 * Check if the page is updating comparing the `modified`
 * value stored in the item attribute.
 *
 * @param {array} pages Current blog pages.
 * @param {object} item Navigation item object.
 * @return {boolean|undefined} True is the page has been updated. Otherwise, False.
 */
const isPageUpdated = ( pages, item ) => {
	if ( ! item || ! item.modified ) {
		return;
	}

	const page = getPageById( pages, item.id );
	if ( ! page || ! page.modified ) {
		return;
	}

	return +new Date( page.modified ) > +new Date( item.modified );
};

/**
 * Create <NavigationItem> blocks from the given page objects.
 *
 * @param {array} ids Pages id to map.
 * @param {array} pages Pages collection.
 * @return {array} <NavigationLink /> collection.
 */
const createNavigationLinkFromPages = ( ids, pages ) => map( ids, ( id ) => {
	const { type, url, title, modified } = getPageById( pages, id ) ;
	return createBlock(
		'core/navigation-link', {
			type, id,
			url, label: escape(title),
			title: escape(title),
			opensInNewTab: false,
			modified,
		}
	)
} );

function Navigation( {
	attributes,
	clientId,
	setAttributes,
	hasExistingNavItems,
	updateNavItemBlocks,
	innerBlocks,
} ) {
	/* eslint-disable @wordpress/no-unused-vars-before-return */
	const { TextColor } = __experimentalUseColors(
		[ { name: 'textColor', property: 'color' } ],
	);
	/* eslint-enable @wordpress/no-unused-vars-before-return */
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );

	const { itemsIds, removedItemsByUser } = attributes;

	const [ populateFromExistingPages, setPopulateFromExistingPages ] = useState( false );

	const [ itemsToAdd, setItemsToAdd ] = useState( [] );
	const [ itemsToRemove, setItemsToRemove ] = useState( [] );
	const [ itemsToUpdate, setItemsToUpdate ] = useState( [] );

	/**
	 * Fetching data.
	 */
	const { pages, isValidating: isRequestingPages } = useQueryPages( {
		parent: 0,
		order: 'asc',
		orderby: 'id',
	} );

	/**
	 * Items checker.
	 * Checks if the current Navigation menu has duplicated and/or unAdded items,
	 * building an object from the inner Blocks with the following shape:
	 *
	 *   {
	 *     itemsById: {
	 *         <page-id>: <count>, -> Amount of items with this ID. Generally this value is `1`.
	 *         ...: n,
	 *     },
	 *     added: [ <page-id>, ... ], -> Current items with the pages ids,
	 *     repeated: [ <page-id>, ... ], -> All of repeated items, by page ID,
	 *     removed: [ <page-id>, ... ], -> Page IDs which have not been added to the nav.
	 * }
	 */
	useEffect( () => {
		const itemsChecker = reduce(
			map(
				filter( innerBlocks, ( { attributes: attrs } ) => attrs.id && attrs.id >= 0 ),
				( { attributes } ) => ( {
					id: attributes.id,
					modified: attributes.modified,
				} )
			),
			( acc, item ) => ( {
					itemsById: {
						...acc.itemsById,
						[ item.id ]: {
							amount: acc.itemsById[ item.id ] ? acc.itemsById[ item.id ].amount + 1 : 1,
							modified: item.modified,
						}
					},
					added: [ ...acc.added, item.id ],
					repeated: acc.itemsById[ item.id ] ? [ ...acc.repeated, item.id ] : acc.repeated,
					modified: isPageUpdated( pages, item ) ? [ ...acc.modified, item.id ] : acc.modified,
			} ),
			{ itemsById: {}, added: [], repeated: [], modified: [] }
		);

		itemsChecker.removed = removedItemsByUser;

		// Add / Remove / Replace items.
		const pagesIds = map( pages, ( { id } ) => ( id ) );
		const unAdded = difference( pagesIds, itemsChecker.added );
		const removedByAdmin = difference( itemsChecker.added, pagesIds );

		// Local constants. Temporary.
		const _newItemsToAdd = [];
		const _itemsToRemove = [];

		// Check if there are new pages without an associated item.
		if ( unAdded.length ) {
			for ( const index in unAdded ) {
				const unAddedPageId = unAdded[ index ];

				// Recently removed.
				if ( includes( itemsIds, unAddedPageId ) ) {
					_itemsToRemove.push( unAddedPageId );
					if ( itemsChecker.itemsById[ unAddedPageId ] ) {
						delete itemsChecker.itemsById[ unAddedPageId ];
					}
				} else if ( ! includes( removedItemsByUser, unAddedPageId ) ) {
					_newItemsToAdd.push( unAddedPageId );
				}
			}
		}

		// Store added-items in the block attribute.
		if ( ! isEqual( itemsChecker.added.sort(), itemsIds.sort() ) ) {
			setAttributes( { itemsIds: itemsChecker.added } );
		}

		// Store removed-items by user in the block attribute.
		if ( _itemsToRemove.length ) {
			setAttributes( { removedItemsByUser: concat( removedItemsByUser, _itemsToRemove ) } );
		}

		setItemsToAdd( _newItemsToAdd );
		setItemsToRemove( filter( removedByAdmin, pageId => ! includes( itemsChecker.removed, pageId ) ) );
		setItemsToUpdate( itemsChecker.modified );
	}, [ pages, innerBlocks ] );

	/*
	 * Update Navigation links.
	 */
	useEffect( () => {
		if ( ! populateFromExistingPages ) {
			return;
		}

		// Update items if pages have been modified.
		if ( itemsToUpdate && itemsToUpdate.length ) {
			return updateNavItemBlocks( map( innerBlocks, ( block ) => includes( itemsToUpdate, block.attributes.id )
				? createNavigationLinkFromPages( [ block.attributes.id ], pages )[0]
				: block
			) );
		}

		// Add new items from new pages.
		if ( itemsToAdd && itemsToAdd.length ) {
			return updateNavItemBlocks( [ ...innerBlocks, ...createNavigationLinkFromPages( itemsToAdd, pages ) ] );
		}

		// Remove items if pages have been unpublished.
		if ( itemsToRemove && itemsToRemove.length ) {
			return updateNavItemBlocks( filter( innerBlocks, ( { attributes } ) => ! includes( itemsToRemove, attributes.id ) ) );
		}
	}, [ populateFromExistingPages, itemsToAdd, itemsToRemove, itemsToUpdate ] );


	//
	// HANDLERS
	//
	function handleItemsAlignment( align ) {
		return () => {
			const itemsJustification = attributes.itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification,
			} );
		};
	}

	const handleCreateEmpty = () => {
		const emptyNavLinkBlock = createBlock( 'core/navigation-link' );
		updateNavItemBlocks( [ emptyNavLinkBlock ] );
	};

	const hasPages = pages && pages.length;

	const blockClassNames = classnames( 'wp-block-navigation', {
		[ `items-justification-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
	} );

	// If we don't have existing items or the User hasn't
	// indicated they want to automatically add top level Pages
	// then show the Placeholder
	if ( ! hasExistingNavItems ) {
		return (
			<Fragment>
				<InspectorControls>
					{ ! isRequestingPages && (
						<PanelBody
							title={ __( 'Navigation Settings' ) }
						>
							<CheckboxControl
								value={ attributes.automaticallyAdd }
								onChange={ ( automaticallyAdd ) => {
									setAttributes( { automaticallyAdd } );
								} }
								label={ __( 'Automatically add new pages' ) }
								help={ __( 'Automatically add new top level pages to this navigation.' ) }
							/>
						</PanelBody>
					) }
				</InspectorControls>
				<Placeholder
					className="wp-block-navigation-placeholder"
					icon="menu"
					label={ __( 'Navigation' ) }
					instructions={ __( 'Create a Navigation from all existing pages, or create an empty one.' ) }
				>
					<div className="wp-block-navigation-placeholder__buttons">
						<Button
							isSecondary
							className="wp-block-navigation-placeholder__button"
							onClick={ () => setPopulateFromExistingPages( true ) }
							disabled={ ! hasPages }
						>
							{ __( 'Create from all top-level pages' ) }
						</Button>

						<Button
							isLink
							className="wp-block-navigation-placeholder__button"
							onClick={ handleCreateEmpty }
						>
							{ __( 'Create empty' ) }
						</Button>
					</div>
				</Placeholder>
			</Fragment>
		);
	}

	// UI State: rendered Block UI
	return (
		<Fragment>
			<BlockControls>
				<Toolbar
					icon={ attributes.itemsJustification ? navIcons[ `justify${ upperFirst( attributes.itemsJustification ) }Icon` ] : navIcons.justifyLeftIcon }
					label={ __( 'Change items justification' ) }
					isCollapsed
					controls={ [
						{ icon: navIcons.justifyLeftIcon, title: __( 'Justify items left' ), isActive: 'left' === attributes.itemsJustification, onClick: handleItemsAlignment( 'left' ) },
						{ icon: navIcons.justifyCenterIcon, title: __( 'Justify items center' ), isActive: 'center' === attributes.itemsJustification, onClick: handleItemsAlignment( 'center' ) },
						{ icon: navIcons.justifyRightIcon, title: __( 'Justify items right' ), isActive: 'right' === attributes.itemsJustification, onClick: handleItemsAlignment( 'right' ) },
					] }
				/>
				<ToolbarGroup>
					{ navigatorToolbarButton }
				</ToolbarGroup>
				<BlockColorsStyleSelector
					value={ TextColor.color }
					onChange={ TextColor.setColor }
				/>

			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				<PanelBody
					title={ __( 'Navigation Structure' ) }
				>
					<BlockNavigationList clientId={ clientId } />
				</PanelBody>
			</InspectorControls>
			<TextColor>
				<div className={ blockClassNames }>
					{ ! hasExistingNavItems && isRequestingPages && <><Spinner /> { __( 'Loading Navigation…' ) } </> }

					<InnerBlocks
						allowedBlocks={ [ 'core/navigation-link' ] }
						templateInsertUpdatesSelection={ false }
						__experimentalMoverDirection={ 'horizontal' }
					/>

				</div>
			</TextColor>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );

		return {
			innerBlocks,
			hasExistingNavItems: !! innerBlocks.length,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateNavItemBlocks( blocks ) {
				dispatch( 'core/block-editor' ).replaceInnerBlocks( clientId, blocks );
			},
		};
	} ),
] )( Navigation );
