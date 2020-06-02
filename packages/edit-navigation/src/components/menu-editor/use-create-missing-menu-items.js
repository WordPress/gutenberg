/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { flattenBlocks } from './helpers';

/**
 * When a new block is added, let's create a draft menuItem for it.
 * The batch save endpoint expects all the menu items to have a valid id already.
 * PromiseQueue is used in order to
 * 1) limit the amount of requests processed at the same time
 * 2) save the menu only after all requests are finalized
 *
 * @param {Object} menuItemsRef Ref holding a mapping from clientId to it's related menuItem
 * @return {function(*=): void} Function registering it's argument to be called once all
 * 													    currently processed menuItems are created.
 */
export default function useCreateMissingMenuItems( menuItemsRef ) {
	const promiseQueueRef = useRef( new PromiseQueue() );
	const enqueuedBlocksIds = useRef( [] );
	const createMissingMenuItems = useCallback(
		( blocks ) => {
			for ( const { clientId, name } of flattenBlocks( blocks ) ) {
				// No need to create menuItems for the wrapping navigation block
				if ( name === 'core/navigation' ) {
					continue;
				}
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
		[ menuItemsRef.current ]
	);
	const onCreated = useCallback(
		( callback ) => promiseQueueRef.current.then( callback ),
		[ promiseQueueRef.current ]
	);
	return { createMissingMenuItems, onCreated };
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

/**
 * A concurrency primitive that runs at most `concurrency` async tasks at once.
 */
export class PromiseQueue {
	constructor( concurrency = 1 ) {
		this.concurrency = concurrency;
		this.queue = [];
		this.active = [];
		this.listeners = [];
	}

	enqueue( action ) {
		this.queue.push( action );
		this.run();
	}

	run() {
		while ( this.queue.length && this.active.length <= this.concurrency ) {
			const action = this.queue.shift();
			const promise = action().then( () => {
				this.active.splice( this.active.indexOf( promise ), 1 );
				this.run();
				this.notifyIfEmpty();
			} );
			this.active.push( promise );
		}
	}

	notifyIfEmpty() {
		if ( this.active.length === 0 && this.queue.length === 0 ) {
			for ( const l of this.listeners ) {
				l();
			}
			this.listeners = [];
		}
	}

	/**
	 * Calls `callback` once all async actions in the queue are finished,
	 * or immediately if no actions are running.
	 *
	 * @param {Function} callback Callback to call
	 */
	then( callback ) {
		if ( this.active.length ) {
			this.listeners.push( callback );
		} else {
			callback();
		}
	}
}
