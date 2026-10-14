import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StateControlBadges from '../state-control-badges';

describe( 'StateControlBadges', () => {
	const viewportStates = [ { value: '@tablet', label: 'Tablet' } ];
	const customStates = [ { value: '-current', label: 'Current' } ];
	const pseudoStates = [ { value: ':hover', label: 'Hover' } ];

	it( 'explains viewport badges with a shared infotip', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				viewportStates={ viewportStates }
				viewportValue="@tablet"
			/>
		);

		expect( screen.getByText( 'Tablet' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'More information about Tablet',
			} )
		);

		expect(
			await screen.findByText(
				'Style changes apply to the Tablet viewport.'
			)
		).toBeVisible();
	} );

	it( 'explains pseudo state badges with a shared infotip', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				pseudoStates={ pseudoStates }
				pseudoStateValue=":hover"
			/>
		);

		expect( screen.getByText( 'Hover' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'More information about Hover',
			} )
		);

		expect(
			await screen.findByText( 'Style changes apply to the Hover state.' )
		).toBeVisible();
	} );

	it( 'uses one summary infotip when multiple badges are active', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				viewportStates={ viewportStates }
				pseudoStates={ pseudoStates }
				viewportValue="@tablet"
				pseudoStateValue=":hover"
			/>
		);

		expect( screen.getByText( 'Tablet' ) ).toBeVisible();
		expect( screen.getByText( 'Hover' ) ).toBeVisible();
		expect(
			screen.getAllByRole( 'button', {
				name: /More information/,
			} )
		).toHaveLength( 1 );

		await user.click(
			screen.getByRole( 'button', {
				name: 'More information about style states',
			} )
		);

		expect(
			await screen.findByText(
				'Style changes apply to the Tablet viewport and the Hover state.'
			)
		).toBeVisible();
	} );

	it( 'explains a custom state badge with a shared infotip', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				customStates={ customStates }
				customStateValue="-current"
			/>
		);

		expect( screen.getByText( 'Current' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'More information about Current',
			} )
		);

		expect(
			await screen.findByText(
				'Style changes apply to the Current state.'
			)
		).toBeVisible();
	} );

	it( 'lists the custom state before the pseudo state', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				customStates={ customStates }
				pseudoStates={ pseudoStates }
				customStateValue="-current"
				pseudoStateValue=":hover"
			/>
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'More information about style states',
			} )
		);

		expect(
			await screen.findByText(
				'Style changes apply to the Current and Hover states.'
			)
		).toBeVisible();
	} );

	it( 'summarizes a viewport with custom and pseudo states', async () => {
		const user = userEvent.setup();

		render(
			<StateControlBadges
				viewportStates={ viewportStates }
				customStates={ customStates }
				pseudoStates={ pseudoStates }
				viewportValue="@tablet"
				customStateValue="-current"
				pseudoStateValue=":hover"
			/>
		);

		expect( screen.getByText( 'Tablet' ) ).toBeVisible();
		expect( screen.getByText( 'Current' ) ).toBeVisible();
		expect( screen.getByText( 'Hover' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'More information about style states',
			} )
		);

		expect(
			await screen.findByText(
				'Style changes apply to the Tablet viewport and the Current and Hover states.'
			)
		).toBeVisible();
	} );
} );
