/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import TextHighlight from '../index';

let container = null;

const defaultText =
	'We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.';

describe( 'Basic rendering', () => {
	it.each( [ [ 'Gutenberg' ], [ 'media' ] ] )(
		'should highlight the singular occurance of the text "%s" in the text if it exists',
		( highlight ) => {
			act( () => {
				container = render(
					<TextHighlight
						text={ defaultText }
						highlight={ highlight }
					/>
				).container;
			} );

			const highlightedEls = Array.from(
				container.querySelectorAll( 'mark' )
			);

			highlightedEls.forEach( ( el ) => {
				expect( el.innerHTML ).toEqual(
					expect.stringContaining( highlight )
				);
			} );
		}
	);

	it( 'should highlight multiple occurances of the string every time it exists in the text', () => {
		const highlight = 'edit';

		act( () => {
			container = render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			).container;
		} );

		const highlightedEls = Array.from(
			container.querySelectorAll( 'mark' )
		);

		expect( highlightedEls ).toHaveLength( 2 );

		highlightedEls.forEach( ( el ) => {
			expect( el.innerHTML ).toEqual(
				expect.stringContaining( highlight )
			);
		} );
	} );

	it( 'should highlight occurances of a string regardless of capitalisation', () => {
		const highlight = 'The'; // Note this occurs in both sentance of lowercase forms.

		act( () => {
			container = render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			).container;
		} );

		const highlightedEls = Array.from(
			container.querySelectorAll( 'mark' )
		);

		// Our component matcher is case insensitive so string.Containing will
		// return a false failure.
		const regex = new RegExp( highlight, 'i' );

		expect( highlightedEls ).toHaveLength( 2 );

		highlightedEls.forEach( ( el ) => {
			expect( el.innerHTML ).toMatch( regex );
		} );
	} );

	it( 'should not highlight a string that is not in the text', () => {
		const highlight = 'Antidisestablishmentarianism';

		act( () => {
			container = render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			).container;
		} );

		const highlightedEls = Array.from(
			container.querySelectorAll( 'mark' )
		);

		expect( highlightedEls ).toHaveLength( 0 );
	} );
} );
