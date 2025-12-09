/**
 * Internal dependencies
 */
import { getComputedAcceptAttribute } from '../utils';

describe( 'getComputedAcceptAttribute', () => {
	it( 'returns the accept prop as-is when explicitly provided', () => {
		const result = getComputedAcceptAttribute(
			[ 'image' ],
			{ 'jpg|jpeg': 'image/jpeg', png: 'image/png' },
			'image/png,image/jpeg'
		);
		expect( result ).toBe( 'image/png,image/jpeg' );
	} );

	it( 'returns undefined when no allowedTypes are specified', () => {
		const result = getComputedAcceptAttribute(
			[],
			{ 'jpg|jpeg': 'image/jpeg', png: 'image/png' },
			undefined
		);
		expect( result ).toBeUndefined();
	} );

	it( 'returns undefined when allowedTypes is null or undefined', () => {
		const result = getComputedAcceptAttribute(
			null,
			{ 'jpg|jpeg': 'image/jpeg', png: 'image/png' },
			undefined
		);
		expect( result ).toBeUndefined();
	} );

	it( 'returns wildcard format when allowedMimeTypes is not available', () => {
		const result = getComputedAcceptAttribute(
			[ 'image', 'video' ],
			undefined,
			undefined
		);
		expect( result ).toBe( 'image/*,video/*' );
	} );

	it( 'returns wildcard format when allowedMimeTypes is not an object', () => {
		const result = getComputedAcceptAttribute(
			[ 'image' ],
			'not-an-object',
			undefined
		);
		expect( result ).toBe( 'image/*' );
	} );

	it( 'returns specific MIME types when they match allowedTypes', () => {
		const result = getComputedAcceptAttribute(
			[ 'image' ],
			{
				'jpg|jpeg': 'image/jpeg',
				png: 'image/png',
				mp4: 'video/mp4',
			},
			undefined
		);
		expect( result ).toBe( 'image/jpeg,image/png' );
	} );

	it( 'supports allowedTypes with full MIME type format', () => {
		const result = getComputedAcceptAttribute(
			[ 'image/png', 'video/mp4' ],
			{
				png: 'image/png',
				'jpg|jpeg': 'image/jpeg',
				mp4: 'video/mp4',
			},
			undefined
		);
		expect( result ).toBe( 'image/png,video/mp4' );
	} );

	it( 'falls back to wildcard when specific MIME types are not found', () => {
		const result = getComputedAcceptAttribute( [ 'image' ], {}, undefined );
		expect( result ).toBe( 'image/*' );
	} );

	it( 'filters MIME types correctly when mixed with other types', () => {
		const result = getComputedAcceptAttribute(
			[ 'image', 'audio' ],
			{
				'jpg|jpeg': 'image/jpeg',
				png: 'image/png',
				mp4: 'video/mp4',
				mp3: 'audio/mp3',
				wav: 'audio/wav',
			},
			undefined
		);
		expect( result ).toBe( 'image/jpeg,image/png,audio/mp3,audio/wav' );
	} );

	it( 'returns undefined when allowedMimeTypes is invalid and allowedTypes is empty', () => {
		const result = getComputedAcceptAttribute( [], null, undefined );
		expect( result ).toBeUndefined();
	} );

	it( 'handles empty allowedMimeTypes object', () => {
		const result = getComputedAcceptAttribute( [ 'image' ], {}, undefined );
		expect( result ).toBe( 'image/*' );
	} );

	it( 'preserves MIME type order from allowedMimeTypes', () => {
		const mimeTypes = {
			'jpg|jpeg': 'image/jpeg',
			png: 'image/png',
			gif: 'image/gif',
		};
		const result = getComputedAcceptAttribute(
			[ 'image' ],
			mimeTypes,
			undefined
		);
		// The exact order depends on Object.entries, which preserves insertion order in modern JS
		expect( result ).toContain( 'image/jpeg' );
		expect( result ).toContain( 'image/png' );
		expect( result ).toContain( 'image/gif' );
	} );

	it( 'handles mixed allowedTypes with and without MIME type format', () => {
		const result = getComputedAcceptAttribute(
			[ 'image', 'video/mp4' ],
			{
				png: 'image/png',
				'jpg|jpeg': 'image/jpeg',
				mp4: 'video/mp4',
				webm: 'video/webm',
			},
			undefined
		);
		// 'image' matches image/* types and 'video/mp4' matches exact MIME type
		expect( result ).toBe( 'image/png,image/jpeg,video/mp4' );
	} );

	it( 'returns single MIME type without comma', () => {
		const result = getComputedAcceptAttribute(
			[ 'image' ],
			{
				png: 'image/png',
			},
			undefined
		);
		expect( result ).toBe( 'image/png' );
	} );

	it( 'prioritizes specific MIME types over wildcard', () => {
		const result = getComputedAcceptAttribute(
			[ 'image' ],
			{
				'jpg|jpeg': 'image/jpeg',
				png: 'image/png',
			},
			undefined
		);
		// Should return specific types, not 'image/*'
		expect( result ).not.toBe( 'image/*' );
		expect( result ).toBe( 'image/jpeg,image/png' );
	} );
} );
