import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

/*
 * The real fit pipeline runs in these tests; only the resize observer is
 * simulated, dispatching by mockObserved element so the header, the inline
 * fields, and the persistent-control wrapper can be resized independently.
 */
const mockObserved = new Map< Element, ( entries: unknown[] ) => void >();

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver: ( callback: ( entries: unknown[] ) => void ) => {
		return ( element: Element | null ) => {
			if ( element ) {
				mockObserved.set( element, callback );
			}
		};
	},
} ) );

/**
 * @param element Observed element.
 * @param width   Content width to report.
 * @param frame   Padding and border to report around that width.
 */
function notifyResize( element: Element, width: number, frame = 0 ) {
	act(
		() =>
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

function TestWidget( {
	attributes,
}: WidgetRenderProps< { metric?: string } > ) {
	return <p data-testid="metric">{ attributes?.metric ?? '' }</p>;
}

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
				elements: [
					{ value: 'views', label: 'Views' },
					{ value: 'orders', label: 'Orders' },
				],
				relevance: 'high',
			},
			{ id: 'label', label: 'Label', type: 'text' },
		],
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: TestWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

const initialLayout: DashboardWidget[] = [
	{
		uuid: 'w1',
		type: 'test/snapshot',
		attributes: { metric: 'views', label: 'Traffic' },
		placement: { width: 1, height: 1 },
	},
];

function Harness() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ setLayout }
			widgetTypes={ widgetTypes }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}

/*
 * Collapses the tile for real: the header offers little space, the inline
 * fields measure wider, and the persistent control reserves its footprint.
 */
async function renderCollapsed() {
	render( <Harness /> );
	await screen.findByTestId( 'metric' );

	// Class names come from the preset's style mock: `style-<kebab-case>`.
	// The observed elements are structural, with no accessible role; they
	// are looked up only to dispatch simulated resize notifications.
	/* eslint-disable testing-library/no-node-access */
	const header = document.querySelector( '.style-widget-header' ) as Element;
	const identity = document.querySelector( '.style-identity' ) as Element;
	const inline = document.querySelector(
		'.style-inline-controls'
	) as Element;
	const persistent = document.querySelector(
		'.style-persistent-controls'
	) as Element;
	/* eslint-enable testing-library/no-node-access */

	notifyResize( persistent, 32 );
	notifyResize( inline, 150 );
	notifyResize( identity, 120 );
	notifyResize( header, 200 );

	await screen.findByRole( 'button', { name: 'Widget controls' } );

	return { header };
}

describe( 'header fit budget', () => {
	beforeEach( () => {
		mockObserved.clear();
	} );

	it( "counts the toolbar chip's own padding and border", async () => {
		render( <Harness /> );
		await screen.findByTestId( 'metric' );

		/* eslint-disable testing-library/no-node-access */
		const header = document.querySelector(
			'.style-widget-header'
		) as Element;
		const identity = document.querySelector( '.style-identity' ) as Element;
		const chip = document.querySelector(
			'.style-widget-toolbar'
		) as Element;
		const inline = document.querySelector(
			'.style-inline-controls'
		) as Element;
		const persistent = document.querySelector(
			'.style-persistent-controls'
		) as Element;
		/* eslint-enable testing-library/no-node-access */

		// 300 less 120 of identity and 32 of settings leaves 148 for fields
		// that measure 140: they fit.
		notifyResize( chip, 200 );
		notifyResize( persistent, 32 );
		notifyResize( inline, 140 );
		notifyResize( identity, 120 );
		notifyResize( header, 300 );

		expect( await screen.findByRole( 'combobox' ) ).toBeInTheDocument();

		// The chip reports 16px of frame around the same content: the fields
		// no longer fit and collapse.
		notifyResize( chip, 200, 16 );

		expect(
			await screen.findByRole( 'button', { name: 'Widget controls' } )
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

		await user.click(
			screen.getByRole( 'button', { name: 'Widget controls' } )
		);
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
		const trigger = screen.getByRole( 'button', {
			name: 'Widget controls',
		} );
		expect( trigger ).toHaveFocus();

		// Focus moves on: the pending expansion applies to a connected
		// successor, and the inline fields return.
		await user.tab();
		await waitFor( () =>
			expect(
				screen.queryByRole( 'button', { name: 'Widget controls' } )
			).not.toBeInTheDocument()
		);
		expect( screen.getByRole( 'combobox' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		).toHaveFocus();
	} );

	it( 'keeps the trigger focused after the visible Close action as well', async () => {
		const user = userEvent.setup();
		const { header } = await renderCollapsed();

		await user.click(
			screen.getByRole( 'button', { name: 'Widget controls' } )
		);
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

		const trigger = screen.getByRole( 'button', {
			name: 'Widget controls',
		} );
		expect( trigger ).toHaveFocus();

		await user.tab();
		expect( await screen.findByRole( 'combobox' ) ).toBeInTheDocument();
	} );
} );
