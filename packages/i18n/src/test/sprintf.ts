// Mock memoization as identity function. Inline since Jest errors on
// out-of-scope references in a mock callback.
interface MemizeMock {
	< T extends ( ...args: any[] ) => any >( fn: T ): T;
}

jest.mock( 'memize', (): MemizeMock => ( fn ) => fn );

/**
 * Internal dependencies
 */
import { sprintf } from '../sprintf';
import type { TransformedText } from '../types';

describe( 'i18n', () => {
	describe( 'sprintf', () => {
		it( 'replaces placeholders', () => {
			const result = sprintf( 'bonjour %s', 'Riad' );

			expect( result ).toBe( 'bonjour Riad' );
		} );

		it( 'replaces named placeholders', () => {
			const result = sprintf( 'bonjour %(name)s', { name: 'Riad' } );

			expect( result ).toBe( 'bonjour Riad' );
		} );

		it( 'preserves format string literal in return type', () => {
			const result = sprintf( '<Name>%s</Name>', 'Riad' );

			// Type-level test: sprintf return type should be TransformedText
			// preserving the format string literal.
			const _check: TransformedText< '<Name>%s</Name>' > = result;
			void _check;

			// At runtime it's still a regular string.
			expect( typeof result ).toBe( 'string' );
			expect( result ).toBe( '<Name>Riad</Name>' );
		} );
	} );
} );
