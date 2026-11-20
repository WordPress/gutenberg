import { afterEach, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { addSaveProps } from '../style';
import transformSupport, { getStateInheritedValue } from '../transform';
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
	it( 'returns a rotation as a class and an inline style', () => {
		expect(
			getTransformClassesAndStyles( {
				style: { transform: { rotate: '15deg' } },
			} )
		).toEqual( { className: 'has-rotation', style: { rotate: '15deg' } } );
	} );

	it( 'returns no styles for an invalid rotation', () => {
		expect(
			getTransformClassesAndStyles( {
				style: { transform: { rotate: 'calc(10deg + 5deg)' } },
			} )
		).toEqual( { className: undefined, style: {} } );
	} );

	it( 'returns no styles without a transform', () => {
		expect( getTransformClassesAndStyles( {} ) ).toEqual( {
			className: undefined,
			style: {},
		} );
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

	it( 'saves a has-rotation class next to the existing classes', () => {
		registerTransformBlock( { rotate: true } );

		expect(
			transformSupport.addSaveProps(
				{ className: 'is-style-a' },
				'test/transform',
				{ style: { transform: { rotate: '15deg' } } }
			).className
		).toBe( 'is-style-a has-rotation' );
	} );

	it( 'saves no has-rotation class for an invalid rotation', () => {
		registerTransformBlock( { rotate: true } );

		expect(
			transformSupport.addSaveProps( {}, 'test/transform', {
				style: { transform: { rotate: 'calc(10deg + 5deg)' } },
			} ).className
		).toBeUndefined();
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
			const attributes = {
				style: { transform: { rotate: '15deg' } },
			};

			expect(
				addSaveProps( {}, 'test/transform', attributes ).style
			).toEqual( {} );
			expect(
				transformSupport.addSaveProps(
					{},
					'test/transform',
					attributes
				).className
			).toBeUndefined();
		}
	);
} );

describe( 'getStateInheritedValue', () => {
	const mobile = { viewport: '@mobile', pseudo: 'default' };

	it( 'starts a state rotation from the block rotation', () => {
		expect(
			getStateInheritedValue(
				{ transform: { rotate: '5deg' } },
				{ transform: { rotate: '15deg' } },
				mobile
			).transform
		).toEqual( { rotate: '15deg' } );
	} );

	it( 'falls back to Global Styles for what the block does not set', () => {
		expect(
			getStateInheritedValue(
				{ transform: { rotate: '5deg' } },
				{},
				mobile
			).transform
		).toEqual( { rotate: '5deg' } );
	} );

	it( 'layers the pseudo state over the viewport for both', () => {
		expect(
			getStateInheritedValue(
				undefined,
				{
					transform: { rotate: '5deg' },
					'@mobile': { transform: { rotate: '10deg' } },
					':hover': { transform: { rotate: '15deg' } },
				},
				{ viewport: '@mobile', pseudo: ':hover' }
			).transform
		).toEqual( { rotate: '15deg' } );
	} );
} );
