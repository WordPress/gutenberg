import { describe, expect, it } from 'vitest';
import { shouldOpenStyleBook } from '../utils';

describe( 'shouldOpenStyleBook', () => {
	it.each( [
		'/typography',
		'/colors',
		'/blocks',
		'/blocks/core%2Fparagraph',
		'/background',
		'/shadows',
		'/layout',
	] )( 'opens the Style Book when entering %s from the root', ( section ) => {
		expect( shouldOpenStyleBook( '/', section ) ).toBe( true );
	} );

	it.each( [ '/revisions', '/revisions/123', '/css' ] )(
		'keeps the site preview when entering %s from the root',
		( section ) => {
			expect( shouldOpenStyleBook( '/', section ) ).toBe( false );
		}
	);

	it( 'keeps the current state when moving between sections', () => {
		expect( shouldOpenStyleBook( '/typography', '/colors' ) ).toBe( false );
		expect(
			shouldOpenStyleBook( '/blocks', '/blocks/core%2Fparagraph' )
		).toBe( false );
	} );

	it( 'keeps the current state when returning to the root', () => {
		expect( shouldOpenStyleBook( '/typography', '/' ) ).toBe( false );
	} );
} );
