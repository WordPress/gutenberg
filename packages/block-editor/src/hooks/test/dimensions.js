/**
 * Internal dependencies
 */
import { getDimensionsClassesAndStyles } from '../get-dimensions-classes-and-styles';

describe( 'getDimensionsClassesAndStyles', () => {
	it( 'should return empty className and style if no dimensions attributes', () => {
		const attributes = { style: {} };
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: undefined,
			style: {},
		} );
	} );

	it( 'should return className and style for aspect ratio', () => {
		const attributes = {
			style: {
				dimensions: {
					aspectRatio: '16/9',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: 'has-aspect-ratio',
			style: {
				aspectRatio: '16/9',
				height: 'unset',
				minHeight: 'unset',
			},
		} );
	} );

	it( 'should unset aspect ratio if minHeight is present', () => {
		const attributes = {
			style: {
				dimensions: {
					minHeight: '500px',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: undefined,
			style: {
				minHeight: '500px',
				aspectRatio: 'unset',
			},
		} );
	} );

	it( 'should unset aspect ratio if height is present', () => {
		const attributes = {
			style: {
				dimensions: {
					height: '500px',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: undefined,
			style: {
				height: '500px',
				aspectRatio: 'unset',
			},
		} );
	} );

	it( 'should return width style', () => {
		const attributes = {
			style: {
				dimensions: {
					width: '100%',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: undefined,
			style: {
				width: '100%',
			},
		} );
	} );

	it( 'should prioritize aspect ratio over explicit height attributes', () => {
		const attributes = {
			height: '100px',
			style: {
				dimensions: {
					aspectRatio: '1',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: 'has-aspect-ratio',
			style: {
				aspectRatio: '1',
				minHeight: 'unset',
				height: 'unset',
			},
		} );
	} );

	it( 'should prioritize height over unset aspect ratio', () => {
		const attributes = {
			style: {
				dimensions: {
					minHeight: '100px',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: undefined,
			style: {
				minHeight: '100px',
				aspectRatio: 'unset',
			},
		} );
	} );
} );
