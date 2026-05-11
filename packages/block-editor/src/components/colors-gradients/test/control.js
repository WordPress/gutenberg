/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
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
		render(
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
		render(
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
} );
