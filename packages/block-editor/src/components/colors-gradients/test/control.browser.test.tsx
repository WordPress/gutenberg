import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import ColorGradientControl from '../control';

const noop = () => {};

describe( 'ColorPaletteControl', () => {
	it( 'renders tabs if it is possible to select a color and a gradient rendering a color picker at the start', async () => {
		await render(
			<ColorGradientControl
				label="Test Color Gradient"
				colorValue="#f00"
				colors={ [
					{ color: '#f00', name: 'red' },
					{ color: '#0f0', name: 'green' },
				] }
				gradients={ [
					{
						gradient:
							'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%',
						name: 'Vivid cyan blue to vivid purple',
						slug: 'vivid-cyan-blue-to-vivid-purple',
					},
					{
						gradient:
							'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
						name: 'Light green cyan to vivid green cyan',
						slug: 'light-green-cyan-to-vivid-green-cyan',
					},
				] }
				disableCustomColors={ false }
				disableCustomGradients={ false }
				onColorChange={ noop }
				onGradientChange={ noop }
			/>
		);

		// Is showing the two tab buttons.
		expect(
			screen.getByRole( 'tab', { name: 'Color' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'tab', { name: 'Gradient' } )
		).toBeInTheDocument();

		// Is showing the two predefined Colors.
		expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
	} );

	it( 'renders the color picker and does not render tabs if it is only possible to select a color', async () => {
		await render(
			<ColorGradientControl
				label="Test Color Gradient"
				colorValue="#f00"
				colors={ [
					{ color: '#f00', name: 'red' },
					{ color: '#0f0', name: 'green' },
				] }
				gradients={ [] }
				disableCustomColors={ false }
				disableCustomGradients
				onColorChange={ noop }
				onGradientChange={ noop }
			/>
		);

		// Is not showing the two tab buttons.
		expect(
			screen.queryByRole( 'tab', { name: 'Color' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'tab', { name: 'Gradient' } )
		).not.toBeInTheDocument();

		// Is showing the two predefined Colors.
		expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
	} );

	it( 'renders the gradient picker and does not render tabs if it is only possible to select a gradient', async () => {
		await render(
			<ColorGradientControl
				label="Test Color Gradient"
				colorValue="#f00"
				colors={ [] }
				gradients={ [
					{
						gradient:
							'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%',
						name: 'Vivid cyan blue to vivid purple',
						slug: 'vivid-cyan-blue-to-vivid-purple',
					},
					{
						gradient:
							'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
						name: 'Light green cyan to vivid green cyan',
						slug: 'light-green-cyan-to-vivid-green-cyan',
					},
				] }
				disableCustomColors
				disableCustomGradients={ false }
				onColorChange={ noop }
				onGradientChange={ noop }
			/>
		);

		// Is not showing the two tab buttons.
		expect(
			screen.queryByRole( 'tab', { name: 'Color' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'tab', { name: 'Gradient' } )
		).not.toBeInTheDocument();

		// Is showing the two predefined Gradients.
		expect( screen.getAllByLabelText( /^Gradient:/ ) ).toHaveLength( 2 );

		// Is showing the custom gradient picker.
		expect(
			screen.getAllByRole( 'button', {
				expanded: false,
				name: /^Gradient control point at position/,
			} )[ 0 ]
		).toHaveClass(
			'components-custom-gradient-picker__control-point-button'
		);
	} );

	describe( 'slug-based color selection', () => {
		// Two entries that share the same hex value — used to verify that slug
		// disambiguation works correctly.
		const DUPLICATE_COLOR_PALETTE = [
			{
				color: '#000',
				name: 'Dark Background',
				slug: 'dark-background',
			},
			{ color: '#000', name: 'Dark Text', slug: 'dark-text' },
		];

		it( 'forwards colorSlug as selectedSlug to ColorPalette, marking only the slug-matched swatch as selected', async () => {
			await render(
				<ColorGradientControl
					label="Test Color Gradient"
					colorValue="#000"
					colorSlug="dark-text"
					colors={ DUPLICATE_COLOR_PALETTE }
					gradients={ [] }
					disableCustomColors={ false }
					disableCustomGradients
					onColorChange={ noop }
					onGradientChange={ noop }
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// 'dark-background' is index 0, 'dark-text' is index 1.
			// With colorSlug="dark-text", only the second swatch should be selected.
			expect( options[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
			expect( options[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		} );

		it( 'calls onColorChange with (color, slug) when a swatch is clicked (color-only palette)', async () => {
			const onColorChange = vi.fn();

			await render(
				<ColorGradientControl
					label="Test Color Gradient"
					colorValue={ undefined }
					colors={ DUPLICATE_COLOR_PALETTE }
					gradients={ [] }
					disableCustomColors={ false }
					disableCustomGradients
					onColorChange={ onColorChange }
					onGradientChange={ noop }
				/>
			);

			const options = screen.getAllByRole( 'option' );
			// Click the second swatch: color='#000', slug='dark-text'.
			await userEvent.click( options[ 1 ] );

			expect( onColorChange ).toHaveBeenCalledWith( '#000', 'dark-text' );
		} );

		it( 'calls onColorChange with (color, slug) and calls onGradientChange() when both colors and gradients are available', async () => {
			const onColorChange = vi.fn();
			const onGradientChange = vi.fn();

			await render(
				<ColorGradientControl
					label="Test Color Gradient"
					colorValue={ undefined }
					colors={ DUPLICATE_COLOR_PALETTE }
					gradients={ [
						{
							gradient:
								'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
							name: 'Vivid cyan blue to vivid purple',
							slug: 'vivid-cyan-blue-to-vivid-purple',
						},
					] }
					disableCustomColors={ false }
					disableCustomGradients={ false }
					onColorChange={ onColorChange }
					onGradientChange={ onGradientChange }
				/>
			);

			// When both colors and gradients are available the color tab is shown
			// by default (no gradientValue). Click the first color swatch.
			const options = screen.getAllByRole( 'option' );
			await userEvent.click( options[ 0 ] );

			// First entry: color='#000', slug='dark-background'.
			expect( onColorChange ).toHaveBeenCalledWith(
				'#000',
				'dark-background'
			);
			// Selecting a color must also clear the active gradient.
			expect( onGradientChange ).toHaveBeenCalledTimes( 1 );
			expect( onGradientChange ).toHaveBeenCalledWith();
		} );
	} );

	describe( 'contrast notice container layout stability', () => {
		it( 'does not render notice container when noticeProps is not provided', async () => {
			const { container } = await render(
				<ColorGradientControl
					label="Link Color"
					colorValue="#000"
					colors={ [ { color: '#000', name: 'black' } ] }
					gradients={ [] }
					disableCustomColors={ false }
					disableCustomGradients
					onColorChange={ noop }
					onGradientChange={ noop }
				/>
			);

			expect(
				// eslint-disable-next-line testing-library/no-node-access
				container.querySelector(
					'.block-editor-color-gradient-control__notice-container'
				)
			).not.toBeInTheDocument();
		} );

		it( 'renders notice container when noticeProps is provided', async () => {
			const { container } = await render(
				<ColorGradientControl
					label="Link Color"
					colorValue="#000"
					colors={ [ { color: '#000', name: 'black' } ] }
					gradients={ [] }
					disableCustomColors={ false }
					disableCustomGradients
					onColorChange={ noop }
					onGradientChange={ noop }
					noticeProps={ {
						status: 'warning',
						children: 'Notice with warning',
					} }
				/>
			);

			expect(
				within( container ).getByText( 'Notice with warning' )
			).toBeInTheDocument();

			expect(
				// eslint-disable-next-line testing-library/no-node-access
				container.querySelector(
					'.block-editor-color-gradient-control__notice-container'
				)
			).toBeInTheDocument();
		} );

		it( 'preserves notice container min-height when notice is cleared during an active session', async () => {
			const { container, rerender } = await render(
				<ColorGradientControl
					label="Link Color"
					colorValue="#fff"
					colors={ [ { color: '#fff', name: 'white' } ] }
					gradients={ [] }
					disableCustomColors={ false }
					disableCustomGradients
					onColorChange={ noop }
					onGradientChange={ noop }
					noticeProps={ {
						status: 'warning',
						children: 'Notice cleared dynamically',
					} }
				/>
			);

			expect(
				within( container ).getByText( 'Notice cleared dynamically' )
			).toBeInTheDocument();

			// Rerender as when user picks a good-contrast color:
			await rerender(
				<ColorGradientControl
					label="Link Color"
					colorValue="#000"
					colors={ [ { color: '#000', name: 'black' } ] }
					gradients={ [] }
					disableCustomColors={ false }
					disableCustomGradients
					onColorChange={ noop }
					onGradientChange={ noop }
					noticeProps={ undefined }
				/>
			);

			// The text is removed from accessibility tree & DOM.
			expect(
				within( container ).queryByText( 'Notice cleared dynamically' )
			).not.toBeInTheDocument();

			// But the container remains mounted so Floating UI won't jump.
			// eslint-disable-next-line testing-library/no-node-access
			const noticeContainer = container.querySelector(
				'.block-editor-color-gradient-control__notice-container'
			);
			expect( noticeContainer ).toBeInTheDocument();
		} );
	} );
} );
