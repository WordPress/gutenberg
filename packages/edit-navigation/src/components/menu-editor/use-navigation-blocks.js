/**
 * External dependencies
 */
import { isEqual, difference } from 'lodash';

/**
 * WordPress dependencies
 */
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

export default function useNavigationBlocks( menuId ) {
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

		const itemIndex = {};
		menuItems.forEach( ( item ) => {
			if ( ! itemIndex[ item.parent ] ) {
				itemIndex[ item.parent ] = [];
			}
			itemIndex[ item.parent ].push( item );
		} );

		menuItemsRef.current = {};

		const createMenuItemBlocks = ( items ) => {
			const innerBlocks = [];
			for ( const item of items ) {
				let menuItemInnerBlocks = [];
				if ( itemIndex[ item.id ] && itemIndex[ item.id ].length > 0 ) {
					menuItemInnerBlocks = createMenuItemBlocks(
						itemIndex[ item.id ]
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

		const innerBlocks = createMenuItemBlocks( itemIndex[ 0 ] );
		setBlocks( [ createBlock( 'core/navigation', {}, innerBlocks ) ] );
	}, [ menuItems ] );

	const saveBlocks = () => {
		const { clientId, innerBlocks } = blocks[ 0 ];

		const saveNestedBlocks = ( nestedBlocks, parentId ) => {
			for ( const block of nestedBlocks ) {
				if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
					saveNestedBlocks( block.innerBlocks, block.clientId );
				}
				const menuItem = menuItemsRef.current[ block.clientId ];
				const parentItemId =
					menuItemsRef.current[ parentId ] &&
					menuItemsRef.current[ parentId ].id;
				if ( ! menuItem ) {
					saveMenuItem( {
						...createMenuItemAttributesFromBlock( block ),
						menus: menuId,
						parent: parentItemId || 0,
					} );
					continue;
				}

				if (
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
			}
		};

		saveNestedBlocks( innerBlocks, clientId );

		const deletedClientIds = difference(
			Object.keys( menuItemsRef.current ),
			innerBlocks.map( ( block ) => block.clientId )
		);

		// Disable reason, this code will eventually be implemented.
		// eslint-disable-next-line no-unused-vars
		for ( const deletedClientId of deletedClientIds ) {
			// TODO - delete menu items.
		}
	};

	return [ blocks, setBlocks, saveBlocks ];
}
