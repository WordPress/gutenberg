/* eslint-disable gutenberg/use-typescript -- The Image block is implemented in JavaScript; converting this test to TypeScript causes TS6307 because utils.js is not part of tsconfig. */
import { describe, expect, it } from 'vitest';
import { getDimensionsTools } from '../utils';

describe( 'getDimensionsTools', () => {
	it( 'returns aspectRatio, widthHeight, and scale in default layout when not wide aligned', () => {
		const tools = getDimensionsTools( {
			parentLayoutType: 'default',
			hasCustomDimensions: false,
			isWideAligned: false,
		} );
		expect( tools ).toEqual( [ 'aspectRatio', 'widthHeight', 'scale' ] );
	} );

	it( 'omits widthHeight in default layout when image is wide aligned', () => {
		const tools = getDimensionsTools( {
			parentLayoutType: 'default',
			hasCustomDimensions: false,
			isWideAligned: true,
		} );
		expect( tools ).toEqual( [ 'aspectRatio', 'scale' ] );
	} );

	it( 'omits widthHeight in flex layout when no custom dimensions are set', () => {
		const tools = getDimensionsTools( {
			parentLayoutType: 'flex',
			hasCustomDimensions: false,
			isWideAligned: false,
		} );
		expect( tools ).toEqual( [ 'aspectRatio' ] );
	} );

	it( 'includes widthHeight in flex layout when custom dimensions are set', () => {
		const tools = getDimensionsTools( {
			parentLayoutType: 'flex',
			hasCustomDimensions: true,
			isWideAligned: false,
		} );
		expect( tools ).toEqual( [ 'aspectRatio', 'widthHeight' ] );
	} );

	it( 'omits widthHeight in grid layout when no custom dimensions are set', () => {
		const tools = getDimensionsTools( {
			parentLayoutType: 'grid',
			hasCustomDimensions: false,
			isWideAligned: false,
		} );
		expect( tools ).toEqual( [ 'aspectRatio' ] );
	} );

	it( 'includes widthHeight in grid layout when custom dimensions are set', () => {
		const tools = getDimensionsTools( {
			parentLayoutType: 'grid',
			hasCustomDimensions: true,
			isWideAligned: false,
		} );
		expect( tools ).toEqual( [ 'aspectRatio', 'widthHeight' ] );
	} );
} );

/* eslint-enable gutenberg/use-typescript */
