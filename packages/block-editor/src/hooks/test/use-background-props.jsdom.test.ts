import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	getBackgroundClassesAndStyles,
	useBackgroundProps,
} from '../use-background-props';

const backgroundImage = {
	url: 'https://example.com/image.jpg',
	id: 123,
	source: 'file',
};

describe( 'getBackgroundClassesAndStyles', () => {
	it( 'should return the class and styles for a background image', () => {
		expect(
			getBackgroundClassesAndStyles( {
				style: { background: { backgroundImage } },
			} )
		).toEqual( {
			className: 'has-background',
			style: {
				backgroundImage: "url( 'https://example.com/image.jpg' )",
				backgroundSize: 'cover',
			},
		} );
	} );

	it( 'should return the class and styles for a gradient', () => {
		expect(
			getBackgroundClassesAndStyles( {
				style: {
					background: {
						gradient: 'linear-gradient(135deg, #000 0%, #fff 100%)',
					},
				},
			} )
		).toEqual( {
			className: 'has-background',
			style: {
				backgroundImage: 'linear-gradient(135deg, #000 0%, #fff 100%)',
			},
		} );
	} );

	it( 'should layer the gradient over the background image', () => {
		expect(
			getBackgroundClassesAndStyles( {
				style: {
					background: {
						backgroundImage,
						backgroundSize: 'contain',
						gradient: 'linear-gradient(135deg, #000 0%, #fff 100%)',
					},
				},
			} )
		).toEqual( {
			className: 'has-background',
			style: {
				backgroundImage:
					"linear-gradient(135deg, #000 0%, #fff 100%), url( 'https://example.com/image.jpg' )",
				backgroundSize: 'contain',
				backgroundPosition: '50% 50%',
			},
		} );
	} );

	it( 'should convert a preset gradient to a CSS custom property', () => {
		expect(
			getBackgroundClassesAndStyles( {
				style: {
					background: { gradient: 'var:preset|gradient|aurora' },
				},
			} ).style
		).toEqual( {
			backgroundImage: 'var(--wp--preset--gradient--aurora)',
		} );
	} );

	it( 'should not add a class when the background is clipped to the text', () => {
		const { className, style } = getBackgroundClassesAndStyles( {
			style: {
				background: {
					gradient: 'var:preset|gradient|aurora',
					backgroundClip: 'text',
				},
			},
		} );
		expect( className ).toBeUndefined();
		expect( style.backgroundClip ).toBe( 'text' );
	} );

	it( 'should return nothing for empty attributes', () => {
		expect( getBackgroundClassesAndStyles( {} ) ).toEqual( {
			className: undefined,
			style: {},
		} );
	} );
} );

describe( 'useBackgroundProps', () => {
	it( 'should return the same props as getBackgroundClassesAndStyles', () => {
		const attributes = {
			style: {
				background: {
					backgroundImage,
					gradient: 'var:preset|gradient|aurora',
				},
			},
		};
		const { result } = renderHook( () => useBackgroundProps( attributes ) );
		expect( result.current ).toEqual(
			getBackgroundClassesAndStyles( attributes )
		);
	} );
} );
