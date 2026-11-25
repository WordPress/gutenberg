import { describe, expect, it, vi } from 'vitest';
import forwardResolver from '../forward-resolver';

describe( 'forwardResolver', () => {
	it( 'forwards the arguments to the named resolver', async () => {
		const getEntityRecord = vi.fn(
			async ( kind: string, name: string, key?: number ) =>
				key === undefined ? undefined : { kind, name, key }
		);

		await forwardResolver( 'getEntityRecord' )( 'postType', 'post', 1 )( {
			resolveSelect: { getEntityRecord },
		} );

		expect( getEntityRecord ).toHaveBeenCalledWith( 'postType', 'post', 1 );
	} );
} );
