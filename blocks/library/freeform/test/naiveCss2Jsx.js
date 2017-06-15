/**
 * External dependencies
 */
import { expect } from 'chai';
/**
 * Internal dependencies
 */
import { naiveCss2Jsx } from '../format-list';

describe( 'naiveCss2Jsx', () => {
	it( 'should convert the Paragraph format', () => {
		expect( naiveCss2Jsx(
			'font-family:"Noto Serif",serif;font-size:16px;font-weight:400;' +
			'font-style:normal;text-decoration:none;text-transform:none;' +
			'color:rgb(68, 68, 68);background-color:transparent;border:;' +
			'border-radius:;outline:;text-shadow:none;'
		) ).to.deep.equal( {
			fontFamily: '"Noto Serif",serif',
			fontSize: '16px',
			fontWeight: '400',
			fontStyle: 'normal',
			textDecoration: 'none',
			textTransform: 'none',
			color: 'rgb(68, 68, 68)',
			backgroundColor: 'transparent',
			border: '',
			borderRadius: '',
			outline: '',
			textShadow: 'none',
		} );
	} );
	it( 'should convert the Heading 1 format', () => {
		expect( naiveCss2Jsx(
			'font-family:"Noto Serif",serif;font-size:32px;font-weight:600;' +
			'font-style:normal;text-decoration:none;text-transform:none;' +
			'color:rgb(35, 40, 45);background-color:transparent;border:;' +
			'border-radius:;outline:;text-shadow:none;'
		) ).to.deep.equal( {
			fontFamily: '"Noto Serif",serif',
			fontSize: '32px',
			fontWeight: '600',
			fontStyle: 'normal',
			textDecoration: 'none',
			textTransform: 'none',
			color: 'rgb(35, 40, 45)',
			backgroundColor: 'transparent',
			border: '',
			borderRadius: '',
			outline: '',
			textShadow: 'none',
		} );
	} );
	it( 'should convert the Heading 2/3 format', () => {
		expect( naiveCss2Jsx(
			'font-family:"Noto Serif",serif;font-size:20.8px;font-weight:600;' +
			'font-style:normal;text-decoration:none;text-transform:none;' +
			'color:rgb(35, 40, 45);background-color:transparent;border:;' +
			'border-radius:;outline:;text-shadow:none;'
		) ).to.deep.equal( {
			fontFamily: '"Noto Serif",serif',
			fontSize: '20.8px',
			fontWeight: '600',
			fontStyle: 'normal',
			textDecoration: 'none',
			textTransform: 'none',
			color: 'rgb(35, 40, 45)',
			backgroundColor: 'transparent',
			border: '',
			borderRadius: '',
			outline: '',
			textShadow: 'none',
		} );
	} );
	it( 'should convert the Heading 4 format', () => {
		expect( naiveCss2Jsx(
			'font-family:"Noto Serif",serif;font-size:16px;font-weight:600;' +
			'font-style:normal;text-decoration:none;text-transform:none;' +
			'color:rgb(68, 68, 68);background-color:transparent;border:;' +
			'border-radius:;outline:;text-shadow:none;'
		) ).to.deep.equal( {
			fontFamily: '"Noto Serif",serif',
			fontSize: '16px',
			fontWeight: '600',
			fontStyle: 'normal',
			textDecoration: 'none',
			textTransform: 'none',
			color: 'rgb(68, 68, 68)',
			backgroundColor: 'transparent',
			border: '',
			borderRadius: '',
			outline: '',
			textShadow: 'none',
		} );
	} );
	it( 'should convert the Heading 5 format', () => {
		expect( naiveCss2Jsx(
			'font-family:"Noto Serif",serif;font-size:13.2833px;font-weight:600;' +
			'font-style:normal;text-decoration:none;text-transform:none;' +
			'color:rgb(68, 68, 68);background-color:transparent;border:;' +
			'border-radius:;outline:;text-shadow:none;'
		) ).to.deep.equal( {
			fontFamily: '"Noto Serif",serif',
			fontSize: '13.2833px',
			fontWeight: '600',
			fontStyle: 'normal',
			textDecoration: 'none',
			textTransform: 'none',
			color: 'rgb(68, 68, 68)',
			backgroundColor: 'transparent',
			border: '',
			borderRadius: '',
			outline: '',
			textShadow: 'none',
		} );
	} );
	it( 'should convert the Heading 6 format', () => {
		expect( naiveCss2Jsx(
			'font-family:"Noto Serif",serif;font-size:10.7167px;font-weight:600;' +
			'font-style:normal;text-decoration:none;text-transform:none;' +
			'color:rgb(68, 68, 68);background-color:transparent;border:;' +
			'border-radius:;outline:;text-shadow:none;'
		) ).to.deep.equal( {
			fontFamily: '"Noto Serif",serif',
			fontSize: '10.7167px',
			fontWeight: '600',
			fontStyle: 'normal',
			textDecoration: 'none',
			textTransform: 'none',
			color: 'rgb(68, 68, 68)',
			backgroundColor: 'transparent',
			border: '',
			borderRadius: '',
			outline: '',
			textShadow: 'none',
		} );
	} );
	it( 'should convert the Preformatted format', () => {
		expect( naiveCss2Jsx(
			'font-family:monospace;font-size:16px;font-weight:400;' +
			'font-style:normal;text-decoration:none;text-transform:none;' +
			'color:rgb(68, 68, 68);background-color:transparent;border:;' +
			'border-radius:;outline:;text-shadow:none;'
		) ).to.deep.equal( {
			fontFamily: 'monospace',
			fontSize: '16px',
			fontWeight: '400',
			fontStyle: 'normal',
			textDecoration: 'none',
			textTransform: 'none',
			color: 'rgb(68, 68, 68)',
			backgroundColor: 'transparent',
			border: '',
			borderRadius: '',
			outline: '',
			textShadow: 'none',
		} );
	} );
} );
