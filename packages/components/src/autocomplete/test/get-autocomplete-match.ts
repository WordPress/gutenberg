/**
 * Internal dependencies
 */
import { getAutocompleteMatch } from '../get-autocomplete-match';
import type { WPCompleter } from '../types';

const createCompleter = (
	overrides: Partial< WPCompleter > = {}
): WPCompleter => ( {
	name: 'test',
	triggerPrefix: '/',
	options: [],
	getOptionLabel: ( option: any ) => option,
	...overrides,
} );

describe( 'getAutocompleteMatch', () => {
	it( 'should return null for empty text content', () => {
		const completers = [ createCompleter() ];
		expect(
			getAutocompleteMatch( '', completers, 0, false, () => '' )
		).toBeNull();
	} );

	it( 'should return null when no completers are provided', () => {
		expect(
			getAutocompleteMatch( 'some text /', [], 0, false, () => '' )
		).toBeNull();
	} );

	it( 'should return null when trigger prefix is not found in text', () => {
		const completers = [ createCompleter( { triggerPrefix: '@' } ) ];
		expect(
			getAutocompleteMatch(
				'no trigger here',
				completers,
				1,
				false,
				() => ''
			)
		).toBeNull();
	} );

	it( 'should match a simple trigger prefix', () => {
		const completers = [ createCompleter( { triggerPrefix: '/' } ) ];
		const result = getAutocompleteMatch(
			'some text /query',
			completers,
			1,
			false,
			() => ''
		);
		expect( result ).toEqual( {
			completer: completers[ 0 ],
			filterValue: 'query',
		} );
	} );

	it( 'should return empty filterValue when only trigger is typed', () => {
		const completers = [ createCompleter( { triggerPrefix: '@' } ) ];
		const result = getAutocompleteMatch(
			'hello @',
			completers,
			1,
			false,
			() => ''
		);
		expect( result ).toEqual( {
			completer: completers[ 0 ],
			filterValue: '',
		} );
	} );

	it( 'should select the completer with the latest trigger index', () => {
		const slashCompleter = createCompleter( {
			name: 'slash',
			triggerPrefix: '/',
		} );
		const atCompleter = createCompleter( {
			name: 'at',
			triggerPrefix: '@',
		} );
		const result = getAutocompleteMatch(
			'/command some text @user',
			[ slashCompleter, atCompleter ],
			1,
			false,
			() => ''
		);
		expect( result?.completer.name ).toBe( 'at' );
	} );

	it( 'should return null when text after trigger is too long (>50 chars)', () => {
		const completers = [ createCompleter( { triggerPrefix: '/' } ) ];
		const longText = '/' + 'a'.repeat( 51 );
		expect(
			getAutocompleteMatch( longText, completers, 1, false, () => '' )
		).toBeNull();
	} );

	it( 'should match when text after trigger is exactly 50 chars', () => {
		const completers = [ createCompleter( { triggerPrefix: '/' } ) ];
		const text = '/' + 'a'.repeat( 50 );
		const result = getAutocompleteMatch(
			text,
			completers,
			1,
			false,
			() => ''
		);
		expect( result ).not.toBeNull();
		expect( result?.filterValue ).toBe( 'a'.repeat( 50 ) );
	} );

	it( 'should return null on mismatch with multiple words and no backspacing', () => {
		const completers = [ createCompleter( { triggerPrefix: '@' } ) ];
		// 4 words from trigger, mismatch (filteredOptionsLength=0), not backspacing
		expect(
			getAutocompleteMatch(
				'text @one two three four',
				completers,
				0,
				false,
				() => ''
			)
		).toBeNull();
	} );

	it( 'should still match on mismatch when there is only one trigger word', () => {
		const completers = [ createCompleter( { triggerPrefix: '@' } ) ];
		const result = getAutocompleteMatch(
			'text @xyz',
			completers,
			0,
			false,
			() => ''
		);
		expect( result ).not.toBeNull();
		expect( result?.filterValue ).toBe( 'xyz' );
	} );

	it( 'should allow matching while backspacing within 3 words of trigger', () => {
		const completers = [ createCompleter( { triggerPrefix: '@' } ) ];
		const result = getAutocompleteMatch(
			'text @one two three',
			completers,
			0,
			true,
			() => ''
		);
		expect( result ).not.toBeNull();
	} );

	it( 'should NOT match while backspacing if more than 3 words from trigger', () => {
		const completers = [ createCompleter( { triggerPrefix: '@' } ) ];
		expect(
			getAutocompleteMatch(
				'text @one two three four',
				completers,
				0,
				true,
				() => ''
			)
		).toBeNull();
	} );

	it( 'should return null when text after trigger starts with whitespace', () => {
		const completers = [ createCompleter( { triggerPrefix: '/' } ) ];
		expect(
			getAutocompleteMatch( '/ query', completers, 1, false, () => '' )
		).toBeNull();
	} );

	it( 'should return null when text after trigger ends with multiple spaces', () => {
		const completers = [ createCompleter( { triggerPrefix: '/' } ) ];
		expect(
			getAutocompleteMatch( '/query  ', completers, 1, false, () => '' )
		).toBeNull();
	} );

	it( 'should respect allowContext returning false', () => {
		const completers = [
			createCompleter( {
				triggerPrefix: '@',
				allowContext: () => false,
			} ),
		];
		expect(
			getAutocompleteMatch( 'text @user', completers, 1, false, () => '' )
		).toBeNull();
	} );

	it( 'should pass correct before/after text to allowContext', () => {
		const allowContext = jest.fn().mockReturnValue( true );
		const completers = [
			createCompleter( {
				triggerPrefix: '@',
				allowContext,
			} ),
		];
		getAutocompleteMatch(
			'before @user',
			completers,
			1,
			false,
			() => 'after'
		);
		expect( allowContext ).toHaveBeenCalledWith( 'before ', 'after' );
	} );

	it( 'should handle accented characters in filter value', () => {
		const completers = [ createCompleter( { triggerPrefix: '@' } ) ];
		const result = getAutocompleteMatch(
			'text @café',
			completers,
			1,
			false,
			() => ''
		);
		expect( result ).not.toBeNull();
		expect( result?.filterValue ).toBe( 'cafe' );
	} );

	it( 'should handle special regex characters in trigger prefix', () => {
		const completers = [ createCompleter( { triggerPrefix: '$$' } ) ];
		const result = getAutocompleteMatch(
			'text $$query',
			completers,
			1,
			false,
			() => ''
		);
		expect( result ).not.toBeNull();
		expect( result?.filterValue ).toBe( 'query' );
	} );

	it( 'should match with spaces in filter value (single space)', () => {
		const completers = [ createCompleter( { triggerPrefix: '/' } ) ];
		const result = getAutocompleteMatch(
			'/hello world',
			completers,
			1,
			false,
			() => ''
		);
		expect( result ).not.toBeNull();
		expect( result?.filterValue ).toBe( 'hello world' );
	} );

	it.each( [
		{
			text: 'café @user',
			trigger: '@',
			expected: 'user',
			desc: 'accented text before trigger',
		},
		{
			text: 'naïve /command',
			trigger: '/',
			expected: 'command',
			desc: 'accented text before trigger (diaeresis)',
		},
		{
			text: 'résumé @josé',
			trigger: '@',
			expected: 'jose',
			desc: 'accents both before and after trigger',
		},
		{
			text: '@café',
			trigger: '@',
			expected: 'cafe',
			desc: 'accented text after trigger only',
		},
		{
			text: 'a /héllo wörld',
			trigger: '/',
			expected: 'hello world',
			desc: 'accented multi-word filter value',
		},
	] )(
		'should handle accents correctly: $desc',
		( { text, trigger, expected } ) => {
			const completers = [
				createCompleter( { triggerPrefix: trigger } ),
			];
			const result = getAutocompleteMatch(
				text,
				completers,
				1,
				false,
				() => ''
			);
			expect( result ).not.toBeNull();
			expect( result?.filterValue ).toBe( expected );
		}
	);
} );
