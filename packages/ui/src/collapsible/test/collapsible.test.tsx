import { createRef } from '@wordpress/element';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../button';
import { Collapsible } from '../index';

describe( 'Collapsible', () => {
	it( 'forwards ref to the trigger element', () => {
		const ref = createRef< HTMLButtonElement >();

		render(
			<Collapsible>
				<Collapsible.Trigger ref={ ref }>
					<Button>Toggle</Button>
				</Collapsible.Trigger>
				<Collapsible.Content>Content</Collapsible.Content>
			</Collapsible>
		);

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'toggles aria-expanded when the trigger is clicked', async () => {
		const user = userEvent.setup();

		render(
			<Collapsible>
				<Collapsible.Trigger>
					<Button>Toggle</Button>
				</Collapsible.Trigger>
				<Collapsible.Content>Content</Collapsible.Content>
			</Collapsible>
		);

		const trigger = screen.getByRole( 'button', { name: 'Toggle' } );
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );

		await user.click( trigger );
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	it( 'does not nest buttons when using a Button child', () => {
		render(
			<Collapsible>
				<Collapsible.Trigger>
					<Button>Toggle</Button>
				</Collapsible.Trigger>
				<Collapsible.Content>Content</Collapsible.Content>
			</Collapsible>
		);

		expect(
			screen.getByRole( 'button', { name: 'Toggle' } )
		).toBeVisible();
	} );
} );
