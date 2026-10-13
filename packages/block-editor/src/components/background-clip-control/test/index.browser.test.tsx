import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { VALID_BACKGROUND_CLIP_VALUES } from '@wordpress/style-engine';
import BackgroundClipControl from '..';

/**
 * Opens the control and returns the labels it offers.
 *
 * Runs in a browser: the select needs real focus to open its options.
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
				allowedValues={ VALID_BACKGROUND_CLIP_VALUES }
			/>
		);

		expect( await openOptions() ).toEqual( [
			'Default',
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
			'Default',
			'Border box',
			'Padding box',
		] );
	} );

	it( 'reports the chosen value to the caller', async () => {
		const onChange = vi.fn();
		await render(
			<BackgroundClipControl
				onChange={ onChange }
				allowedValues={ VALID_BACKGROUND_CLIP_VALUES }
			/>
		);

		await openOptions();
		await userEvent.click( screen.getByRole( 'option', { name: 'Text' } ) );

		expect( onChange ).toHaveBeenCalledWith( 'text' );
	} );

	it( 'says nothing is set rather than naming the first allowed value', async () => {
		await render(
			<BackgroundClipControl
				onChange={ vi.fn() }
				allowedValues={ [ 'padding-box', 'text' ] }
			/>
		);

		// The block renders `border-box`, which this list leaves out.
		expect(
			await screen.findByRole( 'combobox', { name: 'Clip' } )
		).toHaveTextContent( 'Default' );
	} );

	it( 'reports an unset value to the caller as undefined', async () => {
		const onChange = vi.fn();
		await render(
			<BackgroundClipControl
				value="text"
				onChange={ onChange }
				allowedValues={ VALID_BACKGROUND_CLIP_VALUES }
			/>
		);

		await openOptions();
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Default' } )
		);

		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	it( 'shows the current value', async () => {
		await render(
			<BackgroundClipControl
				value="text"
				onChange={ vi.fn() }
				allowedValues={ VALID_BACKGROUND_CLIP_VALUES }
			/>
		);

		expect(
			await screen.findByRole( 'combobox', { name: 'Clip' } )
		).toHaveTextContent( 'Text' );
	} );

	it( 'renders nothing when no values are allowed', async () => {
		await render(
			<BackgroundClipControl onChange={ vi.fn() } allowedValues={ [] } />
		);

		expect(
			screen.queryByRole( 'combobox', { name: 'Clip' } )
		).not.toBeInTheDocument();
	} );
} );
