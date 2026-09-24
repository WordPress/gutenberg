import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { logged } from '@wordpress/deprecated';
import { ValidatedInputControl } from '../components';

globalThis.wpVitest.mockMatchMedia();

const DEPRECATION_MESSAGE =
	'wp.components.privateApis.ValidatedInputControl is deprecated since version 7.2. Please use ValidatedInputControl from @wordpress/ui instead. Note: This private API will be completely removed within a few Gutenberg plugin releases.';

beforeEach( () => {
	logged[ DEPRECATION_MESSAGE ] = true;
} );

afterEach( () => {
	delete logged[ DEPRECATION_MESSAGE ];
} );

describe( 'Shows a deprecation warning', () => {
	it( 'ValidatedInputControl', () => {
		delete logged[ DEPRECATION_MESSAGE ];
		render(
			<ValidatedInputControl label="URL" help="Enter a full URL." />
		);

		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
	} );
} );

describe( 'ValidatedInputControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedInputControl label="URL" help="Enter a full URL." />
		);

		expect(
			screen.getByRole( 'textbox', { name: 'URL' } )
		).toHaveAccessibleDescription( 'Enter a full URL.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedInputControl
					label="URL"
					help="Enter a full URL."
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const input = screen.getByRole( 'textbox', { name: /^URL/ } );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( input ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( input ).toHaveAccessibleDescription(
			expect.stringContaining( 'Enter a full URL.' )
		);
	} );
} );
