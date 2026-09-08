import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StateControlBadges from '../state-control-badges';

vi.mock( import( '@wordpress/ui' ), async ( importOriginal ) => {
	const actual = await importOriginal();

	return {
		...actual,
		Tooltip: {
			Root: ( { children } ) => <>{ children }</>,
			Trigger: ( { render: trigger } ) => trigger,
			Popup: ( { children } ) => (
				<span role="tooltip">{ children }</span>
			),
		},
	};
} );

describe( 'StateControlBadges', () => {
	const viewportStates = [ { value: '@tablet', label: 'Tablet' } ];
	const pseudoStates = [ { value: ':hover', label: 'Hover' } ];

	it( 'explains viewport badges with a tooltip', () => {
		render(
			<StateControlBadges
				viewportStates={ viewportStates }
				viewportValue="@tablet"
			/>
		);

		expect( screen.getByText( 'Tablet' ) ).toBeVisible();

		// The explanation is rendered next to the badge, visually hidden, so
		// screen reader users perceive it without relying on the tooltip.
		expect(
			screen.getAllByText(
				'Style changes apply to the Tablet viewport.'
			)
		).toHaveLength( 2 );

		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'Style changes apply to the Tablet viewport.'
		);
	} );

	it( 'explains pseudo state badges with a tooltip', () => {
		render(
			<StateControlBadges
				pseudoStates={ pseudoStates }
				pseudoStateValue=":hover"
			/>
		);

		expect( screen.getByText( 'Hover' ) ).toBeVisible();

		expect(
			screen.getAllByText( 'Style changes apply to the Hover state.' )
		).toHaveLength( 2 );

		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'Style changes apply to the Hover state.'
		);
	} );
} );
