import { fireEvent, render, screen } from '@testing-library/react';
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

	it( 'ignores dragging a control point', () => {
		const onChange = jest.fn();

		render( <CustomDuotoneBar value={ VALUE } onChange={ onChange } /> );

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );

		fireEvent.mouseDown( firstPoint );
		fireEvent.mouseMove( window, { clientX: 50 } );
		fireEvent.mouseUp( window );

		expect( onChange ).not.toHaveBeenCalled();
	} );

	// The point cannot move, but the keys still have to be consumed. Letting
	// them bubble would move focus out of the control, which is what the
	// gradient bar's own `stopPropagation` guards against.
	it( 'does not let arrow keys bubble out of the control', async () => {
		const user = userEvent.setup();
		const onAncestorKeyDown = jest.fn();

		render(
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ onAncestorKeyDown }>
				<CustomDuotoneBar value={ VALUE } onChange={ jest.fn() } />
			</div>
		);

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );
		firstPoint.focus();
		await user.keyboard( '[ArrowLeft][ArrowRight]' );

		expect( onAncestorKeyDown ).not.toHaveBeenCalled();
	} );

	// Disabling positioning must not disable the one thing a duotone control
	// point can still do.
	it( 'still opens the color picker when a control point is clicked', async () => {
		const user = userEvent.setup();

		render( <CustomDuotoneBar value={ VALUE } onChange={ jest.fn() } /> );

		await user.click(
			screen.getAllByRole( 'button', {
				name: /Gradient control point/,
			} )[ 0 ]
		);

		expect(
			await screen.findByRole( 'slider', { name: 'Color' } )
		).toBeVisible();
	} );

	it( 'still lets other keys bubble', async () => {
		const user = userEvent.setup();
		const onAncestorKeyDown = jest.fn();

		render(
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ onAncestorKeyDown }>
				<CustomDuotoneBar value={ VALUE } onChange={ jest.fn() } />
			</div>
		);

		const [ firstPoint ] = screen.getAllByRole( 'button', {
			name: /Gradient control point/,
		} );
		firstPoint.focus();
		await user.keyboard( '[Escape]' );

		expect( onAncestorKeyDown ).toHaveBeenCalled();
	} );
} );
