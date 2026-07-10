/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import ReactionEmojiPicker, {
	REACTION_EMOJIS,
	buildEmojiBySlugMap,
} from '../reaction-emoji-picker';

describe( 'buildEmojiBySlugMap', () => {
	it( 'indexes every curated emoji by its slug', () => {
		const map = buildEmojiBySlugMap();

		expect( map.size ).toBe( REACTION_EMOJIS.length );
		REACTION_EMOJIS.forEach( ( entry ) => {
			expect( map.get( entry.value ) ).toBe( entry );
		} );
	} );

	it( 'indexes a custom emoji list when provided', () => {
		const custom = [ { emoji: '⭐', label: 'Star', value: 'star' } ];
		const map = buildEmojiBySlugMap( custom );

		expect( map.size ).toBe( 1 );
		expect( map.get( 'star' ) ).toEqual( custom[ 0 ] );
		expect( map.get( 'heart' ) ).toBeUndefined();
	} );
} );

describe( 'ReactionEmojiPicker', () => {
	it( 'renders a labelled listbox with one option per curated emoji', () => {
		render( <ReactionEmojiPicker onSelect={ () => {} } /> );

		expect(
			screen.getByRole( 'listbox', {
				name: 'Select an emoji reaction',
			} )
		).toBeVisible();

		const options = screen.getAllByRole( 'option' );
		expect( options ).toHaveLength( REACTION_EMOJIS.length );
		REACTION_EMOJIS.forEach( ( { label } ) => {
			expect(
				screen.getByRole( 'option', { name: label } )
			).toBeVisible();
		} );
	} );

	it( 'calls onSelect with the storage slug, not the emoji character', async () => {
		const user = userEvent.setup();
		const onSelect = jest.fn();
		render( <ReactionEmojiPicker onSelect={ onSelect } /> );

		await user.click( screen.getByRole( 'option', { name: 'Smile' } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( 'smile' );
	} );
} );
