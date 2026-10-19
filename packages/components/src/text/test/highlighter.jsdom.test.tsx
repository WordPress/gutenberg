import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from '../';

describe( 'Text highlighting', () => {
	it.each( [
		{
			description: 'regular-expression matches',
			text: 'cat c.t',
			words: [ 'c.t' ],
			highlights: [ 'cat', 'c.t' ],
		},
		{
			description: 'literal matches when escaping is enabled',
			text: 'cat c.t',
			words: [ 'c.t' ],
			escape: true,
			highlights: [ 'c.t' ],
		},
		{
			description: 'original text when matching sanitized words',
			text: 'café cafe',
			words: [ 'cafe' ],
			sanitize: ( text: string ) =>
				text.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' ),
			highlights: [ 'café', 'cafe' ],
		},
		{
			description: 'merged overlapping matches',
			text: 'banana',
			words: [ 'ana', 'banana' ],
			highlights: [ 'banana' ],
		},
		{
			description: 'text without search terms',
			text: 'plain text',
			words: [],
			highlights: [],
		},
	] )(
		'preserves $description',
		( { text, words, escape, sanitize, highlights } ) => {
			render(
				<Text
					as="p"
					highlightWords={ words }
					highlightEscape={ escape }
					highlightSanitize={ sanitize }
				>
					{ text }
				</Text>
			);

			expect( screen.getByRole( 'paragraph' ) ).toHaveTextContent( text );
			expect(
				screen
					.queryAllByText( /.+/, { selector: 'mark' } )
					.map( ( mark ) => mark.textContent )
			).toEqual( highlights );
		}
	);

	it( 'preserves empty text', () => {
		render( <Text as="p" highlightWords={ [ 'cat' ] } children="" /> );

		expect( screen.getByRole( 'paragraph' ) ).toBeEmptyDOMElement();
	} );
} );
