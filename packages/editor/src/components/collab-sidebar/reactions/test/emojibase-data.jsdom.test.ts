import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { loadEmojibaseData, useEmojibaseData } from '../emojibase-data';

const ENTRY = { hexcode: '1F600', emoji: '😀', label: 'grinning face' };

function mockFetchResponses( ...bodies: Array< unknown | Error > ) {
	const fetchMock = vi.fn();
	for ( const body of bodies ) {
		fetchMock.mockImplementationOnce( () =>
			body instanceof Error
				? Promise.reject( body )
				: Promise.resolve( {
						ok: true,
						json: () => Promise.resolve( body ),
					} )
		);
	}
	vi.stubGlobal( 'fetch', fetchMock );
	return fetchMock;
}

describe( 'loadEmojibaseData', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'rejects a response that is not an array', async () => {
		mockFetchResponses( { not: 'an array' } );

		await expect(
			loadEmojibaseData( 'https://example.com/shape', 'en' )
		).rejects.toThrow( 'Invalid en/data.json' );
	} );
} );

describe( 'useEmojibaseData', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'loads the dataset again when retried after a failure', async () => {
		const fetchMock = mockFetchResponses( new Error( 'Network down' ), [
			ENTRY,
		] );

		const { result } = renderHook( () =>
			useEmojibaseData( 'https://example.com/retry', 'en' )
		);

		await waitFor( () => expect( result.current.error ).not.toBeNull() );
		expect( result.current.data ).toBeNull();

		act( () => result.current.retry() );

		await waitFor( () =>
			expect( result.current.data ).toEqual( [ ENTRY ] )
		);
		expect( result.current.error ).toBeNull();
		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
	} );
} );
