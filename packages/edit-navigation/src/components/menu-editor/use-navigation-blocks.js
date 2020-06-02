/**
 * External dependencies
 */
import { keyBy, groupBy, sortBy } from 'lodash';

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
	const { blocks, setBlocks, menuItemsRef, query } = useBlocks( menuId );
	const onMenuItemsCreated = useCreateMissingMenuItems(
		blocks,
		menuItemsRef
	);
	const saveBlocks = useSaveBlocksCallback( query, menuItemsRef, blocks );

	return [ blocks, setBlocks, () => onMenuItemsCreated( saveBlocks ) ];
}

function useBlocks( menuId ) {
	const query = { menus: menuId, per_page: -1 };
	const { menuItems, isResolving } = useSelectedMenuItems( query );

	const [ blocks, setBlocks ] = useState( [] );
	const menuItemsRef = useRef( {} );

	// Refresh our model whenever menuItems change
	useEffect( () => {
		if ( isResolving || menuItems === null ) {
			return;
		}

		const [
			innerBlocks,
			clientIdToMenuItemMapping,
		] = menuItemsToLinkBlocks(
			menuItems,
			blocks[ 0 ]?.innerBlocks,
			menuItemsRef.current
		);

		const navigationBlock = blocks[ 0 ]
			? { ...blocks[ 0 ], innerBlocks }
			: createBlock( 'core/navigation', {}, innerBlocks );

		setBlocks( [ navigationBlock ] );
		menuItemsRef.current = clientIdToMenuItemMapping;
	}, [ menuId, menuItems, isResolving ] );

	return {
		blocks,
		setBlocks,
		menuItemsRef,
		query,
	};
}

function useSelectedMenuItems( query ) {
	return useSelect( ( select ) => ( {
		menuItems: select( 'core' ).getMenuItems( query ),
		isResolvingMenuItems: select( 'core/data' ).isResolving(
			'core',
			'getMenuItems',
			[ query ]
		),
	} ) );
}

function useCreateMissingMenuItems( blocks, menuItemsRef ) {
	// When a new block is added, let's create a draft menuItem for it.
	// The batch save endpoint expects all the menu items to have a valid id already.
	// PromiseQueue is used in order to
	// 1) limit the amount of requests processed at the same time
	// 2) save the menu only after all requests are finalized

	// Let's debounce so that we don't call `getAllClientIds` on every keystroke
	const debouncedBlocks = useDebouncedValue( blocks, 800 );
	const promiseQueueRef = useRef( new PromiseQueue() );
	const enqueuedBlocksIds = useRef( [] );
	useEffect( () => {
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
	}, [ debouncedBlocks ] );

	return ( callback ) => promiseQueueRef.current.then( callback );
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

function useSaveBlocksCallback( query, menuItemsRef, blocks ) {
	const { receiveEntityRecords } = useDispatch( 'core' );
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		'core/notices'
	);

	const saveBlocks = async () => {
		const result = await batchSave(
			query.menus,
			menuItemsRef,
			blocks[ 0 ]
		);

		if ( result.success ) {
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

	return saveBlocks;
}

const menuItemsToLinkBlocks = (
	menuItems,
	prevLinkBlocks = [],
	prevClientIdToMenuItemMapping = {}
) => {
	const blocksByMenuId = mapBlocksByMenuId(
		prevLinkBlocks,
		prevClientIdToMenuItemMapping
	);

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
			const linkBlock = menuItemToLinkBlock(
				item,
				menuItemInnerBlocks,
				blocksByMenuId[ item.id ]
			);
			clientIdToMenuItemMapping[ linkBlock.clientId ] = item;
			innerBlocks.push( linkBlock );
		}
		return innerBlocks;
	};

	// menuItemsToTreeOfLinkBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
	const linkBlocks = menuItemsToTreeOfLinkBlocks(
		itemsByParentID[ 0 ] || []
	);
	return [ linkBlocks, clientIdToMenuItemMapping ];
};

function menuItemToLinkBlock(
	menuItem,
	innerBlocks = [],
	existingBlock = null
) {
	const attributes = {
		label: menuItem.title.rendered,
		url: menuItem.url,
	};

	if ( existingBlock ) {
		return {
			...existingBlock,
			attributes,
			innerBlocks,
		};
	}
	return createBlock( 'core/navigation-link', attributes, innerBlocks );
}

const mapBlocksByMenuId = ( blocks, menuItemsByClientId ) => {
	const blocksByClientId = keyBy( flattenBlocks( blocks ), 'clientId' );
	const blocksByMenuId = {};
	for ( const clientId in menuItemsByClientId ) {
		const menuItem = menuItemsByClientId[ clientId ];
		blocksByMenuId[ menuItem.id ] = blocksByClientId[ clientId ];
	}
	return blocksByMenuId;
};

const getAllClientIds = ( blocks ) =>
	flattenBlocks( blocks ).map( ( { clientId } ) => clientId );

const flattenBlocks = ( blocks ) =>
	blocks.flatMap( ( item ) =>
		[ item ].concat( flattenBlocks( item.innerBlocks || [] ) )
	);
