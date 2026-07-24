/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import StateControlBadges from '../state-control-badges';

jest.mock( '@wordpress/ui', () => {
	const actual = jest.requireActual( '@wordpress/ui' );

	return {
		...actual,
		Tooltip: {
			Root: ( { children } ) => <>{ children }</>,
			Trigger: ( { render: trigger } ) => trigger,
			Popup: ( { children } ) => <span role="tooltip">{ children }</span>,
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

		const badge = screen.getByText( 'Tablet' );
		expect( badge ).toBeVisible();
		// The explanation is also embedded in the badge, visually hidden, so
		// screen reader users perceive it without relying on the tooltip.
		expect( badge ).toHaveTextContent(
			'Style changes apply to the Tablet viewport.'
		);
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

		const badge = screen.getByText( 'Hover' );
		expect( badge ).toBeVisible();
		expect( badge ).toHaveTextContent(
			'Style changes apply to the Hover state.'
		);
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'Style changes apply to the Hover state.'
		);
	} );
} );
