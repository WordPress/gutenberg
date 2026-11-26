import '@testing-library/jest-dom/vitest';
import { screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

const TITLE = 'Weekly Traffic Snapshot';

// No help note, so the infotip renders only while the title is clipped.
const widgetType: WidgetType = {
	apiVersion: 1,
	name: 'test/snapshot',
	title: TITLE,
	renderModule: 'snapshot-module',
	attributes: [
		{
			id: 'metric',
			label: 'Metric',
			type: 'text',
			elements: [
				{ value: 'views', label: 'Views' },
				{ value: 'visitors', label: 'Visitors' },
				{ value: 'orders', label: 'Orders' },
			],
			relevance: 'high',
			Edit: 'toggleGroup',
		},
	],
};

const layout: DashboardWidget[] = [
	{
		uuid: 'w1',
		type: widgetType.name,
		attributes: { metric: 'views' },
		placement: { width: 1, height: 1 },
	},
];

function TestWidget() {
	return <p data-testid="body">Body</p>;
}

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: TestWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

function Tile( { width }: { width: number } ) {
	return (
		<div style={ { width } }>
			<WidgetDashboard
				layout={ layout }
				onLayoutChange={ () => {} }
				widgetTypes={ [ widgetType ] }
				resolveWidgetModule={ resolveWidgetModule }
				gridSettings={ { model: 'grid', columns: 1, rowHeight: 200 } }
			>
				<WidgetDashboard.Widgets />
			</WidgetDashboard>
			<button type="button">After</button>
		</div>
	);
}

function nextFrame() {
	return new Promise( ( resolve ) =>
		requestAnimationFrame( () => requestAnimationFrame( resolve ) )
	);
}

function isInline() {
	return screen.queryByRole( 'radiogroup' ) !== null;
}

function infotip() {
	return screen.queryByRole( 'button', { name: 'More information' } );
}

function titleClip() {
	const heading = screen.getByRole( 'heading', { name: TITLE } );
	const range = document.createRange();
	range.selectNodeContents( heading );
	return (
		range.getBoundingClientRect().width -
		heading.getBoundingClientRect().width
	);
}

describe( 'WidgetHeader fit', () => {
	it( 'collapses the inline controls before the title clips, in both directions', async () => {
		const view = await render( <Tile width={ 600 } /> );
		await screen.findByTestId( 'body' );
		await waitFor( () => expect( isInline() ).toBe( true ) );

		const widths = [];
		for ( let width = 600; width >= 240; width -= 4 ) {
			widths.push( width );
		}
		const clippedInline = [];
		let collapsedAt;
		for ( const width of [ ...widths, ...widths.slice().reverse() ] ) {
			await view.rerender( <Tile width={ width } /> );
			await nextFrame();
			if ( isInline() && titleClip() > 0.05 ) {
				clippedInline.push( width );
			}
			collapsedAt ??= isInline() ? undefined : width;
		}
		expect( clippedInline ).toEqual( [] );
		expect( collapsedAt ).toBeDefined();
		expect( isInline() ).toBe( true );
	} );

	it( 'holds the inline controls while focus moves between them and the infotip', async () => {
		const user = userEvent.setup();
		const view = await render( <Tile width={ 600 } /> );
		await screen.findByTestId( 'body' );
		await waitFor( () => expect( isInline() ).toBe( true ) );

		const radio = screen.getByRole( 'radio', { name: 'Views' } );
		radio.focus();
		expect( radio ).toHaveFocus();

		// Focus holds the inline presentation, so the title clips instead.
		for ( let width = 600; width >= 240 && ! infotip(); width -= 10 ) {
			await view.rerender( <Tile width={ width } /> );
			await nextFrame();
		}
		const trigger = infotip() as HTMLElement;
		expect( trigger ).toBeInTheDocument();
		expect( isInline() ).toBe( true );

		// Focus moves to the infotip: the controls keep holding, so the title
		// stays clipped and the focused infotip stays mounted.
		await user.tab( { shift: true } );
		await nextFrame();
		expect( trigger ).toHaveFocus();
		expect( isInline() ).toBe( true );

		// Its popup holds too, and shows the clipped title.
		await user.keyboard( '{Enter}' );
		const dialog = await screen.findByRole( 'dialog' );
		await nextFrame();
		expect( dialog ).toHaveTextContent( TITLE );
		expect( isInline() ).toBe( true );
		await user.keyboard( '{Escape}' );
		await waitFor( () => expect( trigger ).toHaveFocus() );

		// Back to the controls: still held.
		await user.tab();
		await nextFrame();
		expect( screen.getByRole( 'radio', { name: 'Views' } ) ).toHaveFocus();
		expect( isInline() ).toBe( true );

		// Focus leaves the header: the pending collapse applies, and the
		// infotip leaves with the clip it explained.
		await user.tab();
		expect( screen.getByRole( 'button', { name: 'After' } ) ).toHaveFocus();
		await waitFor( () => expect( isInline() ).toBe( false ) );
		await waitFor( () => expect( infotip() ).not.toBeInTheDocument() );
	} );
} );
