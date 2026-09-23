import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { logged } from '@wordpress/deprecated';
import GradientPicker from '..';

const GRADIENT_A =
	'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)';
const GRADIENT_B =
	'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)';

const DUPLICATE_GRADIENTS = [
	{ name: 'Dark Background', slug: 'dark-background', gradient: GRADIENT_A },
	{ name: 'Dark Text', slug: 'dark-text', gradient: GRADIENT_A },
];

const DEPRECATION_MESSAGE =
	'`asButtons` prop in wp.components.GradientPicker is deprecated since version 7.2. Please use `presentation` instead. Note: `asButtons={ true }` maps to `presentation="toggle-buttons"`. Explicit `presentation` takes precedence.';

beforeEach( () => {
	logged[ DEPRECATION_MESSAGE ] = true;
} );

afterEach( () => {
	delete logged[ DEPRECATION_MESSAGE ];
} );

describe( 'GradientPicker', () => {
	it( 'should use matching values only for display in command button presentation', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		await render(
			<GradientPicker
				aria-label="Gradients"
				gradients={ DUPLICATE_GRADIENTS }
				value={ GRADIENT_A }
				selectedSlug="dark-background"
				onChange={ onChange }
				presentation="command-buttons"
				disableCustomGradients
				clearable={ false }
			/>
		);

		const gradient = screen.getByRole( 'button', {
			name: 'Gradient: Dark Background',
		} );
		expect(
			screen.getByRole( 'group', { name: 'Gradients' } )
		).toBeVisible();
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( gradient ).not.toHaveAttribute( 'aria-pressed' );

		await user.click( gradient );
		expect( onChange ).toHaveBeenCalledWith(
			GRADIENT_A,
			0,
			'dark-background'
		);
	} );

	it( 'should warn for asButtons and prefer an explicit presentation', async () => {
		delete logged[ DEPRECATION_MESSAGE ];
		await render(
			<GradientPicker
				aria-label="Gradients"
				gradients={ DUPLICATE_GRADIENTS }
				onChange={ vi.fn() }
				asButtons={ false }
				presentation="command-buttons"
				disableCustomGradients
				clearable={ false }
			/>
		);

		expect(
			screen.getByRole( 'button', {
				name: 'Gradient: Dark Background',
			} )
		).not.toHaveAttribute( 'aria-pressed' );
		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
	} );

	it( 'should preserve asButtons as a toggle-button alias', async () => {
		await render(
			<GradientPicker
				aria-label="Gradients"
				gradients={ DUPLICATE_GRADIENTS }
				value={ GRADIENT_A }
				selectedSlug="dark-background"
				onChange={ vi.fn() }
				asButtons
				disableCustomGradients
				clearable={ false }
			/>
		);

		expect(
			screen.getByRole( 'button', {
				name: 'Gradient: Dark Background',
				pressed: true,
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Gradient: Dark Text',
				pressed: false,
			} )
		).toBeVisible();
	} );

	describe( 'duplicate gradients in palette', () => {
		it( 'should render all swatches even when two entries share the same gradient value', async () => {
			await render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ undefined }
					onChange={ vi.fn() }
					disableCustomGradients
				/>
			);

			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
		} );

		it( 'should select by slug when selectedSlug is provided, marking only the matching entry', async () => {
			await render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ GRADIENT_A }
					selectedSlug="dark-text"
					onChange={ vi.fn() }
					disableCustomGradients
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// "dark-background" is index 0, "dark-text" is index 1.
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should fall back to value selection and mark all matching duplicates when no selectedSlug is provided', async () => {
			await render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ GRADIENT_A }
					onChange={ vi.fn() }
					disableCustomGradients
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should treat an empty-string selectedSlug as no slug and fall back to value selection', async () => {
			await render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ GRADIENT_A }
					selectedSlug=""
					onChange={ vi.fn() }
					disableCustomGradients
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should pass slug as third argument to onChange when a swatch is clicked', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();

			await render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ undefined }
					onChange={ onChange }
					disableCustomGradients
				/>
			);

			await user.click(
				screen.getByRole( 'option', { name: 'Gradient: Dark Text' } )
			);

			expect( onChange ).toHaveBeenCalledWith(
				GRADIENT_A,
				1,
				'dark-text'
			);
		} );

		it( 'should pass slug as third argument to onChange for multiple-origin gradients', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();

			await render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ [
						{
							name: 'Theme',
							gradients: [
								{
									name: 'Blush',
									slug: 'blush',
									gradient: GRADIENT_B,
								},
							],
						},
					] }
					value={ undefined }
					onChange={ onChange }
					disableCustomGradients
				/>
			);

			await user.click(
				screen.getByRole( 'option', { name: 'Gradient: Blush' } )
			);

			// The second argument is the origin index, mirroring the existing
			// multiple-origin behavior.
			expect( onChange ).toHaveBeenCalledWith( GRADIENT_B, 0, 'blush' );
		} );
	} );
} );
