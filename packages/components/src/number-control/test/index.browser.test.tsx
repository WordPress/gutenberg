import { describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import NumberControl from '..';

function StatefulNumberControl( { disabled }: { disabled?: boolean } ) {
	const [ value, setValue ] = useState< string | undefined >( '5' );

	return (
		<NumberControl
			disabled={ disabled }
			value={ value }
			onChange={ setValue }
		/>
	);
}

async function dragInput(
	input: Element,
	pointerType: 'touch' | 'mouse',
	yList: number[] = [ 100, 80, 40 ],
	moveCallbacks?: Record< string, () => Promise< void > >
) {
	const pointer = {
		pointerId: 1,
		pointerType,
		isPrimary: true,
		button: 0,
		buttons: 1,
		clientX: 50,
	};
	let [ y, ...yMoves ] = yList;
	fireEvent.pointerDown( input, { ...pointer, clientY: y } );
	for await ( y of yMoves ) {
		fireEvent.pointerMove( window, { ...pointer, clientY: y } );
		await moveCallbacks?.[ y ]?.();
	}
	fireEvent.pointerUp( window, { ...pointer, clientY: y, buttons: 0 } );
}

describe( 'NumberControl drag to change value', () => {
	it( 'does not change the value when dragged with touch input', async () => {
		const screen = await render( <StatefulNumberControl /> );
		const input = screen.getByRole( 'spinbutton' );

		dragInput( input.element(), 'touch' );

		await expect.element( input ).toHaveValue( 5 );
	} );

	it( 'changes the value when dragged with mouse input', async () => {
		const screen = await render( <StatefulNumberControl /> );
		const input = screen.getByRole( 'spinbutton' );

		dragInput( input.element(), 'mouse' );

		await expect.element( input ).toHaveValue( 55 );
	} );

	it( 'does not change the value when dragged with mouse while disabled', async () => {
		const screen = await render( <StatefulNumberControl disabled /> );
		const input = screen.getByRole( 'spinbutton' );

		dragInput( input.element(), 'mouse' );

		await expect.element( input ).toHaveValue( 5 );
	} );

	it( 'does not change the value when dragged with mouse within a disabled parent', async () => {
		const screen = await render(
			<fieldset disabled>
				<StatefulNumberControl />
			</fieldset>
		);
		const input = screen.getByRole( 'spinbutton' );

		dragInput( input.element(), 'mouse' );

		await expect.element( input ).toHaveValue( 5 );
	} );

	it( 'interrupts a drag when a parent becomes disabled', async () => {
		function Disabler( { disabled }: { disabled?: boolean } ) {
			return (
				<fieldset disabled={ disabled }>
					<StatefulNumberControl />
				</fieldset>
			);
		}
		const screen = await render( <Disabler /> );
		const renderDisabled = async () =>
			await screen.rerender( <Disabler disabled /> );
		const input = screen.getByRole( 'spinbutton' );

		await dragInput( input.element(), 'mouse', [ 100, 80, 40 ], {
			'80': renderDisabled,
		} );

		await expect.element( input ).toHaveValue( 15 );
	} );

	it( 'normalizes drag multiplication for fractional values with spinFactor without floating-point inaccuracies', async () => {
		function DragFractionalControl() {
			const [ value, setValue ] = useState< string | number | undefined >(
				'0.3'
			);

			return (
				<NumberControl
					value={ value }
					step="any"
					spinFactor={ 0.1 }
					dragThreshold={ 0 }
					onChange={ setValue }
				/>
			);
		}

		const screen = await render( <DragFractionalControl /> );
		const input = screen.getByRole( 'spinbutton' );

		// Drag 6px upwards (delta of -6 for north direction modifier -1 => +0.6).
		dragInput( input.element(), 'mouse', [ 6, 0 ] );

		await expect.element( input ).toHaveValue( 0.9 );
	} );
} );
