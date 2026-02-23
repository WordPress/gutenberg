/**
 * Internal dependencies
 */
import { getDimensionsClassesAndStyles } from '../use-dimensions-props';

describe( 'getDimensionsClassesAndStyles', () => {
	it( 'should return empty className and style when no dimensions attributes are provided', () => {
		const attributes = { style: {} };
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: undefined,
			style: {},
		} );
	} );

	it( 'should return has-aspect-ratio className and aspectRatio style', () => {
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

	it( 'should return height style', () => {
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
			},
		} );
	} );

	it( 'should return minHeight style', () => {
		const attributes = {
			style: {
				dimensions: {
					minHeight: '300px',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: undefined,
			style: {
				minHeight: '300px',
			},
		} );
	} );

	it( 'should return all dimension styles when multiple are provided', () => {
		const attributes = {
			style: {
				dimensions: {
					aspectRatio: '4/3',
					width: '100%',
				},
			},
		};
		expect( getDimensionsClassesAndStyles( attributes ) ).toEqual( {
			className: 'has-aspect-ratio',
			style: {
				aspectRatio: '4/3',
				width: '100%',
			},
		} );
	} );
} );
