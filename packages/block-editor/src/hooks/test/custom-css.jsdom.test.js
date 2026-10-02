import { describe, expect, it } from 'vitest';
import { getValidCustomCSSStateEntries } from '../custom-css';

describe( 'getValidCustomCSSStateEntries', () => {
	it( 'keeps valid entries when another state contains HTML markup', () => {
		const validEntry = {
			css: 'color: red;',
			pseudoState: undefined,
			mediaQuery: undefined,
		};

		expect(
			getValidCustomCSSStateEntries( [
				validEntry,
				{
					css: '<script>alert(1)</script>',
					pseudoState: ':hover',
					mediaQuery: undefined,
				},
			] )
		).toEqual( [ validEntry ] );
	} );

	it( 'returns no entries when all states contain HTML markup', () => {
		expect(
			getValidCustomCSSStateEntries( [
				{
					css: '<script>alert(1)</script>',
					pseudoState: undefined,
					mediaQuery: undefined,
				},
			] )
		).toEqual( [] );
	} );
} );
