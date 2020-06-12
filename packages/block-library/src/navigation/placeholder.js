/**
 * External dependencies
 */

import { escape } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	Button,
	CustomSelectControl,
	Spinner,
	Placeholder,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { forwardRef, useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { navigation as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import createDataTree from './create-data-tree';

const CREATE_EMPTY_OPTION_VALUE = '__CREATE_EMPTY__';
const CREATE_FROM_PAGES_OPTION_VALUE = '__CREATE_FROM_PAGES__';
const CREATE_PLACEHOLDER_VALUE = '__CREATE_PLACEHOLDER__';

/**
 * Get instruction text for the Placeholder component.
 *
 * @param {boolean} hasMenus Flag that indicates if there are menus.
 * @param {boolean} hasPages Flag that indicates if there are pages.
 *
 * @return {string} Text to display as the placeholder instructions.
 */
function getPlaceholderInstructions( hasMenus, hasPages ) {
	if ( hasMenus && hasPages ) {
		return __(
			'Create a navigation from all existing pages, or choose a menu.'
		);
	} else if ( hasMenus && ! hasPages ) {
		return __( 'Create a navigation from a menu or create empty.' );
	} else if ( ! hasMenus && hasPages ) {
		return __(
			'Create a navigation from all existing pages, or create empty.'
		);
	}

	return __( 'Create an empty navigation.' );
}

/**
 * Return the menu id if the user has one selected.
 *
 * @param {Object} selectedCreateOption An object containing details of
 *                                      the selected create option.
 *
 * @return {number|undefined} The menu id.
 */
function getSelectedMenu( selectedCreateOption ) {
	const optionKey = selectedCreateOption?.key;
	return optionKey !== undefined && Number.isInteger( optionKey )
		? optionKey
		: undefined;
}

/**
 * A recursive function that maps menu item nodes to blocks.
 *
 * @param {Object[]} nodes An array of menu items.
 *
 * @return {WPBlock[]} An array of blocks.
 */
function mapMenuItemsToBlocks( nodes ) {
	return nodes.map( ( { title, type, link: url, id, children } ) => {
		const innerBlocks =
			children && children.length ? mapMenuItemsToBlocks( children ) : [];

		return createBlock(
			'core/navigation-link',
			{
				type,
				id,
				url,
				label: ! title.rendered
					? __( '(no title)' )
					: escape( title.rendered ),
				opensInNewTab: false,
			},
			innerBlocks
		);
	} );
}

/**
 * Convert a flat menu item structure to a nested blocks structure.
 *
 * @param {Object[]} menuItems An array of menu items.
 *
 * @return {WPBlock[]} An array of blocks.
 */
function convertMenuItemsToBlocks( menuItems ) {
	if ( ! menuItems ) {
		return null;
	}

	const menuTree = createDataTree( menuItems );
	return mapMenuItemsToBlocks( menuTree );
}

/**
 * Convert pages to blocks.
 *
 * @param {Object[]} pages An array of pages.
 *
 * @return {WPBlock[]} An array of blocks.
 */
function convertPagesToBlocks( pages ) {
	if ( ! pages ) {
		return null;
	}

	return pages.map( ( { title, type, link: url, id } ) =>
		createBlock( 'core/navigation-link', {
			type,
			id,
			url,
			label: ! title.rendered
				? __( '(no title)' )
				: escape( title.rendered ),
			opensInNewTab: false,
		} )
	);
}

/**
 * Returns a value that indicates whether the create button should be disabled.
 *
 * @param {Object}  selectedCreateOption An object containing details of
 *                                       the selected create option.
 * @param {boolean} hasResolvedPages     Indicates whether pages have loaded.
 * @param {boolean} hasResolvedMenuItems Indicates whether menu items have loaded.
 *
 * @return {boolean} A value that indicates whether the create button is disabled.
 */
function getIsCreateButtonDisabled(
	selectedCreateOption,
	hasResolvedPages,
	hasResolvedMenuItems
) {
	// If there is no key at all then disable.
	if ( ! selectedCreateOption ) {
		return true;
	}

	const optionKey = selectedCreateOption?.key;

	// Always disable if the default "placeholder" option is selected.
	if ( optionKey === CREATE_PLACEHOLDER_VALUE ) {
		return true;
	}

	// Always enable if Create Empty is selected.
	if ( optionKey === CREATE_EMPTY_OPTION_VALUE ) {
		return false;
	}

	// Enable if Pages option selected and we have Pages available.
	if ( optionKey === CREATE_FROM_PAGES_OPTION_VALUE && hasResolvedPages ) {
		return false;
	}

	// Enable if a menu is selected and menu items have loaded.
	const selectedMenu = getSelectedMenu( selectedCreateOption );
	return selectedMenu === undefined || ! hasResolvedMenuItems;
}

function NavigationPlaceholder( { onCreate }, ref ) {
	const [ selectedCreateOption, setSelectedCreateOption ] = useState();

	const {
		pages,
		isResolvingPages,
		hasResolvedPages,
		menus,
		isResolvingMenus,
		hasResolvedMenus,
		menuItems,
		hasResolvedMenuItems,
	} = useSelect(
		( select ) => {
			const {
				getEntityRecords,
				getMenus,
				getMenuItems,
				isResolving,
				hasFinishedResolution,
			} = select( 'core' );
			const pagesParameters = [
				'postType',
				'page',
				{
					parent: 0,
					order: 'asc',
					orderby: 'id',
				},
			];
			const menusParameters = [ { per_page: -1 } ];
			const selectedMenu = getSelectedMenu( selectedCreateOption );
			const hasSelectedMenu = selectedMenu !== undefined;
			const menuItemsParameters = hasSelectedMenu
				? [
						{
							menus: selectedMenu,
							per_page: -1,
						},
				  ]
				: undefined;

			return {
				pages: getEntityRecords( ...pagesParameters ),
				isResolvingPages: isResolving(
					'getEntityRecords',
					pagesParameters
				),
				hasResolvedPages: hasFinishedResolution(
					'getEntityRecords',
					pagesParameters
				),
				menus: getMenus( ...menusParameters ),
				isResolvingMenus: isResolving( 'getMenus', menusParameters ),
				hasResolvedMenus: hasFinishedResolution(
					'getMenus',
					menusParameters
				),
				menuItems: hasSelectedMenu
					? getMenuItems( ...menuItemsParameters )
					: undefined,
				hasResolvedMenuItems: hasSelectedMenu
					? hasFinishedResolution(
							'getMenuItems',
							menuItemsParameters
					  )
					: false,
			};
		},
		[ selectedCreateOption ]
	);

	const hasPages = !! ( hasResolvedPages && pages?.length );
	const hasMenus = !! ( hasResolvedMenus && menus?.length );
	const isLoading = isResolvingPages || isResolvingMenus;

	const createOptions = useMemo(
		() => [
			{
				id: CREATE_PLACEHOLDER_VALUE,
				name: __( 'Select where to start from…' ),
			},
			...( hasMenus ? menus : [] ),
			{
				id: CREATE_EMPTY_OPTION_VALUE,
				name: __( 'Create empty menu' ),
				className: 'is-create-empty-option',
			},
			...( hasPages
				? [
						{
							id: CREATE_FROM_PAGES_OPTION_VALUE,
							name: __( 'New from all top-level pages' ),
						},
				  ]
				: [] ),
		],
		[ menus, hasMenus, hasPages ]
	);

	const onCreateButtonClick = useCallback( () => {
		if ( ! selectedCreateOption ) {
			return;
		}

		const { key } = selectedCreateOption;

		if ( key === CREATE_EMPTY_OPTION_VALUE ) {
			const blocks = [ createBlock( 'core/navigation-link' ) ];
			onCreate( blocks );
		}

		if ( hasPages && key === CREATE_FROM_PAGES_OPTION_VALUE ) {
			const blocks = convertPagesToBlocks( pages );
			const selectNavigationBlock = true;
			onCreate( blocks, selectNavigationBlock );
			return;
		}

		// Infer that the user selected a menu to create from.
		// If either there's no selected menu or menu items are undefined
		// this is undefined behavior, do nothing.
		const selectedMenu = getSelectedMenu( selectedCreateOption );
		if ( selectedMenu === undefined || menuItems === undefined ) {
			return;
		}

		const blocks = convertMenuItemsToBlocks( menuItems );
		const selectNavigationBlock = true;
		onCreate( blocks, selectNavigationBlock );
	} );

	return (
		<Placeholder
			className="wp-block-navigation-placeholder"
			icon={ icon }
			label={ __( 'Navigation' ) }
			instructions={
				! isLoading
					? getPlaceholderInstructions( hasMenus, hasPages )
					: undefined
			}
		>
			{ isLoading && (
				<div ref={ ref }>
					<Spinner /> { __( 'Loading…' ) }
				</div>
			) }
			{ ! isLoading && (
				<div
					ref={ ref }
					className="wp-block-navigation-placeholder__actions"
				>
					<>
						<CustomSelectControl
							className={ classnames( {
								'has-menus': hasMenus,
							} ) }
							label={ __(
								'Select to create from Pages, existing Menu or empty'
							) }
							hideLabelFromVision={ true }
							value={ selectedCreateOption || createOptions[ 0 ] }
							onChange={ ( { selectedItem } ) => {
								if (
									selectedItem?.key === selectedCreateOption
								) {
									return;
								}
								setSelectedCreateOption( selectedItem );
							} }
							options={ createOptions.map( ( option ) => {
								return {
									...option,
									key: option.id,
								};
							} ) }
						/>
						<Button
							isSecondary
							className="wp-block-navigation-placeholder__button"
							onClick={ onCreateButtonClick }
							disabled={ getIsCreateButtonDisabled(
								selectedCreateOption,
								hasResolvedPages,
								hasResolvedMenuItems
							) }
						>
							{ __( 'Create' ) }
						</Button>
					</>
				</div>
			) }
		</Placeholder>
	);
}

export default forwardRef( NavigationPlaceholder );
