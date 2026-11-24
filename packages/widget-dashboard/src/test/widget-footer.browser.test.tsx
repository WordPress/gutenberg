import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import type { ReactNode } from 'react';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';
import { Card } from '@wordpress/ui';
import '@wordpress/theme/design-tokens.css';
import { WidgetFooter } from '../components/widget-footer/widget-footer';
import { WidgetDashboard } from '../widget-dashboard';

const TEXT_LINKS: WidgetRuntimeAction[] = [
	{ id: 'report', label: 'See report', relevance: 'high', href: '/reports' },
	{ id: 'guide', label: 'Guide', relevance: 'medium', href: '/guide' },
];

/* A compact control is taller than a text line. */
const COMPACT_LINK: WidgetRuntimeAction[] = [
	{ id: 'report', label: 'See report', relevance: 'high', href: '/reports' },
	{
		id: 'export',
		label: 'Export',
		relevance: 'medium',
		icon: <svg />,
		href: '/export.csv',
		download: 'export.csv',
	},
];

const CALLBACKS: WidgetRuntimeAction[] = [
	{ id: 'refresh', label: 'Refresh', relevance: 'high', callback: () => {} },
	{
		id: 'export',
		label: 'Export',
		relevance: 'medium',
		icon: <svg />,
		callback: () => {},
	},
];

/* The footer reads the pending map from the dashboard's context. */
function inDashboard( ui: ReactNode ) {
	return (
		<WidgetDashboard
			layout={ [] }
			onLayoutChange={ () => {} }
			widgetTypes={ [] }
			resolveWidgetModule={ async () => ( { default: () => null } ) }
		>
			{ ui }
		</WidgetDashboard>
	);
}

/*
 * The real tile wraps the footer in Card.Root, which inherits
 * box-sizing: border-box onto the strip. Measure inside that tree.
 */
function inTile( ui: ReactNode ) {
	return <Card.Root>{ ui }</Card.Root>;
}

/* Each strip sits alone in its wrapper, which takes the strip's height. */
function stripHeight( testId: string ) {
	return screen.getByTestId( testId ).getBoundingClientRect().height;
}

describe( 'WidgetFooter height', () => {
	it( 'gives every strip one height, whatever affordances it holds', async () => {
		await render(
			inDashboard(
				inTile(
					<>
						<div data-testid="text-links">
							<WidgetFooter uuid="w1" actions={ TEXT_LINKS } />
						</div>
						<div data-testid="compact-link">
							<WidgetFooter uuid="w2" actions={ COMPACT_LINK } />
						</div>
						<div data-testid="callbacks">
							<WidgetFooter uuid="w3" actions={ CALLBACKS } />
						</div>
					</>
				)
			)
		);

		const textLinks = stripHeight( 'text-links' );
		expect( stripHeight( 'compact-link' ) ).toBe( textLinks );
		expect( stripHeight( 'callbacks' ) ).toBe( textLinks );
	} );

	it( 'keeps the height when a compact action arrives at runtime', async () => {
		const view = await render(
			inDashboard(
				inTile(
					<div data-testid="strip">
						<WidgetFooter
							uuid="w1"
							actions={ [ TEXT_LINKS[ 0 ] ] }
						/>
					</div>
				)
			)
		);
		const before = stripHeight( 'strip' );

		await view.rerender(
			inDashboard(
				inTile(
					<div data-testid="strip">
						<WidgetFooter uuid="w1" actions={ COMPACT_LINK } />
					</div>
				)
			)
		);

		expect( stripHeight( 'strip' ) ).toBe( before );
	} );
} );
