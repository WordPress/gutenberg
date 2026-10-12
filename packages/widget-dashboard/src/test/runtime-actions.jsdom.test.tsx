import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useState } from '@wordpress/element';
import { useWidgetActions } from '@wordpress/widget-primitives';
import type {
	ResolveWidgetModule,
	WidgetName,
	WidgetRenderProps,
	WidgetRuntimeAction,
	WidgetType,
} from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../context/dashboard-context';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );
globalThis.wpVitest.mockResizeObserver();

type Attributes = {
	count?: number;
	period?: string;
	exportable?: boolean;
	refreshable?: boolean;
};

const onExport = vi.fn< () => void | Promise< void > >();
const onRefresh = vi.fn< () => void | Promise< void > >();

/*
 * Declares one action per attribute: `count` takes the declared Details
 * action's place, `period` sets a link target, `exportable` adds a promoted
 * callback and `refreshable` a menu callback.
 */
function TestWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< Attributes > ) {
	const count = attributes?.count ?? 0;
	const period = attributes?.period;
	const exportable = attributes?.exportable ?? false;
	const refreshable = attributes?.refreshable ?? false;

	const actions: WidgetRuntimeAction[] = [];
	if ( count > 0 ) {
		actions.push( {
			id: 'details',
			label: `Review ${ count } items`,
			relevance: 'high',
			href: `admin.php?page=dashboard&p=/details?count=${ count }`,
		} );
	}
	if ( period ) {
		actions.push( {
			id: 'report',
			label: 'View report',
			relevance: 'high',
			href: `admin.php?page=dashboard&p=/report?period=${ period }`,
		} );
	}
	if ( exportable ) {
		actions.push( {
			id: 'export',
			label: 'Export',
			relevance: 'medium',
			callback: onExport,
		} );
	}
	if ( refreshable ) {
		actions.push( {
			id: 'refresh',
			label: 'Refresh',
			callback: onRefresh,
		} );
	}

	const hosted = useWidgetActions( actions );

	return (
		<>
			<p data-testid="hosted">{ hosted ? 'hosted' : 'self' }</p>
			<button
				type="button"
				onClick={ () => setAttributes?.( { period: 'month' } ) }
			>
				Show month
			</button>
		</>
	);
}

const healthType: WidgetType = {
	apiVersion: 1,
	name: 'test/health',
	title: 'Health',
	renderModule: 'health-module',
	actions: [
		{
			id: 'details',
			label: 'Details',
			relevance: 'high',
			href: 'admin.php?page=dashboard&p=/details',
		},
	],
	example: { attributes: { count: 2 } },
};

const widgetTypes: WidgetType[] = [
	healthType,
	{
		apiVersion: 1,
		name: 'test/plain',
		title: 'Plain',
		renderModule: 'health-module',
	},
	{
		apiVersion: 1,
		name: 'test/bleed',
		title: 'Bleed',
		renderModule: 'health-module',
		presentation: 'full-bleed',
	},
	{
		apiVersion: 1,
		name: 'test/orders',
		title: 'Orders',
		renderModule: 'orders-module',
	},
];

/* Two components, each declaring its own actions. */
function ExportSection() {
	useWidgetActions( [
		{
			id: 'export',
			label: 'Export',
			relevance: 'medium',
			callback: onExport,
		},
	] );

	return <p>Export ready</p>;
}

function ComposedWidget() {
	const [ hasExport, setHasExport ] = useState( true );
	useWidgetActions( [
		{
			id: 'report',
			label: 'View report',
			relevance: 'high',
			href: 'admin.php?page=dashboard&p=/report',
		},
	] );

	return (
		<>
			{ hasExport && <ExportSection /> }
			<button type="button" onClick={ () => setHasExport( false ) }>
				Hide export
			</button>
		</>
	);
}

const resolveWidgetModule: ResolveWidgetModule = async ( moduleId ) => ( {
	default: ( moduleId === 'orders-module'
		? ComposedWidget
		: TestWidget ) as ComponentType< WidgetRenderProps< unknown > >,
} );

function instance(
	type: WidgetName = 'test/health',
	attributes: Attributes = {}
): DashboardWidget[] {
	return [
		{
			uuid: 'w1',
			type,
			attributes,
			placement: { width: 1, height: 1 },
		},
	];
}

/* Composed trigger patching the instance's attributes through staging. */
function Patch( { label, patch }: { label: string; patch: Attributes } ) {
	const { layout, onLayoutChange } = useDashboardInternalContext();

	return (
		<button
			type="button"
			onClick={ () =>
				onLayoutChange(
					layout.map( ( widget ) =>
						widget.uuid === 'w1'
							? {
									...widget,
									attributes: {
										...( widget.attributes as Attributes ),
										...patch,
									},
								}
							: widget
					)
				)
			}
		>
			{ label }
		</button>
	);
}

interface HarnessProps {
	layout?: DashboardWidget[];
	editMode?: boolean;
	children?: React.ReactNode;
}

function Harness( {
	layout: seed = instance(),
	editMode = false,
	children,
}: HarnessProps ) {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( seed );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ setLayout }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ () => {} }
			resolveWidgetModule={ resolveWidgetModule }
		>
			<WidgetDashboard.Actions />
			<WidgetDashboard.Widgets />
			{ children }
		</WidgetDashboard>
	);
}

describe( 'runtime actions', () => {
	beforeEach( () => {
		onExport.mockReset();
		onRefresh.mockReset();
	} );

	it( 'places the declared actions while the instance declares none', async () => {
		render( <Harness /> );

		expect(
			await screen.findByRole( 'link', { name: 'Details' } )
		).toBeInTheDocument();
		expect( await screen.findByTestId( 'hosted' ) ).toHaveTextContent(
			'hosted'
		);
	} );

	it( 'replaces a declared action with the runtime one carrying its id', async () => {
		render(
			<Harness layout={ instance( 'test/health', { count: 3 } ) } />
		);

		const link = await screen.findByRole( 'link', {
			name: 'Review 3 items',
		} );
		expect( link ).toHaveAttribute(
			'href',
			'admin.php?page=dashboard&p=/details?count=3'
		);
		expect(
			screen.queryByRole( 'link', { name: 'Details' } )
		).not.toBeInTheDocument();
	} );

	it( 'follows the declaration as the instance changes', async () => {
		const user = userEvent.setup();
		render(
			<Harness>
				<Patch label="Three" patch={ { count: 3 } } />
				<Patch label="None" patch={ { count: 0 } } />
			</Harness>
		);
		await screen.findByRole( 'link', { name: 'Details' } );

		await user.click( screen.getByRole( 'button', { name: 'Three' } ) );
		expect(
			await screen.findByRole( 'link', { name: 'Review 3 items' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Details' } )
		).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'None' } ) );
		expect(
			await screen.findByRole( 'link', { name: 'Details' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Review 3 items' } )
		).not.toBeInTheDocument();
	} );

	it( 'retargets a link when the attribute it derives from changes', async () => {
		const user = userEvent.setup();
		render(
			<Harness layout={ instance( 'test/plain', { period: 'week' } ) } />
		);

		expect(
			await screen.findByRole( 'link', { name: 'View report' } )
		).toHaveAttribute(
			'href',
			'admin.php?page=dashboard&p=/report?period=week'
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Show month' } )
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'link', { name: 'View report' } )
			).toHaveAttribute(
				'href',
				'admin.php?page=dashboard&p=/report?period=month'
			)
		);
	} );

	it( 'runs a callback action from the footer', async () => {
		const user = userEvent.setup();
		render(
			<Harness
				layout={ instance( 'test/health', { exportable: true } ) }
			/>
		);

		await user.click(
			await screen.findByRole( 'button', { name: 'Export' } )
		);

		expect( onExport ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the affordance pending until the callback settles', async () => {
		const user = userEvent.setup();
		let settle = () => {};
		onExport.mockImplementation(
			() =>
				new Promise< void >( ( resolve ) => {
					settle = resolve;
				} )
		);
		render(
			<Harness
				layout={ instance( 'test/health', { exportable: true } ) }
			/>
		);

		const button = await screen.findByRole( 'button', { name: 'Export' } );
		await user.click( button );
		await waitFor( () =>
			expect( button ).toHaveAttribute( 'aria-disabled', 'true' )
		);
		expect( button ).toHaveFocus();

		await user.click( button );
		expect( onExport ).toHaveBeenCalledTimes( 1 );

		settle();
		await waitFor( () =>
			expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' )
		);
	} );

	it( 'keeps a menu action pending after its menu closes', async () => {
		const user = userEvent.setup();
		let settle = () => {};
		onRefresh.mockImplementation(
			() =>
				new Promise< void >( ( resolve ) => {
					settle = resolve;
				} )
		);
		render(
			<Harness
				layout={ instance( 'test/plain', { refreshable: true } ) }
			/>
		);

		const more = await screen.findByRole( 'button', { name: 'More' } );
		await user.click( more );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Refresh' } )
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);

		await user.click( more );
		const item = await screen.findByRole( 'menuitem', { name: 'Refresh' } );
		expect( item ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( item );
		expect( onRefresh ).toHaveBeenCalledTimes( 1 );

		settle();
		await waitFor( () =>
			expect(
				screen.getByRole( 'menuitem', { name: 'Refresh' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' )
		);
	} );

	it( 'keeps a menu action pending across customize mode', async () => {
		const user = userEvent.setup();
		let settle = () => {};
		onRefresh.mockImplementation(
			() =>
				new Promise< void >( ( resolve ) => {
					settle = resolve;
				} )
		);
		const layout = instance( 'test/plain', { refreshable: true } );
		const { rerender } = render( <Harness layout={ layout } /> );

		await user.click(
			await screen.findByRole( 'button', { name: 'More' } )
		);
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Refresh' } )
		);

		rerender( <Harness layout={ layout } editMode /> );
		await waitFor( () =>
			expect(
				screen.queryByRole( 'button', { name: 'More' } )
			).not.toBeInTheDocument()
		);
		rerender( <Harness layout={ layout } /> );

		await user.click(
			await screen.findByRole( 'button', { name: 'More' } )
		);
		const item = await screen.findByRole( 'menuitem', { name: 'Refresh' } );
		expect( item ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( item );
		expect( onRefresh ).toHaveBeenCalledTimes( 1 );

		settle();
		await waitFor( () =>
			expect(
				screen.getByRole( 'menuitem', { name: 'Refresh' } )
			).not.toHaveAttribute( 'aria-disabled', 'true' )
		);
	} );

	it( 'shows the More trigger only while the menu holds an action', async () => {
		const user = userEvent.setup();
		render(
			<Harness layout={ instance( 'test/plain' ) }>
				<Patch label="Refreshable" patch={ { refreshable: true } } />
			</Harness>
		);
		await screen.findByTestId( 'hosted' );
		expect(
			screen.queryByRole( 'button', { name: 'More' } )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: 'Refreshable' } )
		);
		await user.click(
			await screen.findByRole( 'button', { name: 'More' } )
		);
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Refresh' } )
		);

		expect( onRefresh ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps every runtime action in the menu for a full-bleed widget', async () => {
		const user = userEvent.setup();
		render( <Harness layout={ instance( 'test/bleed', { count: 3 } ) } /> );
		await screen.findByTestId( 'hosted' );

		expect(
			screen.queryByRole( 'link', { name: 'Review 3 items' } )
		).not.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'More' } ) );
		expect(
			await screen.findByRole( 'menuitem', { name: 'Review 3 items' } )
		).toBeInTheDocument();
	} );

	it( 'places the actions two components of a widget declare', async () => {
		render( <Harness layout={ instance( 'test/orders' ) } /> );

		expect(
			await screen.findByRole( 'link', { name: 'View report' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Export' } )
		).toBeInTheDocument();
	} );

	it( 'withdraws only the actions of the component that unmounts', async () => {
		const user = userEvent.setup();
		render( <Harness layout={ instance( 'test/orders' ) } /> );
		await screen.findByRole( 'button', { name: 'Export' } );

		await user.click(
			screen.getByRole( 'button', { name: 'Hide export' } )
		);

		await waitFor( () =>
			expect(
				screen.queryByRole( 'button', { name: 'Export' } )
			).not.toBeInTheDocument()
		);
		expect(
			screen.getByRole( 'link', { name: 'View report' } )
		).toBeInTheDocument();
	} );

	it( 'keeps the runtime actions after the tile is dragged', async () => {
		const user = userEvent.setup();
		const { container } = render(
			<Harness
				layout={ instance( 'test/health', { count: 3 } ) }
				editMode
			/>
		);
		await screen.findByText( 'Review 3 items' );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const handle = container.querySelector< HTMLElement >(
			'[aria-roledescription="sortable"]'
		)!;
		handle.focus();

		// The drag preview mounts a second render of the instance.
		await user.keyboard( '[Space]' );
		await waitFor( () =>
			expect( screen.getAllByTestId( 'hosted' ) ).toHaveLength( 2 )
		);

		await user.keyboard( '[Space]' );
		await waitFor( () =>
			expect( screen.getAllByTestId( 'hosted' ) ).toHaveLength( 1 )
		);

		expect( screen.getByText( 'Review 3 items' ) ).toBeInTheDocument();
	} );

	it( 'places what the preview declares from the example attributes', async () => {
		const user = userEvent.setup();
		render( <Harness layout={ [] } editMode /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );

		expect(
			await within( dialog ).findByText( 'Review 2 items' )
		).toBeInTheDocument();
	} );
} );
