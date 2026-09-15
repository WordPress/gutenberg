import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { dispatch } from '@wordpress/data';
import mediaUploadOnSuccess from '../on-success';
import { receiveFinalizedAttachment } from '../finalized-attachments';

vi.mock( import( '@wordpress/data' ), () => ( {
	dispatch: vi.fn(),
} ) );

vi.mock(
	import( '@wordpress/core-data' ),
	() =>
		( {
			store: 'core',
		} ) as unknown as typeof import('@wordpress/core-data')
);

const invalidateResolution = vi.fn();
const receiveEntityRecords = vi.fn();

describe( 'mediaUploadOnSuccess', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		( dispatch as unknown as Mock ).mockReturnValue( {
			invalidateResolution,
			receiveEntityRecords,
		} );
	} );

	it( 'invalidates both attachment resolutions for a server-processed upload', () => {
		mediaUploadOnSuccess( [ { id: 42 } ] );

		expect( invalidateResolution ).toHaveBeenCalledTimes( 2 );
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ 'postType', 'attachment', 42, { context: 'view' } ]
		);
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecord',
			[ 'postType', 'attachment', 42 ]
		);
	} );

	it( 'does not refetch an attachment whose finalized record was already received', () => {
		// A client-side upload ends with `finalize`, whose response is stored
		// as the attachment record. Refetching it would ask the server (or a
		// cache in front of it) for data the editor already has.
		receiveFinalizedAttachment( { id: 42 } );

		mediaUploadOnSuccess( [ { id: 42 } ] );

		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );

	it( 'refetches only the attachments of a batch that did not finalize', () => {
		receiveFinalizedAttachment( { id: 42 } );

		mediaUploadOnSuccess( [ { id: 42 }, { id: 43 } ] );

		expect( invalidateResolution ).toHaveBeenCalledTimes( 2 );
		for ( const call of invalidateResolution.mock.calls ) {
			expect( call[ 1 ][ 2 ] ).toBe( 43 );
		}
	} );

	it( 'ignores attachments without an ID', () => {
		mediaUploadOnSuccess( [ {} ] );

		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );
} );
