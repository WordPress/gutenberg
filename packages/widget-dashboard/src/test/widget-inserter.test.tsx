import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { CanPerformDashboardOperation, DashboardWidget } from '../types';

function PreviewWidget( {
	attributes,
}: WidgetRenderProps< { label?: string } > ) {
	return <div data-testid="widget-content">{ attributes?.label ?? '—' }</div>;
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'wordpress/welcome',
		title: 'Welcome',
		renderModule: 'welcome-module',
		example: { attributes: { label: 'welcome-example' } },
	},
	{
		apiVersion: 1,
		name: 'wordpress/notes',
		title: 'Notes',
		renderModule: 'notes-module',
		example: { attributes: { label: 'notes-example' } },
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: PreviewWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

interface HarnessProps {
	initialLayout?: DashboardWidget[];
	onLayoutChange?: ( layout: DashboardWidget[] ) => void;
	canPerform?: CanPerformDashboardOperation;
}

function Harness( {
	initialLayout = [],
	onLayoutChange: onChange,
	canPerform,
}: HarnessProps ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );
	const [ editMode, setEditMode ] = useState( true );

	const dashboard = (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ ( next ) => {
				setLayout( next );
				onChange?.( next );
			} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);

	return canPerform ? (
		<WidgetDashboard.Policy canPerform={ canPerform }>
			{ dashboard }
		</WidgetDashboard.Policy>
	) : (
		dashboard
	);
}

describe( 'WidgetDashboard.WidgetInserter', () => {
	it( 'is hidden until the "Add widget" trigger is clicked', () => {
		render( <Harness /> );
		expect(
			screen.queryByRole( 'dialog', { name: 'Add widget' } )
		).not.toBeInTheDocument();
	} );

	it( 'opens after clicking the "Add widget" trigger', async () => {
		const user = userEvent.setup();
		render( <Harness /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		expect(
			await screen.findByRole( 'dialog', { name: 'Add widget' } )
		).toBeInTheDocument();
	} );

	it( 'inserts the selected widget type into the layout on Done', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		render( <Harness onLayoutChange={ onLayoutChange } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		const options = within( dialog ).getAllByRole( 'option' );
		expect( options ).toHaveLength( widgetTypes.length );

		await user.click( options[ 0 ] );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);

		// Inserts stay in staging until Done.
		expect( onLayoutChange ).not.toHaveBeenCalled();

		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Add widget' } )
			).not.toBeInTheDocument()
		);

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated ).toHaveLength( 1 );
		expect( updated[ 0 ] ).toMatchObject( {
			type: 'wordpress/welcome',
			attributes: { label: 'welcome-example' },
		} );
		expect( updated[ 0 ].uuid ).toEqual( expect.any( String ) );
	} );

	it( 'inserts multiple widgets via multi-select in a single layout change', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		render( <Harness onLayoutChange={ onLayoutChange } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		const options = within( dialog ).getAllByRole( 'option' );

		await user.click( options[ 0 ] );
		await user.click( options[ 1 ] );

		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated ).toHaveLength( 2 );
		expect( updated.map( ( w: DashboardWidget ) => w.type ) ).toEqual( [
			'wordpress/welcome',
			'wordpress/notes',
		] );
	} );

	it( 'preserves existing widgets when appending new ones', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		const existing: DashboardWidget = {
			uuid: 'existing-1',
			type: 'wordpress/welcome',
			attributes: { label: 'kept' },
			placement: { width: 1, height: 1 },
		};

		render(
			<Harness
				initialLayout={ [ existing ] }
				onLayoutChange={ onLayoutChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		await user.click( within( dialog ).getAllByRole( 'option' )[ 1 ] );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated ).toHaveLength( 2 );
		expect( updated[ 0 ] ).toEqual( existing );
		expect( updated[ 1 ] ).toMatchObject( { type: 'wordpress/notes' } );
	} );

	describe( 'policy', () => {
		const insertOnly =
			( allowed: string ): CanPerformDashboardOperation =>
			( request ) =>
				request.operation !== 'insert' ||
				request.widgetType.name === allowed;

		const notesOnly = insertOnly( 'wordpress/notes' );
		const welcomeOnly = insertOnly( 'wordpress/welcome' );

		it( 'offers only the types the policy allows to insert', async () => {
			const user = userEvent.setup();
			render( <Harness canPerform={ notesOnly } /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Add widget' } )
			);

			const dialog = await screen.findByRole( 'dialog', {
				name: 'Add widget',
			} );
			expect( within( dialog ).getAllByRole( 'option' ) ).toHaveLength(
				1
			);
			// The title renders in the card and in the preview chrome.
			expect(
				within( dialog ).queryAllByText( 'Notes' ).length
			).toBeGreaterThan( 0 );
			expect(
				within( dialog ).queryByText( 'Welcome' )
			).not.toBeInTheDocument();
		} );

		it( 'asks with the insert operation and the widget type', async () => {
			const user = userEvent.setup();
			const canPerform = jest.fn< boolean, [ unknown ] >( () => true );
			render( <Harness canPerform={ canPerform } /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Add widget' } )
			);
			await screen.findByRole( 'dialog', { name: 'Add widget' } );

			expect( canPerform ).toHaveBeenCalledWith( {
				operation: 'insert',
				widgetType: widgetTypes[ 0 ],
			} );
			expect( canPerform ).toHaveBeenCalledWith( {
				operation: 'insert',
				widgetType: widgetTypes[ 1 ],
			} );
		} );

		it( 'updates the open picker when the policy changes', async () => {
			const user = userEvent.setup();
			const { rerender } = render(
				<Harness canPerform={ welcomeOnly } />
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Add widget' } )
			);
			const dialog = await screen.findByRole( 'dialog', {
				name: 'Add widget',
			} );
			expect(
				within( dialog ).queryAllByText( 'Welcome' ).length
			).toBeGreaterThan( 0 );

			rerender( <Harness canPerform={ notesOnly } /> );

			await waitFor( () =>
				expect(
					within( dialog ).queryByText( 'Welcome' )
				).not.toBeInTheDocument()
			);
			expect(
				within( dialog ).queryAllByText( 'Notes' ).length
			).toBeGreaterThan( 0 );
		} );

		it( 'governs each dashboard through its own provider', async () => {
			const user = userEvent.setup();
			render(
				<>
					<Harness canPerform={ notesOnly } />
					<Harness canPerform={ welcomeOnly } />
				</>
			);

			const triggers = screen.getAllByRole( 'button', {
				name: 'Add widget',
			} );
			expect( triggers ).toHaveLength( 2 );

			await user.click( triggers[ 0 ] );
			let dialog = await screen.findByRole( 'dialog', {
				name: 'Add widget',
			} );
			expect(
				within( dialog ).queryAllByText( 'Notes' ).length
			).toBeGreaterThan( 0 );
			expect(
				within( dialog ).queryByText( 'Welcome' )
			).not.toBeInTheDocument();

			await user.keyboard( '{Escape}' );
			await waitFor( () =>
				expect(
					screen.queryByRole( 'dialog', { name: 'Add widget' } )
				).not.toBeInTheDocument()
			);

			await user.click( triggers[ 1 ] );
			dialog = await screen.findByRole( 'dialog', {
				name: 'Add widget',
			} );
			expect(
				within( dialog ).queryAllByText( 'Welcome' ).length
			).toBeGreaterThan( 0 );
			expect(
				within( dialog ).queryByText( 'Notes' )
			).not.toBeInTheDocument();
		} );

		it( 'leaves placed widgets of excluded types rendering', async () => {
			const user = userEvent.setup();
			const existing: DashboardWidget = {
				uuid: 'existing-1',
				type: 'wordpress/welcome',
				attributes: { label: 'kept' },
				placement: { width: 1, height: 1 },
			};

			render(
				<Harness
					canPerform={ notesOnly }
					initialLayout={ [ existing ] }
				/>
			);

			expect( await screen.findByText( 'kept' ) ).toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'Add widget' } )
			);
			const dialog = await screen.findByRole( 'dialog', {
				name: 'Add widget',
			} );
			expect( within( dialog ).getAllByRole( 'option' ) ).toHaveLength(
				1
			);
			expect(
				within( dialog ).queryByText( 'Welcome' )
			).not.toBeInTheDocument();
		} );

		it( 'composes nested policies restrictively', () => {
			render(
				<WidgetDashboard.Policy canPerform={ welcomeOnly }>
					<Harness canPerform={ notesOnly } />
				</WidgetDashboard.Policy>
			);

			// The outer policy allows Welcome, the inner one Notes: neither
			// survives both, so there is nothing to insert.
			expect(
				screen.queryByRole( 'button', { name: 'Add widget' } )
			).not.toBeInTheDocument();
		} );

		it( 'lets an enclosing policy narrow an inner permissive one', async () => {
			const user = userEvent.setup();
			render(
				<WidgetDashboard.Policy canPerform={ notesOnly }>
					<Harness canPerform={ () => true } />
				</WidgetDashboard.Policy>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Add widget' } )
			);

			const dialog = await screen.findByRole( 'dialog', {
				name: 'Add widget',
			} );
			expect( within( dialog ).getAllByRole( 'option' ) ).toHaveLength(
				1
			);
			expect(
				within( dialog ).queryByText( 'Welcome' )
			).not.toBeInTheDocument();
		} );

		it( 'hides the Add widget trigger when the policy denies every insert', () => {
			render(
				<Harness
					canPerform={ ( request ) => request.operation !== 'insert' }
				/>
			);

			expect(
				screen.queryByRole( 'button', { name: 'Add widget' } )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Done' } )
			).toBeInTheDocument();
		} );
	} );
} );
