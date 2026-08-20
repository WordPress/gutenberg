import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomDuotoneBar from '../custom-duotone-bar';

const VALUE = [ '#000000', '#ffffff' ];

describe( 'CustomDuotoneBar', () => {
	it( 'does not offer to reposition control points, since a duotone has no positions to save', () => {
		render( <CustomDuotoneBar value={ VALUE } onChange={ jest.fn() } /> );

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );

		expect( firstPoint ).toHaveAccessibleDescription(
			'Press the button to change the color.'
		);
		expect(
			screen.queryByText( /change the gradient position/ )
		).not.toBeInTheDocument();
	} );

	it( 'ignores arrow keys on a control point', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render( <CustomDuotoneBar value={ VALUE } onChange={ onChange } /> );

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );
		firstPoint.focus();
		await user.keyboard( '[ArrowRight][ArrowRight][ArrowLeft]' );

		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
