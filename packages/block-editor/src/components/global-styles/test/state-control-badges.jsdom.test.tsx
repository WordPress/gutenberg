import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StateControlBadges from '../state-control-badges';

describe( 'StateControlBadges', () => {
	const viewportStates = [ { value: '@tablet', label: 'Tablet' } ];
	const pseudoStates = [ { value: ':hover', label: 'Hover' } ];

	it( 'explains a viewport badge with its infotip', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				viewportStates={ viewportStates }
				viewportValue="@tablet"
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Tablet' } ) );

		expect(
			await screen.findByText(
				'Style changes apply to the Tablet viewport.'
			)
		).toBeVisible();
	} );

	it( 'explains a pseudo state badge with its infotip', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				pseudoStates={ pseudoStates }
				pseudoStateValue=":hover"
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Hover' } ) );

		expect(
			await screen.findByText( 'Style changes apply to the Hover state.' )
		).toBeVisible();
	} );

	it( 'gives each badge its own infotip when multiple are active', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				viewportStates={ viewportStates }
				pseudoStates={ pseudoStates }
				viewportValue="@tablet"
				pseudoStateValue=":hover"
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Tablet' } ) );

		expect(
			await screen.findByText(
				'Style changes apply to the Tablet viewport.'
			)
		).toBeVisible();

		await user.keyboard( '{Escape}' );
		await user.click( screen.getByRole( 'button', { name: 'Hover' } ) );

		expect(
			await screen.findByText( 'Style changes apply to the Hover state.' )
		).toBeVisible();
	} );
} );
