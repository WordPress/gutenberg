import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuggestionSizeNotice from '../suggestion-size-notice';

const MESSAGE =
	'This suggestion is too large to keep out of the saved post. It stays hidden from visitors until someone accepts or rejects it.';

describe( 'SuggestionSizeNotice', () => {
	it( 'explains a suggestion the last save could not move out of the post', () => {
		render(
			<SuggestionSizeNotice
				thread={ {
					id: 1,
					meta: { _wp_suggestion_extraction_skipped: true },
				} }
			/>
		);
		expect( screen.getByText( MESSAGE ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'the flag is not set', { id: 1, meta: {} } ],
		[
			'the flag is false',
			{ id: 1, meta: { _wp_suggestion_extraction_skipped: false } },
		],
		[ 'the note has no meta', { id: 1 } ],
		[ 'there is no note', undefined ],
	] )( 'renders nothing when %s', ( _label, thread ) => {
		const { container } = render(
			<SuggestionSizeNotice thread={ thread } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );
} );
