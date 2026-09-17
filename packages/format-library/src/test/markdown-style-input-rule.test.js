import { describe, expect, it, vi } from 'vitest';
import { applyMarkdownStyleFormat } from '../markdown-style-input-rule';

vi.mock( '@wordpress/rich-text', () => ( {
	remove( value, startIndex, endIndex ) {
		return {
			...value,
			formats: value.formats
				.slice( 0, startIndex )
				.concat( value.formats.slice( endIndex ) ),
			replacements: value.replacements
				.slice( 0, startIndex )
				.concat( value.replacements.slice( endIndex ) ),
			text:
				value.text.slice( 0, startIndex ) +
				value.text.slice( endIndex ),
			start: startIndex,
			end: startIndex,
		};
	},
	applyFormat( value, format, startIndex, endIndex ) {
		const formats = value.formats.slice();

		for ( let index = startIndex; index < endIndex; index++ ) {
			formats[ index ] = [ ...( formats[ index ] || [] ), format ];
		}

		return { ...value, formats };
	},
} ) );

function createValue( text, start = text.length ) {
	return {
		text,
		formats: Array( text.length ),
		replacements: Array( text.length ),
		start,
		end: start,
	};
}

function expectFormat( value, formatType, formattedText ) {
	expect( value.text ).toBe( formattedText );
	expect( value.formats ).toHaveLength( formattedText.length );

	for ( const formats of value.formats ) {
		expect( formats ).toContainEqual( { type: formatType } );
	}
}

describe( 'applyMarkdownStyleFormat', () => {
	it.each( [
		[ '*', 'core/italic', [ '*', '_' ] ],
		[ '_', 'core/italic', [ '*', '_' ] ],
		[ '**', 'core/bold', [ '**', '__' ] ],
		[ '__', 'core/bold', [ '**', '__' ] ],
	] )(
		'formats text typed between %s delimiters',
		( delimiter, type, delimiters ) => {
			const value = createValue( `${ delimiter }text${ delimiter }` );
			const result = applyMarkdownStyleFormat( value, type, delimiters );

			expectFormat( result, type, 'text' );
			expect( result.start ).toBe( 4 );
			expect( result.end ).toBe( 4 );
		}
	);

	it( 'preserves text after a closing delimiter', () => {
		const value = createValue( '**bold** suffix', 8 );
		const result = applyMarkdownStyleFormat( value, 'core/bold', [
			'**',
			'__',
		] );

		expect( result.text ).toBe( 'bold suffix' );
		expect( result.formats ).toHaveLength( result.text.length );
		expect( result.formats.slice( 0, 4 ) ).toEqual( [
			[ { type: 'core/bold' } ],
			[ { type: 'core/bold' } ],
			[ { type: 'core/bold' } ],
			[ { type: 'core/bold' } ],
		] );
		expect(
			result.formats.slice( 4 ).every( ( formats ) => ! formats )
		).toBe( true );
	} );

	it.each( [
		[ 'some_file_name', 10, 'core/italic', [ '*', '_' ] ],
		[ 'foo__bar__baz', 10, 'core/bold', [ '**', '__' ] ],
	] )(
		'does not format intraword underscores in %s',
		( text, start, type, delimiters ) => {
			const value = createValue( text, start );

			expect( applyMarkdownStyleFormat( value, type, delimiters ) ).toBe(
				value
			);
		}
	);

	it.each( [ '* text*', '*text *', '** text**', '**text **' ] )(
		'does not format whitespace-padded text in %s',
		( text ) => {
			const value = createValue( text );
			const delimiters = text.startsWith( '**' )
				? [ '**', '__' ]
				: [ '*', '_' ];

			expect(
				applyMarkdownStyleFormat(
					value,
					'core/test-format',
					delimiters
				)
			).toBe( value );
		}
	);

	it.each( [ '\\*text*', '*text\\*', '\\**text**', '**text\\**' ] )(
		'does not format escaped delimiters in %s',
		( text ) => {
			const value = createValue( text );
			const delimiters = text.includes( '**' )
				? [ '**', '__' ]
				: [ '*', '_' ];

			expect(
				applyMarkdownStyleFormat(
					value,
					'core/test-format',
					delimiters
				)
			).toBe( value );
		}
	);

	it.each( [ '**', '__', '****', '____' ] )(
		'leaves the empty delimiter sequence %s unchanged',
		( text ) => {
			const value = createValue( text );
			let result = applyMarkdownStyleFormat( value, 'core/bold', [
				'**',
				'__',
			] );
			result = applyMarkdownStyleFormat( result, 'core/italic', [
				'*',
				'_',
			] );

			expect( result ).toBe( value );
		}
	);

	it.each( [ '***text***', '___text___' ] )(
		'leaves the unsupported delimiter run in %s unchanged',
		( text ) => {
			const value = createValue( text );
			let result = applyMarkdownStyleFormat( value, 'core/bold', [
				'**',
				'__',
			] );
			result = applyMarkdownStyleFormat( result, 'core/italic', [
				'*',
				'_',
			] );

			expect( result ).toBe( value );
		}
	);

	it( 'preserves formatting already applied inside the delimited text', () => {
		const value = createValue( '*linked*' );

		for ( let index = 1; index < 7; index++ ) {
			value.formats[ index ] = [ { type: 'core/link' } ];
		}

		const result = applyMarkdownStyleFormat( value, 'core/italic', [
			'*',
			'_',
		] );

		expect( result.text ).toBe( 'linked' );
		for ( const formats of result.formats ) {
			expect( formats ).toEqual( [
				{ type: 'core/link' },
				{ type: 'core/italic' },
			] );
		}
	} );
} );
