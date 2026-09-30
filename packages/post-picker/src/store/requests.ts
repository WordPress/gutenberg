import type { PostPickerPost } from './types';

type Settle = ( posts: PostPickerPost[] | null ) => void;

// Resolvers are kept outside the store so that state only holds
// serializable data.
const pending = new Map< number, Settle >();
let lastId = 0;

export function createRequest() {
	const id = ++lastId;
	const promise = new Promise< PostPickerPost[] | null >( ( resolve ) => {
		pending.set( id, resolve );
	} );
	return { id, promise };
}

/**
 * Resolves the promise for a request. Does nothing if the request has
 * already been settled.
 *
 * @param id    Request ID.
 * @param posts The selected posts, or `null` if the picker was dismissed.
 */
export function settleRequest( id: number, posts: PostPickerPost[] | null ) {
	const settle = pending.get( id );
	if ( ! settle ) {
		return;
	}
	pending.delete( id );
	settle( posts );
}
