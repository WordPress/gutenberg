import { describe, expect, it } from 'vitest';
import { shouldShowStyleBook } from '../utils';

describe( 'shouldShowStyleBook', () => {
	it.each( [
		'/',
		'/typography',
		'/colors',
		'/blocks',
		'/blocks/core%2Fparagraph',
	] )(
		'shows the Style Book for %s until the user turns it off',
		( section ) => {
			expect( shouldShowStyleBook( section, undefined ) ).toBe( true );
			expect( shouldShowStyleBook( section, true ) ).toBe( true );
			expect( shouldShowStyleBook( section, false ) ).toBe( false );
		}
	);

	it.each( [ '/revisions', '/revisions/123', '/css' ] )(
		'keeps the site preview for %s',
		( section ) => {
			expect( shouldShowStyleBook( section, undefined ) ).toBe( false );
			expect( shouldShowStyleBook( section, true ) ).toBe( false );
		}
	);
} );
