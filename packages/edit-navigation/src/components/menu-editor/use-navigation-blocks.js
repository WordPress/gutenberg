/**
 * External dependencies
 */
import { groupBy, isEqual, difference } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';

function createBlockFromMenuItem( menuItem, innerBlocks = [] ) {
	return createBlock(
		'core/navigation-link',
		{
			label: menuItem.title.rendered,
			url: menuItem.url,
		},
		innerBlocks
	);
}

function createMenuItemAttributesFromBlock( block ) {
	return {
		title: block.attributes.label,
		url: block.attributes.url,
	};
}

// temp solution until deleteEntityRecords is ready
async function deleteMenuItem( recordId ) {
	const path = `${ '/__experimental/menu-items/' +
		recordId +
		'?force=true' }`;
	const deletedRecord = await apiFetch( {
		path,
		method: 'DELETE',
	} );
	return deletedRecord.previous;
}

export default function useNavigationBlocks( menuId ) {
	// menuItems is an array of menu item objects.
	const menuItems = useSelect(
		( select ) =>
			select( 'core' ).getMenuItems( { menus: menuId, per_page: -1 } ),
		[ menuId ]
	);

	const { saveMenuItem } = useDispatch( 'core' );

	const [ blocks, setBlocks ] = useState( [] );

	const menuItemsRef = useRef( {} );

	useEffect( () => {
		if ( ! menuItems ) {
			return;
		}

		const itemsByParentID = groupBy( menuItems, 'parent' );

		menuItemsRef.current = {};

		const createMenuItemBlocks = ( items ) => {
			const innerBlocks = [];
			for ( const item of items ) {
				let menuItemInnerBlocks = [];
				if ( itemsByParentID[ item.id ]?.length ) {
					menuItemInnerBlocks = createMenuItemBlocks(
						itemsByParentID[ item.id ]
					);
				}
				const block = createBlockFromMenuItem(
					item,
					menuItemInnerBlocks
				);
				menuItemsRef.current[ block.clientId ] = item;
				innerBlocks.push( block );
			}
			return innerBlocks;
		};

		// createMenuItemBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
		const innerBlocks = createMenuItemBlocks( itemsByParentID[ 0 ] );
		setBlocks( [ createBlock( 'core/navigation', {}, innerBlocks ) ] );
	}, [ menuItems ] );

	const saveBlocks = async () => {
		const { clientId, innerBlocks } = blocks[ 0 ];
		const parentItemId = menuItemsRef.current[ clientId ]?.parent;

		const blockClientIds = [];

		const saveNestedBlocks = async ( nestedBlocks, parentId = 0 ) => {
			for ( const block of nestedBlocks ) {
				blockClientIds.push( block.clientId );
				const menuItem = menuItemsRef.current[ block.clientId ];
				let currentItemId = menuItem?.id || 0;

				if ( ! menuItem ) {
					const savedItem = await saveMenuItem( {
						...createMenuItemAttributesFromBlock( block ),
						menus: menuId,
						parent: parentId,
					} ).then( ( result ) => result );
					if ( block.innerBlocks.length ) {
						currentItemId = savedItem.id;
					}
				}

				if (
					menuItem &&
					! isEqual(
						block.attributes,
						createBlockFromMenuItem( menuItem ).attributes
					)
				) {
					saveMenuItem( {
						...menuItem,
						...createMenuItemAttributesFromBlock( block ),
						menus: menuId, // Gotta do this because REST API doesn't like receiving an array here. Maybe a bug in the REST API?
					} );
				}

				if ( block.innerBlocks.length ) {
					saveNestedBlocks( block.innerBlocks, currentItemId );
				}
			}
		};

		await saveNestedBlocks( innerBlocks, parentItemId );

		const deletedClientIds = difference(
			Object.keys( menuItemsRef.current ),
			blockClientIds
		);

		for ( const deletedClientId of deletedClientIds ) {
			const menuItem = menuItemsRef.current[ deletedClientId ];

			deleteMenuItem( menuItem.id );
		}
	};

	return [ blocks, setBlocks, saveBlocks ];
}
