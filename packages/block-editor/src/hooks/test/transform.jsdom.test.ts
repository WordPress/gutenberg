import { afterEach, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { addSaveProps } from '../style';
import { getTransformClassesAndStyles } from '../use-transform-props';

const registerTransformBlock = ( transform: Record< string, unknown > ) =>
	registerBlockType( 'test/transform', {
		apiVersion: 3,
		title: 'Transform',
		category: 'media',
		attributes: {},
		edit: () => null,
		save: () => null,
		supports: { transform },
	} );

describe( 'getTransformClassesAndStyles', () => {
	it( 'returns a rotation as an inline style', () => {
		expect(
			getTransformClassesAndStyles( {
				style: { transform: { rotate: '15deg' } },
			} )
		).toEqual( { style: { rotate: '15deg' } } );
	} );

	it( 'returns no styles for an invalid rotation', () => {
		expect(
			getTransformClassesAndStyles( {
				style: { transform: { rotate: 'calc(10deg + 5deg)' } },
			} )
		).toEqual( { style: {} } );
	} );

	it( 'returns no styles without a transform', () => {
		expect( getTransformClassesAndStyles( {} ) ).toEqual( { style: {} } );
	} );
} );

describe( 'transform serialization', () => {
	afterEach( () => {
		unregisterBlockType( 'test/transform' );
	} );

	it( 'saves a rotation inline on the block wrapper', () => {
		registerTransformBlock( { rotate: true } );

		expect(
			addSaveProps( {}, 'test/transform', {
				style: { transform: { rotate: '15deg' } },
			} ).style
		).toEqual( { rotate: '15deg' } );
	} );

	it.each( [
		[ 'the whole support', true ],
		[ 'the rotation', [ 'rotate' ] ],
	] )(
		'leaves a rotation to the block when it skips serialization of %s',
		( _label, skipSerialization ) => {
			registerTransformBlock( {
				rotate: true,
				__experimentalSkipSerialization: skipSerialization,
			} );

			expect(
				addSaveProps( {}, 'test/transform', {
					style: { transform: { rotate: '15deg' } },
				} ).style
			).toEqual( {} );
		}
	);
} );
