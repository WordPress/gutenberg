import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WidgetAction } from '@wordpress/widget-primitives';
import { ActionsMenu } from '../components/actions-menu/actions-menu';
import { WidgetActions } from '../components/widget-actions/widget-actions';
import { WidgetLayoutControls } from '../components/widget-layout-controls/widget-layout-controls';
import { useDashboardInternalContext } from '../context/dashboard-context';
import type { DashboardWidget } from '../types';
import { WidgetDashboard } from '../widget-dashboard';

function LayoutWidth() {
	const { layout } = useDashboardInternalContext();
	return <output>{ layout[ 0 ].placement?.width }</output>;
}

describe( 'Widget Dashboard menus', () => {
	it( 'opens the dashboard actions menu from the keyboard and runs the selected action', async () => {
		const user = userEvent.setup();
		const onClick = jest.fn();
		render( <ActionsMenu items={ [ { label: 'Reset', onClick } ] } /> );

		const trigger = screen.getByRole( 'button', { name: 'More options' } );
		await user.tab();
		expect( trigger ).toHaveFocus();
		await user.keyboard( '{ArrowDown}' );

		const item = await screen.findByRole( 'menuitem', { name: 'Reset' } );
		expect( item ).toHaveFocus();

		await user.keyboard( '{Enter}' );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);
		expect( trigger ).toHaveFocus();
	} );

	it( 'keeps a disabled dashboard action available to explain why it cannot run', async () => {
		const user = userEvent.setup();
		const onClick = jest.fn();
		render(
			<ActionsMenu
				items={ [
					{
						label: 'Reset',
						onClick,
						disabled: true,
						disabledTooltip: 'Nothing to reset.',
					},
				] }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'More options' } )
		);
		const item = await screen.findByRole( 'menuitem', { name: 'Reset' } );
		expect( item ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.hover( item );
		expect( await screen.findByText( 'Nothing to reset.' ) ).toBeVisible();
		expect( onClick ).not.toHaveBeenCalled();
	} );

	it( 'renders widget actions as real anchor menu items', async () => {
		const user = userEvent.setup();
		const actions: WidgetAction[] = [
			{
				id: 'download-report',
				label: 'Download report',
				href: '/report.csv',
				download: 'report.csv',
				openInNewTab: true,
			},
		];
		render( <WidgetActions actions={ actions } /> );

		await user.click( screen.getByRole( 'button', { name: 'More' } ) );
		const action = await screen.findByRole( 'menuitem', {
			name: /Download report/,
		} );

		expect( action.tagName ).toBe( 'A' );
		expect( action ).toHaveAttribute( 'href', '/report.csv' );
		expect( action ).toHaveAttribute( 'download', 'report.csv' );
		expect( action ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'closes the widget action menu when a link is activated', async () => {
		const user = userEvent.setup();
		render(
			<WidgetActions
				actions={ [
					{
						id: 'view-report',
						label: 'View report',
						href: '#report',
					},
				] }
			/>
		);

		const trigger = screen.getByRole( 'button', { name: 'More' } );
		await user.click( trigger );
		const action = await screen.findByRole( 'menuitem', {
			name: 'View report',
		} );
		action.addEventListener( 'click', ( event ) => event.preventDefault() );

		await user.click( action );

		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);
		expect( trigger ).toHaveFocus();
	} );

	it( 'updates a widget width from its options menu and returns focus', async () => {
		const user = userEvent.setup();
		const widget: DashboardWidget = {
			uuid: 'a',
			type: 'core/test',
			placement: { width: 1, height: 1 },
		};
		render(
			<WidgetDashboard
				layout={ [ widget ] }
				onLayoutChange={ () => {} }
				widgetTypes={ [] }
				editMode
			>
				<WidgetLayoutControls widget={ widget } />
				<LayoutWidth />
			</WidgetDashboard>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'Widget options',
		} );
		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'menuitem', {
				name: 'Make full width',
			} )
		);

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'full' );
		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);
		expect( trigger ).toHaveFocus();
	} );
} );
