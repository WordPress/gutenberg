import { afterEach, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { getTransformStyleGroups } from '../transform';

const registerTransformBlock = (
	transform: Record< string, unknown >,
	selectors?: Record< string, string >
) =>
	registerBlockType( 'test/transform', {
		apiVersion: 3,
		title: 'Transform',
		category: 'media',
		attributes: {},
		edit: () => null,
		save: () => null,
		supports: { transform },
		selectors,
	} );

describe( 'getTransformStyleGroups', () => {
	afterEach( () => {
		unregisterBlockType( 'test/transform' );
	} );

	it( 'outputs a rotation inline on the block wrapper', () => {
		registerTransformBlock( { rotate: true } );

		expect(
			getTransformStyleGroups( 'test/transform', { rotate: '15deg' } )
		).toEqual( { inline: { rotate: '15deg' }, bySelector: {} } );
	} );

	it( 'outputs a rotation under the transform feature selector', () => {
		registerTransformBlock(
			{ rotate: true },
			{ transform: '.wp-block-test-transform img' }
		);

		expect(
			getTransformStyleGroups( 'test/transform', { rotate: '15deg' } )
		).toEqual( {
			inline: {},
			bySelector: {
				'.wp-block-test-transform img': { rotate: '15deg' },
			},
		} );
	} );

	it( 'leaves a rotation that skips serialization to the block', () => {
		registerTransformBlock( {
			rotate: true,
			__experimentalSkipSerialization: [ 'rotate' ],
		} );

		expect(
			getTransformStyleGroups( 'test/transform', { rotate: '15deg' } )
		).toEqual( { inline: {}, bySelector: {} } );
	} );
} );
