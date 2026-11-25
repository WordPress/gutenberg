import { waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import type { ComponentType, ReactNode } from 'react';
import { useLayoutEffect, useRef } from '@wordpress/element';
import { DashboardGrid } from '../../dashboard-grid';
import { DashboardLanes } from '../../dashboard-lanes';
import { GRID_ITEM_DATA_KEY } from '../grid-item-key';

const surfaces: Array< [ string, ComponentType< any > ] > = [
	[ 'DashboardGrid', DashboardGrid ],
	[ 'DashboardLanes', DashboardLanes ],
];

/**
 * Tile body that records its tile's width in its first layout effect, as a
 * widget that picks its layout from its own size does.
 */
function WidthProbe( { onMount }: { onMount: ( width: number ) => void } ) {
	const ref = useRef< HTMLDivElement >( null );
	useLayoutEffect( () => {
		// eslint-disable-next-line testing-library/no-node-access
		const tile = ref.current?.closest< HTMLElement >(
			`[${ GRID_ITEM_DATA_KEY }]`
		);
		if ( tile ) {
			onMount( tile.getBoundingClientRect().width );
		}
		// Only the first reading matters.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	return <div ref={ ref }>Probe</div>;
}

function trackCount( container: HTMLElement ): number {
	// eslint-disable-next-line testing-library/no-node-access
	const tile = container.querySelector< HTMLElement >(
		`[${ GRID_ITEM_DATA_KEY }]`
	);
	// eslint-disable-next-line testing-library/no-node-access
	const surface = tile?.parentElement;
	if ( ! surface ) {
		return 0;
	}
	return window
		.getComputedStyle( surface )
		.gridTemplateColumns.split( ' ' )
		.filter( Boolean ).length;
}

describe.each( surfaces )( '%s first measurement', ( _name, Surface ) => {
	it( 'resolves columns from the content box when the surface has padding', async () => {
		// 1000px wide with 30px padding on each side: the border box crosses
		// the 960px step, the 940px content box does not.
		const widths: number[] = [];
		const { container } = await render(
			<div style={ { width: 1000 } }>
				<Surface
					style={ { padding: '0 30px' } }
					columns={ { 0: 1, 960: 3 } }
					layout={ [ { key: 'a', width: 1 } ] }
				>
					<div key="a">
						<WidthProbe
							onMount={ ( width ) => widths.push( width ) }
						/>
					</div>
				</Surface>
			</div>
		);
		await waitFor( () => expect( widths ).toHaveLength( 1 ) );
		expect( widths[ 0 ] ).toBeCloseTo( 940, 0 );
		// It stays at one column once the ResizeObserver reports.
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
		expect( trackCount( container ) ).toBe( 1 );
	} );

	it( 'picks up a gap the parent sets in its own mount effect', async () => {
		// At 1000px with 320px columns, a 10px gap fits three columns and a
		// 50px gap fits two.
		function Host( { children }: { children: ReactNode } ) {
			const ref = useRef< HTMLDivElement >( null );
			useLayoutEffect( () => {
				ref.current?.style.setProperty( '--wp-grid-gap', '50px' );
			}, [] );
			return (
				<div
					ref={ ref }
					style={
						{
							width: 1000,
							'--wp-grid-gap': '10px',
						} as React.CSSProperties
					}
				>
					{ children }
				</div>
			);
		}
		const { container } = await render(
			<Host>
				<Surface
					minColumnWidth={ 320 }
					layout={ [ { key: 'a', width: 1 } ] }
				>
					<div key="a">A</div>
				</Surface>
			</Host>
		);
		await waitFor( () => expect( trackCount( container ) ).toBe( 2 ) );
	} );
} );
