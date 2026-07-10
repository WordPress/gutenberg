/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
			'Style changes apply only to the Tablet viewport.'
		);
	} );

	it( 'allows a viewport badge to be cleared', async () => {
		const user = userEvent.setup();
		const onClearViewport = jest.fn();

		render(
			<StateControlBadges
				viewportStates={ viewportStates }
				viewportValue="@tablet"
				onClearViewport={ onClearViewport }
			/>
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Stop editing Tablet viewport',
			} )
		);

		expect( onClearViewport ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not add viewport clearing controls to pseudo state badges', () => {
		render(
			<StateControlBadges
				pseudoStates={ pseudoStates }
				pseudoStateValue=":hover"
				onClearViewport={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Hover' ) ).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Stop editing Hover viewport',
			} )
		).not.toBeInTheDocument();
	} );
} );
