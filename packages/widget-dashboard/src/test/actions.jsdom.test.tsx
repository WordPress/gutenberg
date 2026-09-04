import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import type { WidgetType } from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { CanPerformDashboardOperation, DashboardWidget } from '../types';

const widgetTypes: WidgetType[] = [];

// Use a non-empty layout so the provider's auto-edit-when-empty effect
// does not flip editMode on as a side effect of mounting.
const layout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
];

interface HarnessProps {
	initialEditMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	onLayoutChange?: ( next: DashboardWidget[] ) => void;
	canPerform?: CanPerformDashboardOperation;
	layout?: DashboardWidget[];
	onLayoutReset?: () => Promise< void >;
}

function Harness( {
	initialEditMode = false,
	onEditChange,
	onLayoutChange = () => {},
	canPerform,
	layout: initialLayout = layout,
	onLayoutReset,
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	const dashboard = (
		<WidgetDashboard
			layout={ initialLayout }
			onLayoutChange={ onLayoutChange }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ ( next ) => {
				setEditMode( next );
				onEditChange?.( next );
			} }
			onLayoutReset={ onLayoutReset }
		>
			<WidgetDashboard.Actions />
		</WidgetDashboard>
	);

	return canPerform ? (
		<WidgetDashboard.Policy canPerform={ canPerform }>
			{ dashboard }
		</WidgetDashboard.Policy>
	) : (
		dashboard
	);
}

const denyCustomize: CanPerformDashboardOperation = ( request ) =>
	request.operation !== 'customize';

const denyReset: CanPerformDashboardOperation = ( request ) =>
	request.operation !== 'reset';

describe( 'WidgetDashboard.Actions', () => {
	let user: ReturnType< typeof userEvent.setup >;

	beforeEach( () => {
		user = userEvent.setup();
	} );

	it( 'renders the Customize button when editMode is false', () => {
		render( <Harness /> );

		expect(
			screen.getByRole( 'button', { name: 'Customize' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Done' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the Done button when editMode is true', () => {
		render( <Harness initialEditMode /> );

		expect(
			screen.getByRole( 'button', { name: 'Done' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Customize' } )
		).not.toBeInTheDocument();
	} );

	it( 'fires onEditChange with true when Customize is clicked', async () => {
		const onEditChange = jest.fn();
		render( <Harness onEditChange={ onEditChange } /> );

		await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect( onEditChange ).toHaveBeenLastCalledWith( true );
	} );

	it( 'disables Done when there are no staging changes', () => {
		render( <Harness initialEditMode /> );

		expect(
			screen.getByRole( 'button', { name: 'Done' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'fires onEditChange with false when Cancel is clicked', async () => {
		const onEditChange = jest.fn();
		const onLayoutChange = jest.fn();
		render(
			<Harness
				initialEditMode
				onEditChange={ onEditChange }
				onLayoutChange={ onLayoutChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onEditChange ).toHaveBeenLastCalledWith( false );
		expect( onLayoutChange ).not.toHaveBeenCalled();
	} );

	it( 'renders nothing when onEditChange is not provided', () => {
		render(
			<WidgetDashboard
				layout={ layout }
				onLayoutChange={ () => {} }
				widgetTypes={ widgetTypes }
			>
				<WidgetDashboard.Actions />
			</WidgetDashboard>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Customize' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Done' } )
		).not.toBeInTheDocument();
	} );

	it( 'does not render a Layout settings button', () => {
		render( <Harness initialEditMode /> );

		expect(
			screen.queryByRole( 'button', { name: 'Layout settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'hides Customize when the policy denies it', () => {
		render( <Harness canPerform={ denyCustomize } /> );

		expect(
			screen.queryByRole( 'button', { name: 'Customize' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'More options' } )
		).toBeInTheDocument();
	} );

	it( 'keeps Done and Cancel while in edit mode when customize is denied', () => {
		render( <Harness initialEditMode canPerform={ denyCustomize } /> );

		expect(
			screen.getByRole( 'button', { name: 'Done' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Cancel' } )
		).toBeInTheDocument();
	} );

	it( 'enters edit mode on an empty layout only when customize is allowed', () => {
		const onEditChange = jest.fn();
		const { unmount } = render(
			<Harness layout={ [] } onEditChange={ onEditChange } />
		);
		expect( onEditChange ).toHaveBeenCalledWith( true );
		unmount();

		onEditChange.mockClear();
		render(
			<Harness
				layout={ [] }
				onEditChange={ onEditChange }
				canPerform={ denyCustomize }
			/>
		);
		expect( onEditChange ).not.toHaveBeenCalled();
	} );

	it( 'offers Reset to default when the policy allows it', async () => {
		render( <Harness onLayoutReset={ async () => {} } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'More options' } )
		);

		expect(
			await screen.findByRole( 'menuitem', { name: 'Reset to default' } )
		).toBeInTheDocument();
	} );

	it( 'hides Reset to default and its menu when the policy denies reset', () => {
		render(
			<Harness
				onLayoutReset={ async () => {} }
				canPerform={ denyReset }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Customize' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'More options' } )
		).not.toBeInTheDocument();
	} );

	it( 'throws when used outside a WidgetDashboard subtree', () => {
		const spy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		expect( () => render( <WidgetDashboard.Actions /> ) ).toThrow(
			/Dashboard compound used outside a WidgetDashboard subtree/
		);

		spy.mockRestore();
	} );
} );
