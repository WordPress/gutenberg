/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { create, act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../control';

const noop = () => {};

const getButtonWithAriaLabelStartPredicate =
	( ariaLabelStart ) => ( element ) => {
		return (
			element.type === 'button' &&
			element.props[ 'aria-label' ] &&
			element.props[ 'aria-label' ].startsWith( ariaLabelStart )
		);
	};

describe( 'ColorPaletteControl', () => {
	it( 'renders tabs if it is possible to select a color and a gradient rendering a color picker at the start', async () => {
		render(
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
			screen.getByRole( 'tab', { name: 'Solid color' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'tab', { name: 'Gradient' } )
		).toBeInTheDocument();

		// Is showing the two predefined Colors.
		expect( screen.getAllByLabelText( /^Color:/ ) ).toHaveLength( 2 );
	} );

	it( 'renders the color picker and does not render tabs if it is only possible to select a color', async () => {
		let wrapper;

		await act( async () => {
			wrapper = create(
				<ColorGradientControl
					label="Test Color Gradient"
					colorValue="#f00"
					colors={ [
						{ color: '#f00', name: 'red' },
						{ color: '#0f0', name: 'green' },
					] }
					gradients={ [] }
					disableCustomColors={ false }
					disableCustomGradients={ true }
					onColorChange={ noop }
					onGradientChange={ noop }
				/>
			);
		} );

		// Is not showing the two tab buttons.
		expect(
			screen.queryByRole( 'tab', { name: 'Solid color' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'tab', { name: 'Gradient' } )
		).not.toBeInTheDocument();

		// Is showing the two predefined Colors.
		expect(
			wrapper.root.findAll(
				getButtonWithAriaLabelStartPredicate( 'Color:' )
			)
		).toHaveLength( 2 );
	} );

	it( 'renders the gradient picker and does not render tabs if it is only possible to select a gradient', async () => {
		let wrapper;

		await act( async () => {
			wrapper = create(
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
					disableCustomColors={ true }
					disableCustomGradients={ false }
					onColorChange={ noop }
					onGradientChange={ noop }
				/>
			);
		} );

		// Is not showing the two tab buttons.
		expect(
			screen.queryByRole( 'tab', { name: 'Solid color' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'tab', { name: 'Gradient' } )
		).not.toBeInTheDocument();

		// Is showing the two predefined Gradients.
		expect(
			wrapper.root.findAll(
				getButtonWithAriaLabelStartPredicate( 'Gradient:' )
			)
		).toHaveLength( 2 );

		// Is showing the custom gradient picker.
		expect(
			wrapper.root.findAll(
				( element ) =>
					element.props &&
					element.props.className &&
					element.props.className.includes(
						'components-custom-gradient-picker'
					)
			).length
		).toBeGreaterThanOrEqual( 1 );
	} );
} );
