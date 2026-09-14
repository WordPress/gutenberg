import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import BackgroundClipControl, { ALL_BACKGROUND_CLIP_VALUES } from '..';

/**
 * Opens the control and returns the labels it offers.
 *
 * The options only exist once the select is open, and the select needs real
 * focus, so this suite runs in a browser rather than jsdom.
 */
async function openOptions() {
	await userEvent.click( screen.getByRole( 'combobox', { name: 'Clip' } ) );
	return screen
		.findAllByRole( 'option' )
		.then( ( options ) =>
			Promise.all(
				options.map( ( option ) => option.textContent?.trim() )
			)
		);
}

describe( 'BackgroundClipControl', () => {
	it( 'offers every value, text included, when all are allowed', async () => {
		await render(
			<BackgroundClipControl
				onChange={ vi.fn() }
				allowedValues={ ALL_BACKGROUND_CLIP_VALUES }
			/>
		);

		expect( await openOptions() ).toEqual( [
			'Border box',
			'Padding box',
			'Content box',
			'Text',
		] );
	} );

	it( 'offers only the values a theme names', async () => {
		await render(
			<BackgroundClipControl
				onChange={ vi.fn() }
				allowedValues={ [ 'border-box', 'padding-box' ] }
			/>
		);

		expect( await openOptions() ).toEqual( [
			'Border box',
			'Padding box',
		] );
	} );

	it( 'reports the chosen value to the caller', async () => {
		const onChange = vi.fn();
		await render(
			<BackgroundClipControl
				onChange={ onChange }
				allowedValues={ ALL_BACKGROUND_CLIP_VALUES }
			/>
		);

		await openOptions();
		await userEvent.click( screen.getByRole( 'option', { name: 'Text' } ) );

		expect( onChange ).toHaveBeenCalledWith( 'text' );
	} );
} );
