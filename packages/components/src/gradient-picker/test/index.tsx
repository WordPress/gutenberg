import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GradientPicker from '..';

const GRADIENT_A =
	'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)';
const GRADIENT_B =
	'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)';

const DUPLICATE_GRADIENTS = [
	{ name: 'Dark Background', slug: 'dark-background', gradient: GRADIENT_A },
	{ name: 'Dark Text', slug: 'dark-text', gradient: GRADIENT_A },
];

describe( 'GradientPicker', () => {
	describe( 'duplicate gradients in palette', () => {
		it( 'should render all swatches even when two entries share the same gradient value', () => {
			render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ undefined }
					onChange={ jest.fn() }
					disableCustomGradients
				/>
			);

			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
		} );

		it( 'should select by slug when selectedSlug is provided, marking only the matching entry', () => {
			render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ GRADIENT_A }
					selectedSlug="dark-text"
					onChange={ jest.fn() }
					disableCustomGradients
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// "dark-background" is index 0, "dark-text" is index 1.
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should fall back to value selection and mark all matching duplicates when no selectedSlug is provided', () => {
			render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ GRADIENT_A }
					onChange={ jest.fn() }
					disableCustomGradients
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should treat an empty-string selectedSlug as no slug and fall back to value selection', () => {
			render(
				<GradientPicker
					aria-label="Gradient"
					gradients={ DUPLICATE_GRADIENTS }
					value={ GRADIENT_A }
					selectedSlug=""
					onChange={ jest.fn() }
					disableCustomGradients
				/>
			);

			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'should pass slug as third argument to onChange when a swatch is clicked', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
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
			const onChange = jest.fn();

			render(
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
