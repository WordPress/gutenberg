/**
 * External dependencies
 */
import { groupBy, sortBy } from 'lodash';

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
import batchSave from './menu-items-batch-save-handler';

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

export default function useNavigationBlocks( menuId ) {
	// menuItems is an array of menu item objects.
	const query = { menus: menuId, per_page: -1 };
	const menuItems = useSelect(
		( select ) => select( 'core' ).getMenuItems( query ),
		[ menuId ]
	);

	// Let's keep track of live menuItems and block clientId to menu item mapping
	const [ blocks, setBlocks ] = useState( [] );
	const menuItemsRef = useRef( {} );

	// Refresh our model whenever menuItems change
	useEffect( () => {
		if ( menuItems ) {
			const [
				navigationBlock,
				clientIdToMenuItemMapping,
			] = convertMenuItemsToNavigationBlock( menuItems );
			setBlocks( [ navigationBlock ] );
			menuItemsRef.current = clientIdToMenuItemMapping;
		}
	}, [ menuItems ] );

	// When a new block is added, let's create a draft menuItem for it.
	// The batch save endpoint expects all the menu items to have a valid id already.
	const debouncedBlocks = useDebouncedValue( blocks, 800 );
	const promiseQueueRef = useRef( new PromiseQueue() );
	const processedBlocksIds = useRef( [] );
	useEffect(
		function() {
			for ( const clientId of getAllClientIds( debouncedBlocks ) ) {
				if ( clientId in menuItemsRef.current ) {
					continue;
				}
				if ( processedBlocksIds.current.includes( clientId ) ) {
					continue;
				}
				processedBlocksIds.current.push( clientId );
				promiseQueueRef.current.schedule( () =>
					createDraftMenuItem( clientId ).then(
						async ( menuItem ) => {
							menuItemsRef.current[ clientId ] = menuItem;
							processedBlocksIds.current.splice(
								processedBlocksIds.current.indexOf( clientId )
							);
						}
					)
				);
			}
		},
		[ debouncedBlocks ]
	);

	const saveBlocks = useSaveBlocks( menuId, blocks, menuItemsRef, query );

	return [
		blocks,
		setBlocks,
		() => promiseQueueRef.current.then( saveBlocks ),
	];
}

class PromiseQueue {
	constructor( concurrency = 1 ) {
		this.concurrency = concurrency;
		this.queue = [];
		this.active = [];
		this.listeners = [];
	}

	schedule( action ) {
		this.queue.push( action );
		this.run();
	}

	run() {
		while ( this.queue.length && this.active.length <= this.concurrency ) {
			const action = this.queue.pop();
			const promise = action().then( () =>
				this.onActionFinished( promise )
			);
			this.active.push( promise );
		}
	}

	onActionFinished( promise ) {
		this.active.splice( this.active.indexOf( promise ), 1 );
		if ( this.active.length === 0 && this.queue.length === 0 ) {
			for ( const l of this.listeners ) {
				l();
			}
			this.listeners = [];
		}
	}

	then( callback ) {
		this.listeners.push( callback );
	}
}

const convertMenuItemsToNavigationBlock = ( menuItems ) => {
	const itemsByParentID = groupBy( menuItems, 'parent' );
	const clientIdToMenuItemMapping = {};
	const createMenuItemBlocks = ( items ) => {
		const innerBlocks = [];
		if ( ! items ) {
			return;
		}

		const sortedItems = sortBy( items, 'menu_order' );
		for ( const item of sortedItems ) {
			let menuItemInnerBlocks = [];
			if ( itemsByParentID[ item.id ]?.length ) {
				menuItemInnerBlocks = createMenuItemBlocks(
					itemsByParentID[ item.id ]
				);
			}
			const block = createBlockFromMenuItem( item, menuItemInnerBlocks );
			clientIdToMenuItemMapping[ block.clientId ] = item;
			innerBlocks.push( block );
		}
		return innerBlocks;
	};

	// createMenuItemBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
	const innerBlocks = createMenuItemBlocks( itemsByParentID[ 0 ] || [] );
	const navigationBlock = createBlock( 'core/navigation', {}, innerBlocks );
	return [ navigationBlock, clientIdToMenuItemMapping ];
};

const useSaveBlocks = ( menuId, blocks, menuItemsRef, query ) => {
	const { receiveEntityRecords } = useDispatch( 'core' );

	const { createSuccessNotice } = useDispatch( 'core/notices' );

	const saveBlocks = async () => {
		const result = await batchSave(
			menuId,
			menuItemsRef,
			blocks[ 0 ].innerBlocks
		);

		createSuccessNotice( __( 'Navigation saved.' ), {
			type: 'snackbar',
		} );

		return;

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

const useDebouncedValue = ( value, timeout ) => {
	const [ state, setState ] = useState( value );

	useEffect( () => {
		const handler = setTimeout( () => setState( value ), timeout );

		return () => clearTimeout( handler );
	}, [ value, timeout ] );

	return state;
};

const getAllClientIds = ( blocks ) =>
	blocks.flatMap( ( item ) =>
		[ item.clientId ].concat( getAllClientIds( item.innerBlocks || [] ) )
	);
