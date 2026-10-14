import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StateControl from '../state-control';

describe( 'StateControl', () => {
	const viewportStates = [ { value: '@tablet', label: 'Tablet' } ];
	const customStates = [ { value: '-current', label: 'Current' } ];
	const pseudoStates = [ { value: ':hover', label: 'Hover' } ];

	it( 'renders nothing when there are no states', () => {
		const { container } = render( <StateControl /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'lists the Item group between the Viewport and Pseudo state groups', async () => {
		const user = userEvent.setup();

		render(
			<StateControl
				viewportStates={ viewportStates }
				customStates={ customStates }
				pseudoStates={ pseudoStates }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'States' } ) );

		expect( screen.getAllByRole( 'group' ) ).toEqual(
			[ 'Viewport', 'Item', 'Pseudo state' ].map( ( name ) =>
				screen.getByRole( 'group', { name } )
			)
		);
	} );

	it( 'selects a custom state and keeps the menu open for the other groups', async () => {
		const user = userEvent.setup();
		const onChangeCustomState = vi.fn();

		render(
			<StateControl
				customStates={ customStates }
				pseudoStates={ pseudoStates }
				onChangeCustomState={ onChangeCustomState }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'States' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'Current' } ) );

		expect( onChangeCustomState ).toHaveBeenCalledWith( '-current' );
		expect(
			screen.getByRole( 'menuitem', { name: 'Hover' } )
		).toBeVisible();
	} );

	it( 'closes the menu after a selection when only one group is shown', async () => {
		const user = userEvent.setup();
		const onChangeCustomState = vi.fn();

		render(
			<StateControl
				customStates={ customStates }
				onChangeCustomState={ onChangeCustomState }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'States' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'Current' } ) );

		expect( onChangeCustomState ).toHaveBeenCalledWith( '-current' );
		expect(
			screen.queryByRole( 'menuitem', { name: 'Current' } )
		).not.toBeInTheDocument();
	} );

	it( 'names the selected custom and pseudo states on the icon toggle', () => {
		render(
			<StateControl
				customStates={ customStates }
				pseudoStates={ pseudoStates }
				customStateValue="-current"
				pseudoStateValue=":hover"
				showText={ false }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'State: Current, Hover' } )
		).toBeVisible();
	} );
} );
