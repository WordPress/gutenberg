import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@wordpress/preferences';
import EmojiPicker from '../emoji-picker';
import type * as EmojibaseData from '../emojibase-data';

const DATASET = [
	{ hexcode: '1F600', emoji: '😀', label: 'grinning face', group: 0 },
	{
		hexcode: '1F603',
		emoji: '😃',
		label: 'grinning face with big eyes',
		group: 0,
	},
	{ hexcode: '1F436', emoji: '🐶', label: 'dog face', group: 3 },
];

vi.mock( import( '../emojibase-data' ), async ( importOriginal ) => {
	const actual = ( await importOriginal() ) as typeof EmojibaseData;
	return {
		...actual,
		useEmojibaseConfig: () => ( { baseUrl: 'https://example.org/' } ),
		useEmojibaseData: () => ( {
			data: DATASET,
			isLoading: false,
			error: null,
			retry: () => {},
		} ),
	};
} );

describe( 'EmojiPicker', () => {
	// Filtering is synchronous, so a live count would announce on every keystroke.
	it( 'does not announce a result count while searching', async () => {
		render(
			<EmojiPicker
				trigger={ <button type="button" aria-label="React" /> }
				label="Add reaction"
				onSelect={ () => {} }
			/>
		);

		fireEvent.click( screen.getByRole( 'combobox', { name: 'React' } ) );

		const search = await screen.findByRole( 'combobox', {
			name: 'Search emoji',
		} );
		fireEvent.change( search, { target: { value: 'grinning' } } );

		await waitFor( () =>
			expect( screen.getAllByRole( 'gridcell' ) ).toHaveLength( 2 )
		);
		expect(
			screen
				.queryAllByRole( 'status' )
				.map( ( region ) => region.textContent )
				.join( '' )
		).not.toMatch( /\d/ );
	} );
} );
