/**
 * Internal dependencies
 */
import { getSuggestedPostFormat } from '../get-suggested-post-format';

describe( 'getSuggestedPostFormat', () => {
	it( 'returns null if cannot be determined', () => {
		const blocks = [];

		expect( getSuggestedPostFormat( blocks ) ).toBeNull();
	} );

	it( 'return null if only one block of type `core/embed` and provider not matched', () => {
		const blocks = [
			{
				clientId: 567,
				name: 'core/embed',
				attributes: {
					providerNameSlug: 'instagram',
				},
				innerBlocks: [],
			},
		];
		expect( getSuggestedPostFormat( blocks ) ).toBeNull();
	} );

	it( 'return null if only one block of type `core/embed` and provider not exists', () => {
		const blocks = [
			{
				clientId: 567,
				name: 'core/embed',
				attributes: {},
				innerBlocks: [],
			},
		];
		expect( getSuggestedPostFormat( blocks ) ).toBeNull();
	} );

	it( 'returns null if there is more than one block in the post', () => {
		const blocks = [
			{
				clientId: 123,
				name: 'core/image',
				attributes: {},
				innerBlocks: [],
			},
			{
				clientId: 456,
				name: 'core/quote',
				attributes: {},
				innerBlocks: [],
			},
		];

		expect( getSuggestedPostFormat( blocks ) ).toBeNull();
	} );

	it( 'returns Image if the first block is of type `core/image`', () => {
		const blocks = [
			{
				clientId: 123,
				name: 'core/image',
				attributes: {},
				innerBlocks: [],
			},
		];

		expect( getSuggestedPostFormat( blocks ) ).toBe( 'image' );
	} );

	it( 'returns Quote if the first block is of type `core/quote`', () => {
		const blocks = [
			{
				clientId: 456,
				name: 'core/quote',
				attributes: {},
				innerBlocks: [],
			},
		];

		expect( getSuggestedPostFormat( blocks ) ).toBe( 'quote' );
	} );

	it( 'returns Video if the first block is of type `core/embed from youtube`', () => {
		const blocks = [
			{
				clientId: 567,
				name: 'core/embed',
				attributes: {
					providerNameSlug: 'youtube',
				},
				innerBlocks: [],
			},
		];

		expect( getSuggestedPostFormat( blocks ) ).toBe( 'video' );
	} );

	it( 'returns Audio if the first block is of type `core/embed from soundcloud`', () => {
		const blocks = [
			{
				clientId: 567,
				name: 'core/embed',
				attributes: {
					providerNameSlug: 'soundcloud',
				},
				innerBlocks: [],
			},
		];

		expect( getSuggestedPostFormat( blocks ) ).toBe( 'audio' );
	} );

	it( 'returns Quote if the first block is of type `core/quote` and second is of type `core/paragraph`', () => {
		const blocks = [
			{
				clientId: 456,
				name: 'core/quote',
				attributes: {},
				innerBlocks: [],
			},
			{
				clientId: 789,
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			},
		];

		expect( getSuggestedPostFormat( blocks ) ).toBe( 'quote' );
	} );
} );
