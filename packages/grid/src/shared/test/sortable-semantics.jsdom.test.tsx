import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useId } from '@wordpress/element';
import { DashboardGrid } from '../../dashboard-grid';
import { DashboardLanes } from '../../dashboard-lanes';

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

function Tile( {
	children,
}: {
	children: React.ReactNode;
	actionableArea?: React.ReactNode;
} ) {
	return <section>{ children }</section>;
}

function MetricControl() {
	const id = useId();
	return (
		<label htmlFor={ id }>
			Metric
			<select id={ id }>
				<option>Views</option>
				<option>Clicks</option>
			</select>
		</label>
	);
}

beforeEach( () => {
	vi.stubGlobal( 'ResizeObserver', MockResizeObserver );
} );

afterEach( () => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
} );

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
describe.each( [
	[ 'DashboardGrid', DashboardGrid ],
	[ 'DashboardLanes', DashboardLanes ],
] as const )( '%s sortable semantics', ( _, Dashboard ) => {
	it.each( [
		[ 'read mode', false, true ],
		[ 'a pinned item', true, false ],
	] as const )(
		'preserves interactive content semantics in %s',
		( __, editMode, draggable ) => {
			const { container } = render(
				<Dashboard
					layout={ [ { key: 'a', width: 1, draggable } ] }
					columns={ 2 }
					editMode={ editMode }
				>
					<Tile
						key="a"
						actionableArea={
							<button type="button">Settings</button>
						}
					>
						<a href="#details">Details</a>
						<button type="button">Refresh</button>
						<MetricControl />
					</Tile>
				</Dashboard>
			);

			for ( const control of [
				screen.getByRole( 'link', { name: 'Details' } ),
				screen.getByRole( 'button', { name: 'Refresh' } ),
				screen.getByRole( 'combobox', { name: 'Metric' } ),
			] ) {
				expect(
					control.closest( '[aria-disabled="true"]' )
				).toBeNull();
				expect(
					control.parentElement?.closest( '[role="button"]' )
				).toBeNull();
				expect(
					control.parentElement?.closest( '[tabindex]' )
				).toBeNull();
			}
			expect(
				container.querySelector( '[aria-roledescription="sortable"]' )
			).toBeNull();
			const settings = screen.getByRole( 'button', { name: 'Settings' } );
			expect( settings ).toBeEnabled();
			expect(
				settings.closest( '[inert], [aria-disabled="true"]' )
			).toBeNull();
		}
	);

	it.each( [
		[ 'a draggable item', true, 'sortable' ],
		[ 'a pinned item resize handle', false, 'draggable' ],
	] as const )(
		'retains keyboard activation and focus for %s',
		async ( __, draggable, roleDescription ) => {
			vi.useFakeTimers();
			const { container } = render(
				<Dashboard
					layout={ [ { key: 'a', width: 1, draggable } ] }
					columns={ 2 }
					editMode
				>
					<div key="a">A</div>
				</Dashboard>
			);
			const activator = container.querySelector< HTMLElement >(
				`[aria-roledescription="${ roleDescription }"]`
			)!;
			expect( activator ).toHaveAttribute( 'role', 'button' );
			expect( activator ).toHaveAttribute( 'tabindex', '0' );
			expect( activator ).toHaveAttribute( 'aria-disabled', 'false' );
			expect( activator ).toHaveAttribute( 'aria-describedby' );
			activator.focus();
			fireEvent.keyDown( activator, { code: 'Space' } );
			act( () => {
				vi.runOnlyPendingTimers();
			} );
			expect( activator ).toHaveAttribute( 'aria-pressed', 'true' );
			fireEvent.keyDown( activator, { code: 'Escape' } );
			await act( async () => {
				vi.runOnlyPendingTimers();
			} );
			expect( activator ).not.toHaveAttribute( 'aria-pressed' );
			expect( activator ).toHaveFocus();
		}
	);
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
