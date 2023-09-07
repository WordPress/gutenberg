/**
 * Internal dependencies
 */
import { getPreviewStyle } from '../index';

describe( 'getPreviewStyle', () => {
	it( 'should return default fontStyle and fontWeight if fontFace is not provided', () => {
		const family = { fontFamily: 'Rosario' };
		const result = getPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontWeight: '400',
			fontStyle: 'normal',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontStyle as "normal" if fontFace contains "normal" style', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '600' },
			],
		};
		const result = getPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '600',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontStyle as "itaic" if fontFace does not contain "normal" style', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'italic', fontWeight: '600' },
			],
		};
		const result = getPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'italic',
			fontWeight: '500',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontWeight as string', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '700' },
			],
		};
		const result = getPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '700',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontWeight as "400" if fontFace contains "normal" style with "400" weight', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '400' },
			],
		};
		const result = getPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '400',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return the fontWeight of the nearest "normal" style if no "400" weight is found', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'normal', fontWeight: '800' },
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '600' },
			],
		};
		const result = getPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '600',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return 400 or the the nearest "normal" style if it using a variable weight font', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'normal', fontWeight: '100' },
				{ fontStyle: 'normal', fontWeight: '200 900' },
				{ fontStyle: 'italic', fontWeight: '200 900' },
			],
		};
		const result = getPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '400',
		};
		expect( result ).toEqual( expected );
	} );
} );
