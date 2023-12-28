/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import TextHighlight from '..';

const getMarks = ( container: Element ) =>
	// Use querySelectorAll because the `mark` role is not officially supported
	// yet. This should be changed to `getByRole` when it is.
	// eslint-disable-next-line testing-library/no-node-access
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
				expect( el ).toHaveTextContent( highlight );
			} );
		} );

		it( 'should highlight occurances of a string regardless of capitalisation', () => {
			// Note that `The` occurs twice in the default text, once in
			// lowercase and once capitalized.
			const highlight = 'The';

			const { container } = render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			);

			const highlightedEls = getMarks( container );

			expect( highlightedEls ).toHaveLength( 2 );

			// Make sure the matcher is case insensitive, since the test should
			// match regardless of the case of the string.
			const regex = new RegExp( highlight, 'i' );

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
