import { afterEach, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	getElementStylesWithoutScale,
	getStateInheritedValue,
	getStateStyleWithSupportedScale,
	getStyleWithFilledTranslate,
	getTransformStyleGroups,
} from '../transform';

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

	it( 'outputs a translation and a rotation under the transform feature selector', () => {
		registerTransformBlock(
			{ rotate: true, translate: true },
			{ transform: '.wp-block-test-transform img' }
		);

		expect(
			getTransformStyleGroups( 'test/transform', {
				rotate: '15deg',
				translate: { x: '10px' },
			} )
		).toEqual( {
			inline: {},
			bySelector: {
				'.wp-block-test-transform img': {
					rotate: '15deg',
					translate: { x: '10px' },
				},
			},
		} );
	} );

	it( 'leaves a translation that skips serialization to the block', () => {
		registerTransformBlock( {
			rotate: true,
			translate: true,
			__experimentalSkipSerialization: [ 'translate' ],
		} );

		expect(
			getTransformStyleGroups( 'test/transform', {
				rotate: '15deg',
				translate: { x: '10px' },
			} )
		).toEqual( { inline: { rotate: '15deg' }, bySelector: {} } );
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

	it( 'outputs a scale inline with a rotation and an offset', () => {
		registerTransformBlock( {
			rotate: true,
			translate: true,
			scale: true,
		} );

		expect(
			getTransformStyleGroups( 'test/transform', {
				rotate: '15deg',
				translate: { x: '10px', y: '0' },
				scale: 1.2,
			} )
		).toEqual( {
			inline: {
				rotate: '15deg',
				translate: { x: '10px', y: '0' },
				scale: 1.2,
			},
			bySelector: {},
		} );
	} );

	it( 'leaves a scale that skips serialization to the block', () => {
		registerTransformBlock( {
			rotate: true,
			scale: true,
			__experimentalSkipSerialization: [ 'scale' ],
		} );

		expect(
			getTransformStyleGroups( 'test/transform', {
				rotate: '15deg',
				scale: 1.2,
			} )
		).toEqual( { inline: { rotate: '15deg' }, bySelector: {} } );
	} );

	it( 'leaves out a scale the block does not support', () => {
		registerTransformBlock( { rotate: true } );

		expect(
			getTransformStyleGroups( 'test/transform', { scale: 1.2 } )
		).toEqual( { inline: {}, bySelector: {} } );
	} );
} );

describe( 'getStateStyleWithSupportedScale', () => {
	afterEach( () => {
		unregisterBlockType( 'test/transform' );
	} );

	it( 'keeps the scale for a block that supports it', () => {
		registerTransformBlock( { scale: true } );
		const style = { transform: { scale: 1.2 } };

		expect(
			getStateStyleWithSupportedScale( style, 'test/transform' )
		).toBe( style );
	} );

	it( 'removes only the scale for a block without scale support', () => {
		registerTransformBlock( { rotate: true } );

		expect(
			getStateStyleWithSupportedScale(
				{ transform: { rotate: '5deg', scale: 1.2 } },
				'test/transform'
			)
		).toEqual( { transform: { rotate: '5deg' } } );
	} );
} );

describe( 'getElementStylesWithoutScale', () => {
	it( 'removes the scale from elements and their states', () => {
		expect(
			getElementStylesWithoutScale( {
				link: {
					color: { text: 'red' },
					transform: { scale: 2 },
					':hover': { transform: { scale: 2 } },
				},
			} )
		).toEqual( {
			link: {
				color: { text: 'red' },
				transform: {},
				':hover': { transform: {} },
			},
		} );
	} );
} );

describe( 'getStyleWithFilledTranslate', () => {
	const globalTranslate = { x: '3rem' };

	it( 'keeps the Global Styles axis when the block sets one axis', () => {
		expect(
			getStyleWithFilledTranslate(
				{ transform: { translate: { y: '1rem' } } },
				globalTranslate
			)
		).toEqual( { transform: { translate: { x: '3rem', y: '1rem' } } } );
	} );

	it( 'leaves the missing axis at 0 without a Global Styles value', () => {
		const style = { transform: { translate: { y: '1rem' } } };

		expect( getStyleWithFilledTranslate( style, undefined ) ).toEqual(
			style
		);
	} );

	it( 'skips an invalid Global Styles axis', () => {
		expect(
			getStyleWithFilledTranslate(
				{ transform: { translate: { y: '1rem' } } },
				{ x: 'calc(1px + 2px)' }
			)
		).toEqual( { transform: { translate: { y: '1rem' } } } );
	} );

	it( 'leaves styles with both axes or no offset unchanged', () => {
		const both = { transform: { translate: { x: '1px', y: '2px' } } };
		const none = { color: { text: 'red' } };

		expect( getStyleWithFilledTranslate( both, globalTranslate ) ).toBe(
			both
		);
		expect( getStyleWithFilledTranslate( none, globalTranslate ) ).toBe(
			none
		);
	} );

	it( 'fills a viewport axis from the block default, then Global Styles', () => {
		expect(
			getStyleWithFilledTranslate(
				{
					transform: { translate: { x: '1px', y: '2px' } },
					'@mobile': { transform: { translate: { y: '1rem' } } },
				},
				globalTranslate
			)?.[ '@mobile' ]
		).toEqual( { transform: { translate: { x: '1px', y: '1rem' } } } );

		expect(
			getStyleWithFilledTranslate(
				{ '@mobile': { transform: { translate: { y: '1rem' } } } },
				globalTranslate
			)?.[ '@mobile' ]
		).toEqual( { transform: { translate: { x: '3rem', y: '1rem' } } } );
	} );

	it( 'fills a viewport pseudo state from the pseudo state before the viewport', () => {
		const filled = getStyleWithFilledTranslate(
			{
				':hover': { transform: { translate: { y: '1px' } } },
				'@mobile': {
					transform: { translate: { x: '2px', y: '2px' } },
					':hover': { transform: { translate: { y: '3px' } } },
				},
			},
			globalTranslate
		);

		expect( filled?.[ ':hover' ] ).toEqual( {
			transform: { translate: { x: '3rem', y: '1px' } },
		} );
		expect( filled?.[ '@mobile' ][ ':hover' ] ).toEqual( {
			transform: { translate: { x: '3rem', y: '3px' } },
		} );
	} );
} );

describe( 'getStateInheritedValue', () => {
	const mobile = { viewport: '@mobile', pseudo: 'default' };

	it( 'shows the block default offset for a state', () => {
		expect(
			getStateInheritedValue(
				{ transform: { translate: { x: '5rem' } } },
				{ x: '3rem' },
				{ transform: { translate: { x: '1px', y: '2px' } } },
				mobile,
				true
			).transform?.translate
		).toEqual( { x: '1px', y: '2px' } );
	} );

	it( 'shows the default Global Styles offset for a state that sets an offset', () => {
		expect(
			getStateInheritedValue(
				{ transform: { translate: { x: '5rem' } } },
				{ x: '3rem' },
				{ '@mobile': { transform: { translate: { y: '1rem' } } } },
				mobile,
				true
			).transform?.translate
		).toEqual( { x: '3rem' } );
	} );

	it( 'shows the Global Styles state offset for a state without one', () => {
		expect(
			getStateInheritedValue(
				{ transform: { translate: { x: '5rem' } } },
				{ x: '3rem' },
				{},
				mobile,
				false
			).transform?.translate
		).toEqual( { x: '5rem' } );
	} );
} );
