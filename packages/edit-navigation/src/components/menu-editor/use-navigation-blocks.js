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

function createBlockFromMenuItem( menuItem ) {
	return createBlock( 'core/navigation-link', {
		label: menuItem.title.raw,
		url: menuItem.url,
	} );
}

function createMenuItemAttributesFromBlock( block ) {
	return {
		title: block.attributes.label,
		url: block.attributes.url,
	};
}

export default function useNavigationBlocks( menuId ) {
	const menuItems = useSelect(
		( select ) => select( 'core' ).getMenuItems( { menus: menuId } ),
		[ menuId ]
	);

	const { saveMenuItem } = useDispatch( 'core' );

	const [ blocks, setBlocks ] = useState( [] );

	const menuItemsRef = useRef( {} );

	useEffect( () => {
		if ( ! menuItems ) {
			return;
		}

		menuItemsRef.current = {};

		const innerBlocks = [];

		for ( const menuItem of menuItems ) {
			const block = createBlockFromMenuItem( menuItem );
			menuItemsRef.current[ block.clientId ] = menuItem;
			innerBlocks.push( block );
		}

		setBlocks( [ createBlock( 'core/navigation', {}, innerBlocks ) ] );
	}, [ menuItems ] );

	const saveBlocks = () => {
		const { innerBlocks } = blocks[ 0 ];

		for ( const block of innerBlocks ) {
			const menuItem = menuItemsRef.current[ block.clientId ];

			if ( ! menuItem ) {
				saveMenuItem( {
					...createMenuItemAttributesFromBlock( block ),
					menus: menuId,
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

		const deletedClientIds = difference(
			Object.keys( menuItemsRef.current ),
			innerBlocks.map( ( block ) => block.clientId )
		);

		// Disable reason, this code will eventually be implemented.
		// eslint-disable-next-line no-unused-vars
		for ( const clientId of deletedClientIds ) {
			// TODO - delete menu items.
		}
	};

	return [ blocks, setBlocks, saveBlocks ];
}
