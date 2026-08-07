/**
 * Internal dependencies
 */
import {
	getUniqueTemplatePartTitle,
	getCleanTemplatePartSlug,
	hasCustomOverlayBreakpoint,
	isValidOverlayBreakpoint,
	normalizeOverlayBreakpoint,
} from '../utils';

describe( 'normalizeOverlayBreakpoint', () => {
	it( 'normalizes valid breakpoint values', () => {
		expect( normalizeOverlayBreakpoint( '48rem' ) ).toBe( '48rem' );
		expect( normalizeOverlayBreakpoint( '37.5EM' ) ).toBe( '37.5em' );
		expect( normalizeOverlayBreakpoint( ' 720px ' ) ).toBe( '720px' );
	} );

	it( 'falls back to the default for empty, invalid, or non-positive values', () => {
		expect( normalizeOverlayBreakpoint() ).toBe( '600px' );
		expect( normalizeOverlayBreakpoint( '' ) ).toBe( '600px' );
		expect( normalizeOverlayBreakpoint( '0px' ) ).toBe( '600px' );
		expect( normalizeOverlayBreakpoint( '-1px' ) ).toBe( '600px' );
		expect( normalizeOverlayBreakpoint( '40vw' ) ).toBe( '600px' );
	} );

	it.each( [
		'10px);body{background:red}',
		'10px;background:url(javascript:alert(1))',
		'10px/*comment*/',
		'<style>10px</style>',
		'expression(alert(1))',
		'url(javascript:alert(1))',
		'calc(100vw - 1rem)',
	] )( 'rejects unsafe CSS breakpoint value %p', ( value ) => {
		expect( normalizeOverlayBreakpoint( value ) ).toBe( '600px' );
	} );
} );

describe( 'hasCustomOverlayBreakpoint', () => {
	it( 'returns true only for valid non-default breakpoints', () => {
		expect( hasCustomOverlayBreakpoint( '600px' ) ).toBe( false );
		expect( hasCustomOverlayBreakpoint( '0px' ) ).toBe( false );
		expect( hasCustomOverlayBreakpoint( '48rem' ) ).toBe( true );
	} );
} );

describe( 'isValidOverlayBreakpoint', () => {
	it( 'returns true only for valid positive breakpoints with supported units', () => {
		expect( isValidOverlayBreakpoint( '600px' ) ).toBe( true );
		expect( isValidOverlayBreakpoint( '37.5rem' ) ).toBe( true );
		expect( isValidOverlayBreakpoint( '0px' ) ).toBe( false );
		expect( isValidOverlayBreakpoint( '' ) ).toBe( false );
		expect( isValidOverlayBreakpoint( '37.' ) ).toBe( false );
		expect( isValidOverlayBreakpoint( '40vw' ) ).toBe( false );
	} );
} );

describe( 'getUniqueTemplatePartTitle', () => {
	it( 'should return the title if it is unique', () => {
		const title = 'My Template Part';
		const templateParts = [
			{
				title: {
					rendered: 'Template Part With Another Title',
				},
			},
		];

		expect( getUniqueTemplatePartTitle( title, templateParts ) ).toBe(
			title
		);
	} );

	it( 'should return the title with a suffix if it is not unique', () => {
		const title = 'My Template Part';
		const templateParts = [
			{
				title: {
					rendered: 'My Template Part',
				},
			},
		];

		expect( getUniqueTemplatePartTitle( title, templateParts ) ).toBe(
			'My Template Part 2'
		);
	} );

	it( 'should return the title with correct suffix when multiple titles exist', () => {
		const title = 'My Template Part';
		const templateParts = [
			{
				title: {
					rendered: 'My Template Part',
				},
			},
			{
				title: {
					rendered: 'My Template Part 2',
				},
			},
		];

		expect( getUniqueTemplatePartTitle( title, templateParts ) ).toBe(
			'My Template Part 3'
		);
	} );
} );

describe( 'getCleanTemplatePartSlug', () => {
	it( 'should return a slug with only latin chars', () => {
		const title = 'Myɶ Template Partɮ';
		expect( getCleanTemplatePartSlug( title ) ).toBe( 'my-template-part' );
	} );

	it( 'should return a slug with only latin chars and numbers', () => {
		const title = 'My Template Part 2';
		expect( getCleanTemplatePartSlug( title ) ).toBe(
			'my-template-part-2'
		);
	} );

	it( 'should default the slug to wp-custom-part', () => {
		const title = '';
		expect( getCleanTemplatePartSlug( title ) ).toBe( 'wp-custom-part' );
	} );
} );
