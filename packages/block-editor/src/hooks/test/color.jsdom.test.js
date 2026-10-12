import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import color from '../color';

vi.mock(
	import( '../../components/use-settings' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		useSettings: () => [ [], [], [] ],
	} )
);

const BLOCK_NAME = 'test/color-background';

const colorValue = { color: { background: '#1d4d3a' } };
const colorGradientValue = {
	color: { gradient: 'linear-gradient(135deg, #1d4d3a 0%, #7fb069 100%)' },
};
const imageValue = {
	background: {
		backgroundImage: { url: 'https://example.com/image.jpg' },
	},
};
const gradientValue = {
	background: {
		gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
	},
};

function registerWithSkip( { colorSkip, backgroundSkip } = {} ) {
	registerBlockType( BLOCK_NAME, {
		apiVersion: 3,
		title: 'Test block',
		category: 'design',
		save: () => null,
		supports: {
			color: {
				background: true,
				gradients: true,
				__experimentalSkipSerialization: colorSkip,
			},
			background: {
				backgroundImage: true,
				gradient: true,
				__experimentalSkipSerialization: backgroundSkip,
			},
		},
	} );
}

function getClassNames( style ) {
	const { result } = renderHook( () =>
		color.useBlockProps( { name: BLOCK_NAME, style } )
	);
	return result.current.className?.split( ' ' ) ?? [];
}

describe( 'color useBlockProps has-background', () => {
	afterEach( () => {
		unregisterBlockType( BLOCK_NAME );
	} );

	it( 'is not added for a background color when color is skipped', () => {
		registerWithSkip( { colorSkip: true } );
		expect( getClassNames( colorValue ) ).not.toContain( 'has-background' );
	} );

	it( 'is added for a background color when nothing is skipped', () => {
		registerWithSkip();
		expect( getClassNames( colorValue ) ).toContain( 'has-background' );
	} );

	it.each( [
		[ 'a background image', imageValue ],
		[ 'a background gradient', gradientValue ],
	] )(
		'is not added for %s when background is skipped',
		( _label, style ) => {
			registerWithSkip( { backgroundSkip: true } );
			expect( getClassNames( style ) ).not.toContain( 'has-background' );
		}
	);

	it.each( [
		[ 'a background image', imageValue ],
		[ 'a background gradient', gradientValue ],
	] )( 'is added for %s when nothing is skipped', ( _label, style ) => {
		registerWithSkip();
		expect( getClassNames( style ) ).toEqual( [ 'has-background' ] );
	} );

	it.each( [
		[ 'a color and a background image', colorValue, imageValue ],
		[ 'two gradients', colorGradientValue, gradientValue ],
	] )(
		'is added by the color for %s when only background is skipped',
		( _label, colorStyle, backgroundStyle ) => {
			registerWithSkip( { backgroundSkip: true } );
			expect(
				getClassNames( { ...colorStyle, ...backgroundStyle } )
			).toContain( 'has-background' );
		}
	);

	it.each( [
		[ 'a color and a background image', colorValue, imageValue ],
		[ 'two gradients', colorGradientValue, gradientValue ],
	] )(
		'is added by the background for %s when only color is skipped',
		( _label, colorStyle, backgroundStyle ) => {
			registerWithSkip( { colorSkip: true } );
			expect(
				getClassNames( { ...colorStyle, ...backgroundStyle } )
			).toEqual( [ 'has-background' ] );
		}
	);

	it( 'is added once when both supports serialize', () => {
		registerWithSkip();
		expect(
			getClassNames( { ...colorValue, ...imageValue } ).filter(
				( className ) => 'has-background' === className
			)
		).toHaveLength( 1 );
	} );

	it( 'follows the background gradient skip separately from the image', () => {
		registerWithSkip( { backgroundSkip: [ 'backgroundImage' ] } );
		expect(
			getClassNames( {
				background: {
					...imageValue.background,
					...gradientValue.background,
				},
			} )
		).toEqual( [ 'has-background' ] );
	} );
} );
