/**
 * External dependencies
 */
import { groupBy, sortBy, difference, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import batchSave from './batch-save';
import useDebouncedValue from './use-debounced-value';
import PromiseQueue from './promise-queue';

export default function useNavigationBlocks( menuId ) {
	const [ deletedMenuItemsIds, setDeletedMenuItemsIds ] = useState( [] );

	// menuItems is an array of menu item objects.
	const query = { menus: menuId, per_page: -1 };
	// @TODO: uniq() and filter() are here just to work around the bug in select() - let's follow up with a PR
	//  		  that addresses the root cause
	const menuItems = useSelect(
		( select ) =>
			uniq(
				select( 'core' )
					.getMenuItems( query )
					?.filter(
						( { id } ) => ! deletedMenuItemsIds.includes( id )
					) || [],
				( { id } ) => id
			),
		[ menuId, deletedMenuItemsIds ]
	);

	// Data model
	const [ blocks, setBlocks ] = useState( [] );
	const menuItemsRef = useRef( {} );

	// Refresh our model whenever menuItems change
	useEffect( () => {
		if ( menuItems ) {
			const [
				navigationBlock,
				clientIdToMenuItemMapping,
			] = menuItemsToNavigationBlock( menuItems );
			setBlocks( [ navigationBlock ] );
			menuItemsRef.current = clientIdToMenuItemMapping;
		}
	}, [ menuItems ] );

	// When a new block is added, let's create a draft menuItem for it.
	// The batch save endpoint expects all the menu items to have a valid id already.
	// PromiseQueue is used in order to
	// 1) limit the amount of requests processed at the same time
	// 2) save the menu only after all requests are finalized

	// Let's debounce so that we don't call `getAllClientIds` on every keystroke
	const debouncedBlocks = useDebouncedValue( blocks, 800 );
	const promiseQueueRef = useRef( new PromiseQueue() );
	const enqueuedBlocksIds = useRef( [] );
	useEffect(
		function() {
			for ( const clientId of getAllClientIds( debouncedBlocks ) ) {
				// Menu item was already created
				if ( clientId in menuItemsRef.current ) {
					continue;
				}
				// Already in the queue
				if ( enqueuedBlocksIds.current.includes( clientId ) ) {
					continue;
				}
				enqueuedBlocksIds.current.push( clientId );
				promiseQueueRef.current.enqueue( () =>
					createDraftMenuItem( clientId ).then( ( menuItem ) => {
						menuItemsRef.current[ clientId ] = menuItem;
						enqueuedBlocksIds.current.splice(
							enqueuedBlocksIds.current.indexOf( clientId )
						);
					} )
				);
			}
		},
		[ debouncedBlocks ]
	);

	// Save handler
	const { receiveEntityRecords } = useDispatch( 'core' );
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		'core/notices'
	);

	const saveBlocks = async () => {
		const result = await batchSave( menuId, menuItemsRef, blocks[ 0 ] );

		if ( result.success ) {
			const allMenuItemsIds = Object.values( menuItemsRef.current ).map(
				( { id } ) => id
			);
			const savedMenuItemIds = getAllClientIds( blocks ).map(
				( clientId ) => menuItemsRef.current[ clientId ].id
			);
			setDeletedMenuItemsIds( [
				...deletedMenuItemsIds,
				...difference( allMenuItemsIds, savedMenuItemIds ),
			] );

			createSuccessNotice( __( 'Navigation saved.' ), {
				type: 'snackbar',
			} );
			receiveEntityRecords( 'root', 'menuItem', [], query, true );
		} else {
			createErrorNotice( __( 'There was an error.' ), {
				type: 'snackbar',
			} );
		}
	};

	return [
		blocks,
		setBlocks,
		() => promiseQueueRef.current.then( saveBlocks ),
	];
}

async function createDraftMenuItem() {
	return apiFetch( {
		path: `/__experimental/menu-items`,
		method: 'POST',
		data: {
			title: 'Placeholder',
			url: 'Placeholder',
			menu_order: 0,
		},
	} );
}

const menuItemsToNavigationBlock = ( menuItems ) => {
	const itemsByParentID = groupBy( menuItems, 'parent' );
	const clientIdToMenuItemMapping = {};
	const menuItemsToTreeOfLinkBlocks = ( items ) => {
		const innerBlocks = [];
		if ( ! items ) {
			return;
		}

		const sortedItems = sortBy( items, 'menu_order' );
		for ( const item of sortedItems ) {
			let menuItemInnerBlocks = [];
			if ( itemsByParentID[ item.id ]?.length ) {
				menuItemInnerBlocks = menuItemsToTreeOfLinkBlocks(
					itemsByParentID[ item.id ]
				);
			}
			const linkBlock = menuItemToLinkBlock( item, menuItemInnerBlocks );
			clientIdToMenuItemMapping[ linkBlock.clientId ] = item;
			innerBlocks.push( linkBlock );
		}
		return innerBlocks;
	};

	// menuItemsToTreeOfLinkBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
	const innerBlocks = menuItemsToTreeOfLinkBlocks(
		itemsByParentID[ 0 ] || []
	);
	const navigationBlock = createBlock( 'core/navigation', {}, innerBlocks );
	return [ navigationBlock, clientIdToMenuItemMapping ];
};

function menuItemToLinkBlock( menuItem, innerBlocks = [] ) {
	return createBlock(
		'core/navigation-link',
		{
			label: menuItem.title.rendered,
			url: menuItem.url,
		},
		innerBlocks
	);
}

const getAllClientIds = ( blocks ) =>
	blocks.flatMap( ( item ) =>
		[ item.clientId ].concat( getAllClientIds( item.innerBlocks || [] ) )
	);
