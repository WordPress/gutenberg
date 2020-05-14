/**
 * External dependencies
 */
import { groupBy, omitBy, isNil, keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

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
	const attributes = {};
	if ( block.attributes.label ) {
		attributes.title = block.attributes.label;
	}
	return {
		title: block.attributes.label,
		url: block.attributes.url,
	};
}

export default function useNavigationBlocks( menuId ) {
	// menuItems is an array of menu item objects.
	const query = { menus: menuId, per_page: -1 };
	const menuItems = useSelect(
		( select ) =>
			select( 'core' ).getMenuItems( query ),
		[ menuId ]
	);

	const [ blocks, setBlocks, menuItemsRef ] = useNavigationBlocksModel(
		menuItems
	);

	const [ onFinished ] = useDynamicMenuItemPlaceholders(
		menuId,
		blocks,
		menuItemsRef
	);

	const saveBlocks = useSaveBlocks( menuId, blocks, menuItemsRef, query );

	return [ blocks, setBlocks, () => onFinished( saveBlocks ) ];
}

const useNavigationBlocksModel = ( menuItems ) => {
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
		const innerBlocks = createMenuItemBlocks( itemsByParentID[ 0 ] || [] );
		setBlocks( [ createBlock( 'core/navigation', {}, innerBlocks ) ] );
	}, [ menuItems ] );

	return [ blocks, setBlocks, menuItemsRef ];
};

const useDynamicMenuItemPlaceholders = (
	menuId,
	currentBlocks,
	menuItemsRef
) => {
	const blocks = useDebouncedValue( currentBlocks, 800 );
	const blocksByIdRef = useRef( {} );
	const processingRef = useRef( {
		queue: [],
		running: false,
		notify: [],
	} );

	useEffect(
		function() {
			const blocksById = mapBlocksByClientId( blocks );
			blocksByIdRef.current = blocksById;

			const clientIdsWithoutRelatedMenuItem = Object.keys(
				blocksById
			).filter( ( clientId ) => ! menuItemsRef.current[ clientId ] );

			for ( const clientId of clientIdsWithoutRelatedMenuItem ) {
				schedulePlaceholderMenuItem( clientId );
			}
		},
		[ blocks ]
	);

	function schedulePlaceholderMenuItem( clientId ) {
		const queue = processingRef.current.queue;
		if ( queue.includes( clientId ) ) {
			return;
		}
		queue.push( clientId );
		processQueue();
	}

	async function processQueue() {
		const processing = processingRef.current;
		if ( processing.running ) {
			return;
		}
		processing.running = true;
		try {
			while ( processing.queue.length ) {
				const [ clientIdToProcess, idx ] = getNextProcessableClientId();
				if ( ! clientIdToProcess ) {
					if ( processing.queue.length ) {
						// Rudimentary assertion - suggestions welcome!
						// eslint-disable-next-line no-console
						console.error(
							'getNextProcessableClientId() did not return anything even though the processing queue is not empty'
						);
						return;
					}
					break;
				}
				await createPlaceholderMenuItem( clientIdToProcess );
				processing.queue.splice( idx, 1 );
			}
		} finally {
			processing.running = false;
			notify();
		}
	}

	function notify() {
		const listeners = processingRef.current.notify;
		for ( let i = listeners.length - 1; i >= 0; i-- ) {
			listeners[ i ]();
			listeners.splice( i, 1 );
		}
	}

	function getNextProcessableClientId() {
		const queue = processingRef.current.queue;
		// While loop makes it possible to safely mutate the list
		for ( let i = queue.length - 1; i >= 0; i-- ) {
			const clientId = queue[ i ];

			// Blocks was removed before we got to process it
			if ( ! ( clientId in blocksByIdRef.current ) ) {
				queue.splice( i, 1 );
				continue;
			}

			// Menu item was already created before we got here
			if ( clientId in menuItemsRef.current ) {
				queue.splice( i, 1 );
				continue;
			}

			return [ clientId, i ];
		}
	}

	async function createPlaceholderMenuItem( clientId ) {
		const block = blocksByIdRef.current[ clientId ];
		const createdItem = await apiFetch( {
			path: `/__experimental/menu-items`,
			method: 'POST',
			data: {
				title: 'Placeholder',
				url: 'Placeholder',
				...omitBy( createMenuItemAttributesFromBlock( block ), isNil ),
				menu_order: 0,
			},
		} );
		menuItemsRef.current[ clientId ] = createdItem;
		return createdItem;
	}

	const onFinished = function( callback ) {
		if ( ! processingRef.current.running ) {
			callback();
			return;
		}
		processingRef.current.notify.push( callback );
	};

	return [ onFinished ];
};

const useSaveBlocks = ( menuId, blocks, menuItemsRef, query ) => {
	const { receiveEntityRecords } = useDispatch( 'core' );
	const prepareRequestItem = ( block, parentId ) => {
		const menuItem = omit(
			menuItemsRef.current[ block.clientId ] || {},
			'_links'
		);

		return {
			...menuItem,
			...createMenuItemAttributesFromBlock( block ),
			clientId: block.clientId,
			menus: menuId,
			parent: parentId,
			menu_order: 0,
		};
	};

	const prepareRequestData = ( nestedBlocks, parentId = 0 ) =>
		nestedBlocks.map( ( block ) => {
			const data = prepareRequestItem( block, parentId );
			return {
				...data,
				children: prepareRequestData( block.innerBlocks, data.id ),
			};
		} );

	const { createSuccessNotice } = useDispatch( 'core/notices' );

	const saveBlocks = async () => {
		const { clientId, innerBlocks } = blocks[ 0 ];
		const parentItemId = menuItemsRef.current[ clientId ]?.parent;
		const requestData = prepareRequestData( innerBlocks, parentItemId );

		const saved = await apiFetch( {
			path: `/__experimental/menu-items/save-hierarchy?menus=${ menuId }`,
			method: 'PUT',
			data: { tree: requestData },
		} );

		createSuccessNotice( __( 'Navigation saved.' ), {
			type: 'snackbar',
		} );

		const kind = 'root';
		const name = 'menuItem';
		// receiveEntityRecords(
		// 	kind,
		// 	name,
		// 	saved,
		// 	// {
		// 	// 	...item.data,
		// 	// 	title: { rendered: 'experimental' },
		// 	// },
		// 	undefined,
		// 	true
		// );
		receiveEntityRecords(
			'root',
			'menuItem',
			Object.values( saved ),
			query,
			false
		);
	};

	return saveBlocks;
};

const useDebouncedValue = ( value, timeout ) => {
	const [ state, setState ] = useState( value );

	useEffect( () => {
		const handler = setTimeout( () => setState( value ), timeout );

		return () => clearTimeout( handler );
	}, [ value, timeout ] );

	return state;
};

const mapBlocksByClientId = ( nextBlocks ) =>
	keyBy(
		flatten( nextBlocks[ 0 ]?.innerBlocks || [], 'innerBlocks' ),
		'clientId'
	);

const flatten = ( recursiveArray, childrenKey ) =>
	recursiveArray.flatMap( ( item ) =>
		[ item ].concat( flatten( item[ childrenKey ] || [], childrenKey ) )
	);
