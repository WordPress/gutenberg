import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import StateControl from '../state-control';

const viewportStates = [ { value: '@tablet', label: 'Tablet' } ];
const pseudoStates = [ { value: ':hover', label: 'Hover' } ];

describe( 'StateControl', () => {
	it( 'closes after selecting a state in a single group', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<StateControl
				pseudoStates={ pseudoStates }
				onChangePseudoState={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'States' } ) );
		const menu = await screen.findByRole( 'menu' );
		expect(
			within( menu ).getByRole( 'menuitemradio', { name: 'Default' } )
		).toBeChecked();
		await user.click(
			within( menu ).getByRole( 'menuitemradio', { name: 'Hover' } )
		);

		expect( onChange ).toHaveBeenCalledExactlyOnceWith( ':hover' );
		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);
	} );

	it( 'keeps the menu open when another state group is present', async () => {
		const user = userEvent.setup();
		const onChangeViewport = vi.fn();
		const onChangePseudoState = vi.fn();
		render(
			<StateControl
				viewportStates={ viewportStates }
				pseudoStates={ pseudoStates }
				onChangeViewport={ onChangeViewport }
				onChangePseudoState={ onChangePseudoState }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'States' } ) );
		const menu = await screen.findByRole( 'menu' );
		await user.click(
			within( menu ).getByRole( 'menuitemradio', { name: 'Tablet' } )
		);
		expect( onChangeViewport ).toHaveBeenCalledExactlyOnceWith( '@tablet' );
		expect( menu ).toBeVisible();
		await user.click(
			within( menu ).getByRole( 'menuitemradio', { name: 'Hover' } )
		);
		expect( onChangePseudoState ).toHaveBeenCalledExactlyOnceWith(
			':hover'
		);
		expect( menu ).toBeVisible();
	} );

	it( 'exposes the selected state and keeps the preview control available', async () => {
		const user = userEvent.setup();
		function WithPreview() {
			const [ state, setState ] = useState( 'default' );
			return (
				<StateControl
					pseudoStates={ pseudoStates }
					pseudoStateValue={ state }
					onChangePseudoState={ setState }
					showText={ false }
				>
					<Menu.Group>
						<Menu.CheckboxItem>
							<Menu.ItemLabel>Preview on canvas</Menu.ItemLabel>
						</Menu.CheckboxItem>
					</Menu.Group>
				</StateControl>
			);
		}
		render( <WithPreview /> );

		await user.click(
			screen.getByRole( 'button', { name: 'State: Default' } )
		);
		const menu = await screen.findByRole( 'menu' );
		await user.click(
			within( menu ).getByRole( 'menuitemradio', { name: 'Hover' } )
		);
		expect(
			within( menu ).getByRole( 'menuitemradio', { name: 'Hover' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'button', { name: 'State: Hover' } )
		).toBeInTheDocument();
		expect(
			within( menu ).getByRole( 'menuitemcheckbox', {
				name: 'Preview on canvas',
			} )
		).toBeVisible();
		expect( menu ).toBeVisible();
	} );
} );
