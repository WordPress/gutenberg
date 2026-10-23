import { describe, expect, it } from 'vitest';
import splitFirstLine from '../split-first-line';

describe( 'splitFirstLine', () => {
	it( 'keeps a single line whole, with no remainder', () => {
		expect( splitFirstLine( '# 3 reasons why' ) ).toEqual( [
			'# 3 reasons why',
			'',
		] );
	} );

	it( 'splits at the first line break and keeps the remaining breaks', () => {
		expect(
			splitFirstLine( '# Heading\n\nParagraph one.\n\n## Heading two' )
		).toEqual( [ '# Heading', '\nParagraph one.\n\n## Heading two' ] );
	} );

	it( 'normalises Windows line endings', () => {
		expect( splitFirstLine( 'Title\r\n\r\nBody' ) ).toEqual( [
			'Title',
			'\nBody',
		] );
	} );

	it( 'ignores blank lines before the text and line breaks after it', () => {
		expect( splitFirstLine( '\n \nTitle\n' ) ).toEqual( [ 'Title', '' ] );
		expect( splitFirstLine( 'Title\n\n  \n' ) ).toEqual( [ 'Title', '' ] );
	} );

	it( 'keeps spaces within the first line', () => {
		expect( splitFirstLine( ' and ' ) ).toEqual( [ ' and ', '' ] );
	} );
} );
