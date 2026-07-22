/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import SkinTonePicker, { SKIN_TONES, applySkinTone } from '../skin-tone-picker';

const RAISED_HAND = {
	label: 'raised hand',
	hexcode: '270B',
	emoji: '✋️',
	skins: [
		{ label: 'raised hand: light skin tone', emoji: '✋🏻', tone: 1 },
		{ label: 'raised hand: medium-light skin tone', emoji: '✋🏼', tone: 2 },
		{ label: 'raised hand: medium skin tone', emoji: '✋🏽', tone: 3 },
		{ label: 'raised hand: medium-dark skin tone', emoji: '✋🏾', tone: 4 },
		{ label: 'raised hand: dark skin tone', emoji: '✋🏿', tone: 5 },
	],
};

describe( 'SKIN_TONES', () => {
	it( 'lists the default tone first, then tones 1-5', () => {
		expect( SKIN_TONES.map( ( t ) => t.tone ) ).toEqual( [
			0, 1, 2, 3, 4, 5,
		] );
	} );

	it( 'uses the raised hand as the exemplar for every swatch', () => {
		for ( const { emoji } of SKIN_TONES ) {
			expect( emoji.codePointAt( 0 ) ).toBe( 0x270b );
		}
	} );
} );

describe( 'applySkinTone', () => {
	it( 'returns the base entry for the default tone', () => {
		expect( applySkinTone( RAISED_HAND, 0 ) ).toBe( RAISED_HAND );
	} );

	it( 'returns the matching skin variant for tones 1-5', () => {
		expect( applySkinTone( RAISED_HAND, 1 ).emoji ).toBe( '✋🏻' );
		expect( applySkinTone( RAISED_HAND, 3 ).emoji ).toBe( '✋🏽' );
		expect( applySkinTone( RAISED_HAND, 5 ).emoji ).toBe( '✋🏿' );
	} );

	it( 'returns the base entry for emoji without skin variants', () => {
		const heart = { label: 'red heart', hexcode: '2764-FE0F', emoji: '❤️' };
		expect( applySkinTone( heart, 3 ) ).toBe( heart );
	} );

	it( 'ignores mixed-tone combination variants', () => {
		const handshake = {
			label: 'handshake',
			hexcode: '1F91D',
			emoji: '🤝',
			skins: [
				{
					label: 'handshake: light, dark',
					emoji: '🫱🏻‍🫲🏿',
					tone: [ 1, 5 ],
				},
			],
		};
		expect( applySkinTone( handshake, 1 ) ).toBe( handshake );
	} );
} );

describe( 'SkinTonePicker', () => {
	it( 'shows the current tone on the persistent toggle', () => {
		render( <SkinTonePicker value={ 3 } onChange={ () => {} } /> );

		const toggle = screen.getByRole( 'button', {
			name: 'Skin tone: Medium skin tone',
		} );
		expect( toggle ).toHaveTextContent( '✋🏽' );
	} );

	it( 'opens a flyout with a heading and six selectable swatches', async () => {
		const user = userEvent.setup();
		render( <SkinTonePicker value={ 0 } onChange={ () => {} } /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Skin tone: Default skin tone',
			} )
		);

		expect(
			screen.getByText( 'Choose your default skin tone' )
		).toBeVisible();
		// The options are laid out horizontally, so the listbox must
		// report its orientation (the ARIA default is vertical).
		expect( screen.getByRole( 'listbox' ) ).toHaveAttribute(
			'aria-orientation',
			'horizontal'
		);
		const options = screen.getAllByRole( 'option' );
		expect( options ).toHaveLength( 6 );
		expect( options[ 0 ] ).toHaveAccessibleName( 'Default skin tone' );
		expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect( options[ 5 ] ).toHaveAttribute( 'aria-selected', 'false' );
	} );

	it( 'places focus on the selected tone when the listbox receives focus', async () => {
		const user = userEvent.setup();
		render( <SkinTonePicker value={ 4 } onChange={ () => {} } /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Skin tone: Medium-dark skin tone',
			} )
		);

		// Per the APG listbox pattern, focus goes to the selected option
		// (not the first) when the listbox receives focus.
		await waitFor( () =>
			expect(
				screen.getByRole( 'option', { name: 'Medium-dark skin tone' } )
			).toHaveFocus()
		);
	} );

	it( 'reports the chosen tone and closes the flyout', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render( <SkinTonePicker value={ 0 } onChange={ onChange } /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Skin tone: Default skin tone',
			} )
		);
		await user.click(
			screen.getByRole( 'option', { name: 'Dark skin tone' } )
		);

		expect( onChange ).toHaveBeenCalledWith( 5 );
		expect(
			screen.queryByText( 'Choose your default skin tone' )
		).not.toBeInTheDocument();
		// Focus returns to the toggle when the flyout closes, even though
		// the flyout manages its own focus on mount.
		expect(
			screen.getByRole( 'button', {
				name: 'Skin tone: Default skin tone',
			} )
		).toHaveFocus();
	} );
} );
