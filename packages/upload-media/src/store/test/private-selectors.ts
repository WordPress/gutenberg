/**
 * Internal dependencies
 */
import { getItemByUploadId, getResumableItems } from '../private-selectors';
import { ItemStatus } from '../types';

describe( 'private selectors: resume', () => {
	const state = {
		queue: [
			{ id: 'a', uploadId: 'u-a', status: ItemStatus.PendingResume },
			{ id: 'b', uploadId: 'u-b', status: ItemStatus.Processing },
		],
	} as any;

	it( 'finds an item by uploadId', () => {
		expect( getItemByUploadId( state, 'u-a' )?.id ).toBe( 'a' );
		expect( getItemByUploadId( state, 'missing' ) ).toBeUndefined();
	} );

	it( 'returns only PendingResume items', () => {
		expect( getResumableItems( state ).map( ( i: any ) => i.id ) ).toEqual(
			[ 'a' ]
		);
	} );
} );
