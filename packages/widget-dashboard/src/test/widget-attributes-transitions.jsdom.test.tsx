import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetName,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

/*
 * The real fit pipeline runs in these tests; only the resize observer is
 * simulated, dispatching by mockObserved element so the header, the inline
 * fields, the select, and the persistent-control wrapper can be resized
 * independently.
 */
const mockObserved = new Map< Element, ( entries: unknown[] ) => void >();

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useResizeObserver: ( ( callback: ( entries: unknown[] ) => void ) => {
		return ( element: Element | null ) => {
			if ( element ) {
				mockObserved.set( element, callback );
			}
		};
	} ) as typeof import( '@wordpress/compose' ).useResizeObserver,
} ) );

/**
 * @param element Observed element.
 * @param width   Content width to report.
 * @param frame   Padding and border to report around that width.
 */
function notifyResize( element: Element, width: number, frame = 0 ) {
	act( () =>
		mockObserved.get( element )?.( [
			{
				target: element,
				contentRect: { width },
				contentBoxSize: [ { inlineSize: width } ],
				borderBoxSize: [ { inlineSize: width + frame } ],
			},
		] )
	);
}

/**
 * Class names come from the preset's style mock: `style-<kebab-case>`.
 * The observed elements are structural, with no accessible role; they are
 * looked up only to dispatch simulated resize notifications.
 *
 * @param name CSS module class name.
 */
function part( name: string ) {
	return document.querySelector( `.style-${ name }` ) as Element;
}

function TestWidget( {
	attributes,
}: WidgetRenderProps< { metric?: string } > ) {
	return <p data-testid="metric">{ attributes?.metric ?? '' }</p>;
}

const METRICS = [
	{ value: 'views', label: 'Views' },
	{ value: 'visitors', label: 'Visitors' },
	{ value: 'orders', label: 'Orders' },
];

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/snapshot',
		title: 'Snapshot',
		renderModule: 'snapshot-module',
		attributes: [
			{
				id: 'metric',
				label: 'Metric',
				type: 'text',
				elements: METRICS,
				relevance: 'high',
				Edit: 'toggleGroup',
			},
			{ id: 'label', label: 'Label', type: 'text' },
		],
	},
	{
		apiVersion: 1,
		name: 'test/two-fields',
		title: 'Two fields',
		renderModule: 'snapshot-module',
		attributes: [
			{
				id: 'metric',
				label: 'Metric',
				type: 'text',
				elements: METRICS,
				relevance: 'high',
				Edit: 'toggleGroup',
			},
			{
				id: 'period',
				label: 'Period',
				type: 'text',
				elements: [
					{ value: 'week', label: 'Week' },
					{ value: 'month', label: 'Month' },
				],
				relevance: 'high',
			},
		],
	},
	{
		apiVersion: 1,
		name: 'test/async-options',
		title: 'Async options',
		renderModule: 'snapshot-module',
		attributes: [
			{
				id: 'metric',
				label: 'Metric',
				type: 'text',
				getElements: async () => METRICS,
				relevance: 'high',
				Edit: 'toggleGroup',
			},
		],
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: TestWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

function Harness( { type = 'test/snapshot' }: { type?: WidgetName } ) {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( [
		{
			uuid: 'w1',
			type,
			attributes: { metric: 'views', label: 'Traffic', period: 'week' },
			placement: { width: 1, height: 1 },
		},
	] );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ setLayout }
			widgetTypes={ widgetTypes }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}

const inlineToggle = () => screen.queryByRole( 'radio', { name: 'Views' } );
const select = () => screen.queryByRole( 'combobox', { name: 'Metric' } );
const trigger = () =>
	screen.queryByRole( 'button', { name: 'Widget controls' } );

/*
 * Lays the tile out with room for everything: 600 of header, less 120 of
 * identity and 32 of settings, leaves 448 for inline fields 150 wide.
 */
async function renderInline( type?: WidgetName ) {
	render( <Harness type={ type } /> );
	await screen.findByTestId( 'metric' );

	notifyResize( part( 'persistent-controls' ), 32 );
	notifyResize( part( 'inline-controls' ), 150 );
	notifyResize( part( 'identity' ), 120 );
	notifyResize( part( 'widget-header' ), 600 );

	return { header: part( 'widget-header' ) };
}

/*
 * Collapses the tile for real: 200 of header leaves 48 for the fields. The
 * single option field first tries the select; at 90 it does not fit either,
 * so the fit steps on to the dropdown.
 */
async function renderCollapsed() {
	const { header } = await renderInline();
	notifyResize( header, 200 );
	notifyResize( part( 'select-area' ), 90 );

	await screen.findByRole( 'button', { name: 'Widget controls' } );

	return { header };
}

describe( 'header fit budget', () => {
	beforeEach( () => {
		mockObserved.clear();
	} );

	it.each( [ 'integer', 'fractional' ] )(
		'reserves the full title width as the identity clips and expands (%s measurements)',
		async ( measurement ) => {
			render( <Harness /> );
			await screen.findByTestId( 'metric' );

			const header = part( 'widget-header' );
			const identity = part( 'identity' );
			const inline = part( 'inline-controls' );
			const title = screen.getByRole( 'heading', { name: 'Snapshot' } );
			const clientWidth = vi.spyOn( title, 'clientWidth', 'get' );
			clientWidth.mockReturnValue( 160 );
			vi.spyOn( title, 'scrollWidth', 'get' ).mockReturnValue( 160 );
			const titleRect = vi.spyOn( title, 'getBoundingClientRect' );
			titleRect.mockReturnValue( { width: 160.25 } as DOMRect );
			if ( measurement === 'fractional' ) {
				const range = document.createRange();
				range.getBoundingClientRect = () =>
					( { width: 160.25 } ) as DOMRect;
				vi.spyOn( document, 'createRange' ).mockReturnValue( range );
			}

			notifyResize( identity, 200 );
			notifyResize( inline, 226 );
			notifyResize( header, 442 );
			expect( inlineToggle() ).toBeInTheDocument();

			// The fractional clip is invisible to scrollWidth/clientWidth.
			clientWidth.mockReturnValue(
				measurement === 'fractional' ? 160 : 120
			);
			titleRect.mockReturnValue( { width: 159.75 } as DOMRect );
			notifyResize(
				identity,
				measurement === 'fractional' ? 199.5 : 160
			);
			notifyResize( header, measurement === 'fractional' ? 425.5 : 410 );
			expect( select() ).toBeInTheDocument();
			notifyResize( part( 'select-area' ), 90 );

			// Collapsing restores the identity's full width, but not its budget.
			clientWidth.mockReturnValue( 160 );
			titleRect.mockReturnValue( { width: 160.25 } as DOMRect );
			notifyResize( identity, 200 );
			notifyResize( header, 425 );
			expect( select() ).toBeInTheDocument();
			notifyResize( header, 442 );
			expect(
				await screen.findByRole( 'radio', { name: 'Views' } )
			).toBeInTheDocument();
		}
	);

	it( "counts the toolbar chip's own padding and border", async () => {
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		// 300 less 120 of identity and 32 of settings leaves 148 for fields
		// that measure 140: they fit.
		notifyResize( part( 'widget-toolbar' ), 200 );
		notifyResize( part( 'persistent-controls' ), 32 );
		notifyResize( part( 'inline-controls' ), 140 );
		notifyResize( part( 'identity' ), 120 );
		notifyResize( part( 'widget-header' ), 300 );

		expect( inlineToggle() ).toBeInTheDocument();

		// The chip reports 16px of frame around the same content: the fields
		// no longer fit and collapse.
		notifyResize( part( 'widget-toolbar' ), 200, 16 );

		expect( select() ).toBeInTheDocument();
	} );
} );

describe( 'single option field', () => {
	beforeEach( () => {
		mockObserved.clear();
	} );

	it( 'collapses to a select named after the field, and stages its edits', async () => {
		const user = userEvent.setup();
		const { header } = await renderInline();

		notifyResize( header, 200 );
		notifyResize( part( 'select-area' ), 40 );

		// The label is hidden but names the select; no dropdown trigger.
		const control = select()!;
		expect( control ).toBeInTheDocument();
		expect( inlineToggle() ).not.toBeInTheDocument();
		expect( trigger() ).not.toBeInTheDocument();
		expect(
			within( control )
				.getAllByRole( 'option' )
				.map( ( o ) => o.textContent )
		).toEqual( [ 'Views', 'Visitors', 'Orders' ] );

		await user.selectOptions( control, 'orders' );
		expect( screen.getByTestId( 'metric' ) ).toHaveTextContent( 'orders' );
		expect( control ).toHaveValue( 'orders' );
	} );

	it( 'expands back from the select once the fields fit with room to spare', async () => {
		const { header } = await renderInline();

		notifyResize( header, 200 );
		notifyResize( part( 'select-area' ), 40 );

		// 48 for the fields needs 150 + 16: a 318 header (166 left) expands.
		notifyResize( header, 317 );
		expect( select() ).toBeInTheDocument();
		notifyResize( header, 318 );
		expect(
			await screen.findByRole( 'radio', { name: 'Views' } )
		).toBeInTheDocument();
	} );

	it( 'moves focus to the select when focused inline controls collapse, and holds it there', async () => {
		const user = userEvent.setup();
		const { header } = await renderInline();

		await user.click( screen.getByRole( 'radio', { name: 'Visitors' } ) );
		expect( screen.getByTestId( 'metric' ) ).toHaveTextContent(
			'visitors'
		);

		notifyResize( header, 200 );
		const control = await screen.findByRole( 'combobox', {
			name: 'Metric',
		} );
		await waitFor( () => expect( control ).toHaveFocus() );
		expect( control ).toHaveValue( 'visitors' );
		notifyResize( part( 'select-area' ), 40 );

		// The focused select holds while space grows back.
		notifyResize( header, 600 );
		expect( control ).toBeInTheDocument();

		// Focus moves on: the pending expansion applies.
		await user.tab();
		expect(
			await screen.findByRole( 'radio', { name: 'Visitors' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		).toHaveFocus();
	} );

	it( 'steps a focused select down to the dropdown and moves focus to the trigger', async () => {
		const user = userEvent.setup();
		const { header } = await renderInline();

		notifyResize( header, 200 );
		notifyResize( part( 'select-area' ), 40 );
		await user.click( select()! );
		expect( select() ).toHaveFocus();

		// 120 of header leaves nothing: even the focused select collapses.
		notifyResize( header, 120 );
		const button = await screen.findByRole( 'button', {
			name: 'Widget controls',
		} );
		await waitFor( () => expect( button ).toHaveFocus() );
	} );

	it( 'collapses several fields straight to the dropdown', async () => {
		const { header } = await renderInline( 'test/two-fields' );

		notifyResize( header, 200 );
		expect( trigger() ).toBeInTheDocument();
		expect( select() ).not.toBeInTheDocument();
	} );

	it( 'hands focus to a select whose options come from getElements, and keeps it', async () => {
		const user = userEvent.setup();
		render( <Harness type="test/async-options" /> );
		await user.click(
			await screen.findByRole( 'radio', { name: 'Orders' } )
		);

		notifyResize( part( 'inline-controls' ), 150 );
		notifyResize( part( 'identity' ), 120 );
		notifyResize( part( 'widget-header' ), 600 );
		notifyResize( part( 'widget-header' ), 200 );

		// The select mounts with the loaded options, not a loading spinner
		// that would take the focus with it.
		const control = await screen.findByRole( 'combobox', {
			name: 'Metric',
		} );
		await waitFor( () => expect( control ).toHaveFocus() );
		expect( control ).toHaveValue( 'orders' );
		notifyResize( part( 'select-area' ), 40 );
		expect( control ).toHaveFocus();

		// Focus stayed, so the hold does too: growing keeps the select.
		notifyResize( part( 'widget-header' ), 600 );
		expect( control ).toBeInTheDocument();
		await user.tab();
		expect(
			await screen.findByRole( 'radio', { name: 'Orders' } )
		).toBeInTheDocument();
	} );
} );

describe( 'WidgetAttributes presentation transitions', () => {
	beforeEach( () => {
		mockObserved.clear();
	} );

	it( 'keeps the trigger focused after Escape, then expands once focus moves on', async () => {
		const user = userEvent.setup();
		const { header } = await renderCollapsed();

		await user.click( trigger()! );
		await screen.findByRole( 'dialog', { name: 'Widget controls' } );

		// Space grows while the popup is open: the fit holds.
		notifyResize( header, 600 );
		expect(
			screen.getByRole( 'dialog', { name: 'Widget controls' } )
		).toBeInTheDocument();

		await user.keyboard( '{Escape}' );
		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Widget controls' } )
			).not.toBeInTheDocument()
		);

		// Focus lands on the still-mounted trigger: the fit keeps holding.
		expect( trigger() ).toHaveFocus();

		// Focus moves on: the pending expansion applies to a connected
		// successor, and the inline fields return.
		await user.tab();
		await waitFor( () => expect( trigger() ).not.toBeInTheDocument() );
		expect( inlineToggle() ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		).toHaveFocus();
	} );

	it( 'collapses focused inline controls and moves focus to the trigger', async () => {
		const user = userEvent.setup();
		const { header } = await renderInline( 'test/two-fields' );

		await user.click( screen.getByRole( 'combobox', { name: 'Period' } ) );
		expect(
			screen.getByRole( 'combobox', { name: 'Period' } )
		).toHaveFocus();

		// Space shrinks while the inline controls have focus: they collapse
		// instead of clipping, and focus follows to the trigger.
		notifyResize( header, 200 );
		const button = await screen.findByRole( 'button', {
			name: 'Widget controls',
		} );
		await waitFor( () => expect( button ).toHaveFocus() );

		// The focused trigger holds the collapse while space grows back.
		notifyResize( header, 600 );
		expect( button ).toBeInTheDocument();

		await user.tab();
		expect(
			await screen.findByRole( 'radio', { name: 'Views' } )
		).toBeInTheDocument();
	} );

	it( 'keeps the trigger focused after the visible Close action as well', async () => {
		const user = userEvent.setup();
		const { header } = await renderCollapsed();

		await user.click( trigger()! );
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Widget controls',
		} );

		notifyResize( header, 600 );

		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Close' } )
		);
		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Widget controls' } )
			).not.toBeInTheDocument()
		);

		expect( trigger() ).toHaveFocus();

		await user.tab();
		expect(
			await screen.findByRole( 'radio', { name: 'Views' } )
		).toBeInTheDocument();
	} );
} );
