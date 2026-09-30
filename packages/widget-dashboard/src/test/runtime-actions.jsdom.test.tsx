import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useMemo, useState } from '@wordpress/element';
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
const onRefresh = vi.fn< () => void >();

/*
 * Declares from its attributes: while `count` is positive, a link taking the
 * declared Details action's place; while `period` is set, a link whose target
 * carries it; while `exportable`, a promoted callback; while `refreshable`, a
 * callback for the menu.
 */
function TestWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< Attributes > ) {
	const count = attributes?.count ?? 0;
	const period = attributes?.period;
	const exportable = attributes?.exportable ?? false;
	const refreshable = attributes?.refreshable ?? false;

	const actions = useMemo< WidgetRuntimeAction[] >( () => {
		const list: WidgetRuntimeAction[] = [];
		if ( count > 0 ) {
			list.push( {
				id: 'details',
				label: `Review ${ count } items`,
				relevance: 'high',
				href: `admin.php?page=dashboard&p=/details?count=${ count }`,
			} );
		}
		if ( period ) {
			list.push( {
				id: 'report',
				label: 'View report',
				relevance: 'high',
				href: `admin.php?page=dashboard&p=/report?period=${ period }`,
			} );
		}
		if ( exportable ) {
			list.push( {
				id: 'export',
				label: 'Export',
				relevance: 'medium',
				callback: onExport,
			} );
		}
		if ( refreshable ) {
			list.push( {
				id: 'refresh',
				label: 'Refresh',
				callback: onRefresh,
			} );
		}
		return list;
	}, [ count, period, exportable, refreshable ] );

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
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: TestWidget as ComponentType< WidgetRenderProps< unknown > >,
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

		settle();
		await waitFor( () =>
			expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' )
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
