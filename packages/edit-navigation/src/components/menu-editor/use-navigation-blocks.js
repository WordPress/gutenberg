/**
 * External dependencies
 */
import { groupBy, isEqual, difference } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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

export default function useNavigationBlocks( menuId ) {
	// menuItems is an array of menu item objects.
	const menuItems = useSelect(
		( select ) =>
			select( 'core' ).getMenuItems( { menus: menuId, per_page: -1 } ),
		[ menuId ]
	);

	const { saveMenuItem } = useDispatch( 'core' );
	const { createSuccessNotice } = useDispatch( 'core/notices' );
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
			if ( ! items ) {
				return;
			}
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

	const saveBlocks = () => {
		const { clientId, innerBlocks } = blocks[ 0 ];
		const parentItemId = menuItemsRef.current[ clientId ]?.parent;

		const saveNestedBlocks = async ( nestedBlocks, parentId = 0 ) => {
			for ( const block of nestedBlocks ) {
				const menuItem = menuItemsRef.current[ block.clientId ];
				let currentItemId = menuItem?.id || 0;

				if ( ! menuItem ) {
					const savedItem = await saveMenuItem( {
						...createMenuItemAttributesFromBlock( block ),
						menus: menuId,
						parent: parentId,
					} );
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
						parent: parentId,
					} );
				}

				if ( block.innerBlocks.length ) {
					saveNestedBlocks( block.innerBlocks, currentItemId );
				}
			}
		};

		saveNestedBlocks( innerBlocks, parentItemId );

		const deletedClientIds = difference(
			Object.keys( menuItemsRef.current ),
			innerBlocks.map( ( block ) => block.clientId )
		);

		// Disable reason, this code will eventually be implemented.
		// eslint-disable-next-line no-unused-vars
		for ( const deletedClientId of deletedClientIds ) {
			// TODO - delete menu items.
		}

		createSuccessNotice( __( 'Navigation saved.' ), {
			type: 'snackbar',
		} );
	};

	return [ blocks, setBlocks, saveBlocks ];
}
