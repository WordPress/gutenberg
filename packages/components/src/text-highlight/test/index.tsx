/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import TextHighlight from '..';

const getMarks = ( container: Element ) =>
	Array.from( container.querySelectorAll( 'mark' ) );

const defaultText =
	'We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.';

describe( 'TextHighlight', () => {
	describe( 'Basic rendering', () => {
		it.each( [ [ 'Gutenberg' ], [ 'media' ] ] )(
			'should highlight the singular occurance of the text "%s" in the text if it exists',
			( highlight ) => {
				const { container } = render(
					<TextHighlight
						text={ defaultText }
						highlight={ highlight }
					/>
				);

				const highlightedEls = getMarks( container );

				highlightedEls.forEach( ( el ) => {
					expect( el ).toHaveTextContent(
						new RegExp( `^${ highlight }$` )
					);
				} );
			}
		);

		it( 'should highlight multiple occurances of the string every time it exists in the text', () => {
			const highlight = 'edit';

			const { container } = render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			);

			const highlightedEls = getMarks( container );

			expect( highlightedEls ).toHaveLength( 2 );

			highlightedEls.forEach( ( el ) => {
				expect( el.textContent ).toEqual(
					expect.stringContaining( highlight )
				);
			} );
		} );

		it( 'should highlight occurances of a string regardless of capitalisation', () => {
			const highlight = 'The'; // Note this occurs in both sentance of lowercase forms.

			const { container } = render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			);

			const highlightedEls = getMarks( container );

			// Our component matcher is case insensitive so string. Containing
			// will return a false failure.
			const regex = new RegExp( highlight, 'i' );

			expect( highlightedEls ).toHaveLength( 2 );

			highlightedEls.forEach( ( el ) => {
				expect( el.innerHTML ).toMatch( regex );
			} );
		} );

		it( 'should not highlight a string that is not in the text', () => {
			const highlight = 'Antidisestablishmentarianism';

			const { container } = render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			);

			const highlightedEls = getMarks( container );

			expect( highlightedEls ).toHaveLength( 0 );
		} );
	} );
} );
