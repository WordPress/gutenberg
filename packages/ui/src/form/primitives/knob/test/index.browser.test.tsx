import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { Locator } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createRef, useState } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { ThemeProvider } from '../../../../utils/theme-provider';
import { Field } from '../../../primitives';
import { Knob } from '../index';

// Positions on a dial, given in the 40-unit square it is drawn in and scaled to
// its rendered size.
function getPoints( dial: Locator ) {
	const { width, height } = dial.element().getBoundingClientRect();
	const at = ( x: number, y: number ) => ( {
		x: ( x * width ) / 40,
		y: ( y * height ) / 40,
	} );
	return {
		at,
		top: at( 20, 3 ),
		right: at( 37, 20 ),
		bottom: at( 20, 37 ),
		left: at( 3, 20 ),
		center: at( 20, 20 ),
	};
}

// A number field that commits its value when it loses focus, beside a dial
// that edits the same rotation.
function PairedRotation() {
	const [ rotation, setRotation ] = useState( 0 );
	const [ draft, setDraft ] = useState< string >();
	return (
		<ThemeProvider isRoot>
			<input
				aria-label="Rotation"
				type="number"
				value={ draft ?? rotation }
				onChange={ ( event ) => setDraft( event.target.value ) }
				onBlur={ () => {
					if ( draft !== undefined ) {
						setRotation( Number( draft ) );
						setDraft( undefined );
					}
				} }
			/>
			<Knob
				aria-label="Rotation dial"
				min={ -720 }
				max={ 720 }
				value={ rotation }
				onValueChange={ setRotation }
			/>
		</ThemeProvider>
	);
}

describe( 'Knob', () => {
	it( 'wraps in both directions with small and large keyboard steps', async () => {
		await render( <Knob aria-label="Angle" defaultValue={ 359 } /> );
		const slider = page.getByRole( 'slider', { name: 'Angle' } );
		await userEvent.tab();
		await expect.element( slider ).toHaveFocus();
		await userEvent.keyboard( '{ArrowUp}' );
		await expect.element( slider ).toHaveValue( '0' );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( slider ).toHaveValue( '359' );
		await userEvent.keyboard( '{PageUp}' );
		await expect.element( slider ).toHaveValue( '9' );
		await userEvent.keyboard( '{End}' );
		await expect.element( slider ).toHaveValue( '359' );
	} );

	it( 'stops at the ends of a bounded range', async () => {
		await render(
			<Knob
				aria-label="Rotation"
				min={ -90 }
				max={ 90 }
				defaultValue={ 89 }
			/>
		);
		const slider = page.getByRole( 'slider', { name: 'Rotation' } );
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}{ArrowUp}' );
		await expect.element( slider ).toHaveValue( '90' );
		await userEvent.keyboard( '{Home}{ArrowDown}' );
		await expect.element( slider ).toHaveValue( '-90' );
	} );

	it.each( [
		{ value: 450, expected: '90' },
		{ value: -45, expected: '315' },
	] )(
		'points a wrapping dial to the heading of $value without reporting a change',
		async ( { value, expected } ) => {
			const onValueChange = vi.fn();
			await render(
				<Knob
					aria-label="Angle"
					value={ value }
					onValueChange={ onValueChange }
				/>
			);
			await expect
				.element( page.getByRole( 'slider' ) )
				.toHaveValue( expected );
			expect( onValueChange ).not.toHaveBeenCalled();
		}
	);

	it( 'shows a value beyond a bounded range at the nearest end', async () => {
		const onValueChange = vi.fn();
		await render(
			<Knob
				aria-label="Rotation"
				min={ -720 }
				max={ 720 }
				value={ 1000 }
				onValueChange={ onValueChange }
			/>
		);
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '720' );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );

	it( 'reports exactly zero in the callback, native input, and form when stepping across zero', async () => {
		const onValueChange = vi.fn();
		await render(
			<form aria-label="Settings">
				<Knob
					aria-label="Offset"
					name="offset"
					min={ -0.3 }
					max={ 0.3 }
					step={ 0.1 }
					unitsPerTurn={ 1 }
					defaultValue={ -0.1 }
					onValueChange={ onValueChange }
				/>
			</form>
		);
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}' );
		const slider = page.getByRole( 'slider' );
		await expect.element( slider ).toHaveValue( '0' );
		await expect.element( slider ).toHaveAttribute( 'aria-valuenow', '0' );
		expect( onValueChange ).toHaveBeenLastCalledWith( 0 );
		const form = page.getByRole( 'form' ).element() as HTMLFormElement;
		expect( new FormData( form ).get( 'offset' ) ).toBe( '0' );
	} );

	it.each( [
		{
			unit: 'gradians',
			unitsPerTurn: 400,
			step: 1,
			quarter: '100',
			last: '399',
		},
		{
			unit: 'turns',
			unitsPerTurn: 1,
			// Turns get a step of 0.01 when none is set.
			step: undefined,
			quarter: '0.25',
			last: '0.99',
		},
		{
			unit: 'radians',
			unitsPerTurn: 2 * Math.PI,
			step: 0.01,
			quarter: '1.57',
			last: '6.28',
		},
	] )(
		'reads a quarter turn as $quarter $unit and wraps below zero to $last',
		async ( { unitsPerTurn, step, quarter, last } ) => {
			await render(
				<ThemeProvider isRoot>
					<Knob
						aria-label="Angle"
						unitsPerTurn={ unitsPerTurn }
						step={ step }
					/>
				</ThemeProvider>
			);
			const slider = page.getByRole( 'slider' );
			const dial = page.getByRole( 'group' );
			const { right } = getPoints( dial );
			await dial.click( { position: right } );
			await expect.element( slider ).toHaveValue( quarter );
			await userEvent.keyboard( '{Home}{ArrowDown}' );
			await expect.element( slider ).toHaveValue( last );
		}
	);

	it( 'lets a consumer cancel a slider key before its value changes', async () => {
		const onValueChange = vi.fn();
		const onKeyDown = vi.fn( ( event: React.KeyboardEvent ) =>
			event.preventDefault()
		);
		await render(
			<Knob
				aria-label="Angle"
				onKeyDown={ onKeyDown }
				onValueChange={ onValueChange }
			/>
		);
		await userEvent.tab();
		// Arrow Down from zero takes the path that wraps to the last step.
		await userEvent.keyboard( '{ArrowUp}{PageUp}{End}{ArrowDown}' );
		expect( onKeyDown ).toHaveBeenCalledTimes( 4 );
		expect( onValueChange ).not.toHaveBeenCalled();
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
	} );

	it( 'marks the field touched when the first keyboard step wraps', async () => {
		await render(
			<Field.Root>
				<Field.Label>Gradient angle</Field.Label>
				<Knob defaultValue={ 359 } />
			</Field.Root>
		);
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}' );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
		await expect
			.element( page.getByRole( 'group' ) )
			.toHaveAttribute( 'data-touched' );
	} );

	it( 'selects the heading at the pointer without dragging', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Angle" />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { top, right } = getPoints( dial );
		await dial.click( { position: right } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveFocus();
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '90' );
		const face = dial.element().getBoundingClientRect();
		const dot = dial
			.element()
			.querySelectorAll( 'circle' )[ 1 ]
			.getBoundingClientRect();
		expect( dot.left ).toBeGreaterThan( face.left + face.width / 2 );
		expect( dot.top + dot.height / 2 ).toBeCloseTo(
			face.top + face.height / 2,
			0
		);
		await dial.click( { position: top } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
	} );

	it( 'waits for the pointer to be released before a tap changes the value', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Angle" onValueChange={ onValueChange } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { right } = getPoints( dial );
		await userEvent.pointer( [
			{ target: dial, coords: right, keys: '[MouseLeft>]' },
			// A pen reports changes in pressure as moves at the same point.
			{ target: dial, coords: right },
		] );
		expect( onValueChange ).not.toHaveBeenCalled();
		await userEvent.pointer( '[/MouseLeft]' );
		expect( onValueChange ).toHaveBeenCalledExactlyOnceWith( 90 );
	} );

	it( 'selects zero when a tap is nearer to it than to the last coarse step', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Angle" step={ 100 } defaultValue={ 200 } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		// 340 degrees: 20 from zero and 40 from the last step at 300.
		await dial.click( {
			position: at( 14.2, 4 ),
		} );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
	} );

	it( 'wraps below zero when the steps divide a turn only approximately', async () => {
		await render(
			<Knob aria-label="Angle" unitsPerTurn={ 2.1 } step={ 0.3 } />
		);
		const slider = page.getByRole( 'slider' );
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( slider ).toHaveValue( '1.8' );
	} );

	it( 'selects the end nearest to a tap outside a bounded range', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Rotation" min={ 0 } max={ 180 } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		// Just past six o'clock, on the far side of the 180 degree stop.
		await dial.click( { position: at( 19, 37 ) } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '180' );
	} );

	it( 'returns to the pointer after a drag goes past the end and back', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					min={ 0 }
					max={ 90 }
					defaultValue={ 90 }
				/>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { right, bottom } = getPoints( dial );
		await userEvent.pointer( [
			{ target: dial, coords: right, keys: '[MouseLeft>]' },
			{ target: dial, coords: bottom },
			{ target: dial, coords: right },
			'[/MouseLeft]',
		] );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '90' );
	} );

	it( 'keeps an explicit zero when its heading is tapped at the end of a fractional range', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					min={ -1.1 }
					max={ 0 }
					unitsPerTurn={ 1 }
					defaultValue={ 0 }
					onValueChange={ onValueChange }
				/>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { top } = getPoints( dial );
		await dial.click( { position: top } );
		expect( onValueChange ).not.toHaveBeenCalled();
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
	} );

	it( 'uses the default step when the given step is too small to count', async () => {
		await render( <Knob aria-label="Angle" step={ 1e-14 } /> );
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}' );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '1' );
	} );

	it( 'selects the end when a tap lands on the dot just past it', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					min={ -360 }
					max={ 30 }
					step={ 5 }
					value={ null }
					placeholder={ 30 }
					onValueChange={ onValueChange }
				/>
			</ThemeProvider>
		);
		// Inside the dot, two degrees clockwise of the 30 degree stop.
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		await dial.click( { position: at( 25, 12 ) } );
		expect( onValueChange ).toHaveBeenCalledExactlyOnceWith( 30 );
	} );

	it( 'counts the turn from a value that a paired field commits when it loses focus', async () => {
		await render( <PairedRotation /> );
		await page.getByRole( 'spinbutton' ).fill( '390' );
		const dial = page.getByRole( 'group' );
		const { right } = getPoints( dial );
		await dial.click( { position: right } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '450' );
	} );

	it( 'follows the pointer when the dot is pressed just as a paired field commits another heading', async () => {
		await render( <PairedRotation /> );
		// Committing 420 moves the dot to two o'clock. The drag ends a quarter
		// turn from where it began, on the turn nearest to 420.
		await page.getByRole( 'spinbutton' ).fill( '420' );
		const dial = page.getByRole( 'group' );
		const { at, right } = getPoints( dial );
		// The dot still shows zero at twelve o'clock when the press lands on it.
		await userEvent.pointer( [
			{ target: dial, coords: at( 20, 10 ), keys: '[MouseLeft>]' },
			{ target: dial, coords: right },
			'[/MouseLeft]',
		] );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '450' );
	} );

	it( 'keeps a value a paired field commits when the dot stays where it was pressed', async () => {
		await render( <PairedRotation /> );
		// 360 has the heading of zero, so the dot does not move.
		await page.getByRole( 'spinbutton' ).fill( '360' );
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		await dial.click( { position: at( 21, 10 ) } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '360' );
	} );

	it( 'keeps a tap pending while a small slip stays on its step', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Angle" onValueChange={ onValueChange } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		// Both points round to 43 degrees. The second is off the round face,
		// in the corner of its box, so lifting there drops the tap.
		await userEvent.pointer( [
			{ target: dial, coords: at( 33, 6 ), keys: '[MouseLeft>]' },
			{ target: dial, coords: at( 34, 5 ) },
			'[/MouseLeft]',
		] );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );

	it( 'reaches the last step when the steps are an inexact fraction of a turn', async () => {
		const unitsPerTurn = 2 * Math.PI;
		const { rerender } = await render(
			<Knob
				aria-label="Angle"
				unitsPerTurn={ unitsPerTurn }
				step={ unitsPerTurn / 75 }
			/>
		);
		const slider = page.getByRole( 'slider' );
		const value = () =>
			Number( ( slider.element() as HTMLInputElement ).value );
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.poll( value ).toBeCloseTo( ( unitsPerTurn * 74 ) / 75, 6 );
		await rerender(
			<Knob
				aria-label="Angle"
				min={ 0 }
				max={ unitsPerTurn }
				unitsPerTurn={ unitsPerTurn }
				step={ unitsPerTurn / 100 }
			/>
		);
		await userEvent.keyboard( '{End}' );
		await expect.poll( value ).toBeCloseTo( unitsPerTurn, 6 );
	} );

	it( 'selects the heading under the pointer when a drag moves inward and then through the center', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Rotation" min={ 0 } max={ 360 } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { at, top } = getPoints( dial );
		await userEvent.pointer( [
			{ target: dial, coords: top, keys: '[MouseLeft>]' },
			{ target: dial, coords: at( 20, 14 ) },
			{ target: dial, coords: at( 14, 20 ) },
			'[/MouseLeft]',
		] );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '270' );
	} );

	it( 'selects the end when a tap rounds to it from just past it', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					min={ 0 }
					max={ 390 }
					defaultValue={ 360 }
				/>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		// A fraction of a degree clockwise of the 30 degree heading of the end.
		await dial.click( { position: at( 27, 8 ) } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '390' );
	} );

	it( 'drops a tap when the dial moves out from under a pointer that stays still', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<div data-testid="spacer" />
				<Knob aria-label="Angle" onValueChange={ onValueChange } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { right } = getPoints( dial );
		const { left, top } = dial.element().getBoundingClientRect();
		await userEvent.pointer( {
			target: dial,
			coords: right,
			keys: '[MouseLeft>]',
		} );
		( page.getByTestId( 'spacer' ).element() as HTMLElement ).style.height =
			'60px';
		// Release at the same place on the screen, which the dial has left.
		await userEvent.pointer( {
			target: page.elementLocator( document.documentElement ),
			coords: { x: left + right.x, y: top + right.y },
			keys: '[/MouseLeft]',
		} );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );

	it( 'selects the heading under the pointer when a drag past the end crosses the center', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					min={ 0 }
					max={ 360 }
					defaultValue={ 360 }
				/>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { top, right, bottom, left, center } = getPoints( dial );
		await userEvent.pointer( [
			{ target: dial, coords: top, keys: '[MouseLeft>]' },
			...[ right, bottom, left, center, right ].map( ( coords ) => ( {
				target: dial,
				coords,
			} ) ),
			'[/MouseLeft]',
		] );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '90' );
	} );

	it( 'selects the heading under the pointer after a fast drag skips the center', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Rotation" min={ 0 } max={ 360 } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { top, bottom } = getPoints( dial );
		await userEvent.pointer( [
			{
				target: dial,
				coords: top,
				keys: '[MouseLeft>]',
			},
			{ target: dial, coords: bottom },
			'[/MouseLeft]',
		] );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '180' );
	} );

	it.each( [
		{ sampling: 'a sample inside it', sampled: true },
		{ sampling: 'no sample inside it', sampled: false },
	] )(
		'selects the heading under the pointer after a drag passes through the center with $sampling',
		async ( { sampled } ) => {
			await render(
				<ThemeProvider isRoot>
					<Knob aria-label="Rotation" min={ 0 } max={ 360 } />
				</ThemeProvider>
			);
			const dial = page.getByRole( 'group' );
			const { at } = getPoints( dial );
			// From just above the center, through it, to just left of it.
			// Turning a quarter turn back from zero would stop at the lower
			// end instead.
			await userEvent.pointer( [
				{ target: dial, coords: at( 20, 14 ), keys: '[MouseLeft>]' },
				...( sampled
					? [ { target: dial, coords: at( 17, 17 ) } ]
					: [] ),
				{ target: dial, coords: at( 14, 20 ) },
				'[/MouseLeft]',
			] );
			await expect
				.element( page.getByRole( 'slider' ) )
				.toHaveValue( '270' );
		}
	);

	it( 'selects a heading near the stop when a tap misses the dot', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Rotation" min={ 0 } max={ 360 } />
			</ThemeProvider>
		);
		// On the rim at 339 degrees, 21 degrees short of the dot at zero.
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		await dial.click( { position: at( 14, 4 ) } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '339' );
	} );

	it( 'keeps the value when the dot is pressed off its center', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					min={ 0 }
					max={ 360 }
					defaultValue={ 360 }
					onValueChange={ onValueChange }
				/>
			</ThemeProvider>
		);
		// One pixel left of the center of the dot, which sits at twelve o'clock.
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		await dial.click( { position: at( 19, 10 ) } );
		expect( onValueChange ).not.toHaveBeenCalled();
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '360' );
	} );

	it( 'selects a heading the range has before treating a tap as past an end', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					min={ 0 }
					max={ 315 }
					defaultValue={ 90 }
				/>
			</ThemeProvider>
		);
		// Half past ten, the heading of the upper end at 315 degrees.
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		await dial.click( { position: at( 11.5, 11.5 ) } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '315' );
	} );

	it( 'reports a drag back to the start while a controlled value has not updated', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Angle"
					value={ 0 }
					onValueChange={ onValueChange }
				/>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { top, right } = getPoints( dial );
		await userEvent.pointer( [
			{ target: dial, coords: top, keys: '[MouseLeft>]' },
			{ target: dial, coords: right },
			{ target: dial, coords: top },
			'[/MouseLeft]',
		] );
		expect( onValueChange.mock.calls ).toEqual( [ [ 90 ], [ 0 ] ] );
	} );

	it( 'drops a tap when the pointer leaves the dial before it lifts', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<div
					style={ { display: 'flex', alignItems: 'center', gap: 20 } }
				>
					<Knob aria-label="Angle" onValueChange={ onValueChange } />
					<div
						data-testid="beside"
						style={ { width: 10, height: 10 } }
					/>
				</div>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { right } = getPoints( dial );
		await userEvent.pointer( [
			{
				target: dial,
				coords: right,
				keys: '[MouseLeft>]',
			},
			// Straight out to the right, so the heading stays the same.
			{ target: page.getByTestId( 'beside' ) },
			'[/MouseLeft]',
		] );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );

	it( 'follows a drag across twelve o’clock on a wrapping dial', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Angle" defaultValue={ 180 } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { at } = getPoints( dial );
		await dial.dropTo( dial, {
			sourcePosition: at( 10, 10 ),
			targetPosition: at( 30, 10 ),
		} );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '45' );
	} );

	it( 'shows keyboard focus around the native slider target in wp-admin', async () => {
		await render(
			<ThemeProvider isRoot>
				{ /* wp-admin common.css resets div outlines outside the wp-ui layer. */ }
				<style>{ 'div { outline: 0; }' }</style>
				<Knob aria-label="Rotation" />
			</ThemeProvider>
		);
		const slider = page.getByRole( 'slider' ).element();
		const dial = page.getByRole( 'group' ).element();
		await userEvent.tab();
		expect( slider ).toHaveFocus();
		expect(
			parseFloat( getComputedStyle( dial ).outlineWidth )
		).toBeGreaterThan( 0 );
		expect( slider.getBoundingClientRect().toJSON() ).toEqual(
			dial.getBoundingClientRect().toJSON()
		);
	} );

	it.each( [
		{ from: -300, expected: '-270' },
		{ from: 390, expected: '450' },
		{ from: 710, expected: '450' },
	] )(
		'selects the nearest available turn from $from on click',
		async ( { from, expected } ) => {
			await render(
				<ThemeProvider isRoot>
					<Knob
						aria-label="Rotation"
						min={ -720 }
						max={ 720 }
						defaultValue={ from }
					/>
				</ThemeProvider>
			);
			const dial = page.getByRole( 'group' );
			const { right } = getPoints( dial );
			await dial.click( { position: right } );
			await expect
				.element( page.getByRole( 'slider' ) )
				.toHaveValue( expected );
		}
	);

	it.each( [
		{ direction: 'clockwise', unitsPerTurn: 360, step: 1, expected: '810' },
		{
			direction: 'counterclockwise',
			unitsPerTurn: 360,
			step: 1,
			expected: '-810',
		},
		{
			direction: 'clockwise',
			unitsPerTurn: 1,
			step: 0.25,
			expected: '2.25',
		},
	] )(
		'counts two full turns and a quarter $direction at $unitsPerTurn units per turn during one drag',
		async ( { direction, unitsPerTurn, step, expected } ) => {
			await render(
				<ThemeProvider isRoot>
					<Knob
						aria-label="Rotation"
						min={ -3 * unitsPerTurn }
						max={ 3 * unitsPerTurn }
						unitsPerTurn={ unitsPerTurn }
						step={ step }
						defaultValue={ 0 }
					/>
				</ThemeProvider>
			);
			const dial = page.getByRole( 'group' );
			const { top, right, bottom, left } = getPoints( dial );
			const turn =
				direction === 'clockwise'
					? [ right, bottom, left, top ]
					: [ left, bottom, right, top ];
			await userEvent.pointer( [
				{ target: dial, coords: top, keys: '[MouseLeft>]' },
				...[ ...turn, ...turn, turn[ 0 ] ].map( ( coords ) => ( {
					target: dial,
					coords,
				} ) ),
				'[/MouseLeft]',
			] );
			await expect
				.element( page.getByRole( 'slider' ) )
				.toHaveValue( expected );
		}
	);

	it( 'uses the field label, description, and name on the range input', async () => {
		const ref = createRef< HTMLInputElement >();
		await render(
			<form aria-label="Appearance">
				<Field.Root name="angle">
					<Field.Label>Gradient angle</Field.Label>
					<Knob
						inputRef={ ref }
						format={ {
							style: 'unit',
							unit: 'degree',
							unitDisplay: 'long',
						} }
						locale="en"
					/>
					<Field.Description>
						Direction of the gradient.
					</Field.Description>
				</Field.Root>
			</form>
		);
		const slider = page.getByRole( 'slider', { name: 'Gradient angle' } );
		await expect
			.element( slider )
			.toHaveAccessibleDescription( 'Direction of the gradient.' );
		await page.getByText( 'Gradient angle' ).click();
		await expect.element( slider ).toHaveFocus();
		expect( ref.current ).toBe( slider.element() );
		await userEvent.keyboard( '{PageUp}' );
		await expect
			.element( slider )
			.toHaveAttribute( 'aria-valuetext', '10 degrees' );
		const form = page.getByRole( 'form' ).element() as HTMLFormElement;
		expect( new FormData( form ).get( 'angle' ) ).toBe( '10' );
	} );

	it( 'keeps the controlled value until the caller updates it', async () => {
		const onValueChange = vi.fn();
		const { rerender } = await render(
			<Knob
				aria-label="Angle"
				value={ 10 }
				onValueChange={ onValueChange }
			/>
		);
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}' );
		expect( onValueChange ).toHaveBeenCalledWith( 11 );
		const slider = page.getByRole( 'slider', { name: 'Angle' } );
		await expect.element( slider ).toHaveValue( '10' );
		await rerender(
			<Knob
				aria-label="Angle"
				value={ 11 }
				onValueChange={ onValueChange }
			/>
		);
		await expect.element( slider ).toHaveValue( '11' );
	} );

	it( 'reports the placeholder while empty and sets a value when its heading is clicked', async () => {
		const onValueChange = vi.fn();
		const { rerender } = await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					value={ null }
					placeholder={ 90 }
					onValueChange={ onValueChange }
				/>
			</ThemeProvider>
		);
		const slider = page.getByRole( 'slider' );
		const dial = page.getByRole( 'group' );
		await expect.element( slider ).toHaveValue( '90' );
		// A hollow dot is all that tells an unset 90 from a set one.
		const dot = dial.element().querySelectorAll( 'circle' )[ 1 ];
		expect( getComputedStyle( dot ).fill ).toBe( 'none' );
		expect( getComputedStyle( dot ).stroke ).not.toBe( 'none' );
		const { right } = getPoints( dial );
		await dial.click( { position: right } );
		expect( onValueChange ).toHaveBeenCalledExactlyOnceWith( 90 );
		await rerender(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					value={ 90 }
					placeholder={ 90 }
					onValueChange={ onValueChange }
				/>
			</ThemeProvider>
		);
		await expect.element( slider ).toHaveValue( '90' );
		expect( getComputedStyle( dot ).fill ).not.toBe( 'none' );
		expect( getComputedStyle( dot ).stroke ).toBe( 'none' );
	} );

	it( 'ignores pointer input when the surrounding field is disabled', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Field.Root disabled>
					<Knob aria-label="Angle" onValueChange={ onValueChange } />
				</Field.Root>
			</ThemeProvider>
		);
		const slider = page.getByRole( 'slider', { name: 'Angle' } );
		await expect.element( slider ).toBeDisabled();
		const dial = page.getByRole( 'group' );
		const { right } = getPoints( dial );
		await dial.click( { position: right } );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );

	it( 'ignores clicks inside a disabled native fieldset', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<fieldset disabled>
					<legend>Appearance</legend>
					<Knob aria-label="Angle" onValueChange={ onValueChange } />
				</fieldset>
			</ThemeProvider>
		);
		const slider = page.getByRole( 'slider' );
		const dial = page.getByRole( 'group', { name: '', exact: true } );
		const { right } = getPoints( dial );
		await dial.click( { position: right } );
		await expect.element( slider ).toBeDisabled();
		await expect.element( slider ).toHaveValue( '0' );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );
} );
