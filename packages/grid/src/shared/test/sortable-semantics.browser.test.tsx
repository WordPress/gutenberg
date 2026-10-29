import { screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { useId } from '@wordpress/element';
import { DashboardGrid } from '../../dashboard-grid';
import { DashboardLanes } from '../../dashboard-lanes';

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

/* eslint-disable testing-library/no-node-access */
describe.each( [
	[ 'DashboardGrid', DashboardGrid ],
	[ 'DashboardLanes', DashboardLanes ],
] as const )( '%s sortable semantics', ( _, Dashboard ) => {
	it.each( [
		[ 'read mode', false, true ],
		[ 'a pinned item', true, false ],
	] as const )(
		'preserves interactive content semantics in %s',
		async ( __, editMode, draggable ) => {
			const { container } = await render(
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
			const { container } = await render(
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
			await userEvent.keyboard( '[Space]' );
			await expect
				.poll( () => activator.getAttribute( 'aria-pressed' ) )
				.toBe( 'true' );
			await userEvent.keyboard( '[Escape]' );
			await expect
				.poll( () => activator.hasAttribute( 'aria-pressed' ) )
				.toBe( false );
			expect( activator ).toHaveFocus();
		}
	);
} );
/* eslint-enable testing-library/no-node-access */
