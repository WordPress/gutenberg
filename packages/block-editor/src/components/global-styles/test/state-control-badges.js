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

		expect( screen.getByText( 'Tablet' ) ).toBeVisible();
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
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'Style changes apply to the Hover state.'
		);
	} );
} );
