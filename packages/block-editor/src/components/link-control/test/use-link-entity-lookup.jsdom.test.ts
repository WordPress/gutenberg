import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useLinkEntityLookup, {
	LINK_LOOKUP_TIMEOUT,
} from '../use-link-entity-lookup';

describe( 'useLinkEntityLookup', () => {
	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'gives up on a lookup that takes too long, so the link saves unbound', async () => {
		// Real time passes too, for React's own scheduling.
		vi.useFakeTimers( { shouldAdvanceTime: true } );
		// A lookup that never answers.
		const fetchLinkEntity = vi.fn( () => new Promise< null >( () => {} ) );
		const { result } = renderHook( () =>
			useLinkEntityLookup( fetchLinkEntity )
		);

		let found: Promise< unknown > | undefined;
		act( () => {
			found = result.current.lookUp!( 'https://example.com/about/' );
		} );
		expect( result.current.isLookingUp ).toBe( true );

		await act( () => vi.advanceTimersByTimeAsync( LINK_LOOKUP_TIMEOUT ) );

		await expect( found ).resolves.toBeNull();
		expect( result.current.isLookingUp ).toBe( false );
	} );

	it( 'has nothing to look up with when the editor provides no lookup', () => {
		const { result } = renderHook( () => useLinkEntityLookup( undefined ) );
		expect( result.current.lookUp ).toBeUndefined();
	} );
} );
