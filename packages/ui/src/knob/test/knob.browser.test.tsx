import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
// Browser Mode loads source CSS without the build's token fallbacks.
import '@wordpress/theme/design-tokens.css';
import { Knob } from '../index';

/**
 * Dispatches a pointer event at `angle` degrees clockwise from the top of
 * the dial.
 *
 * @param element The dial.
 * @param type    The pointer event type.
 * @param angle   The angle to point at.
 */
function pointAt(
	element: HTMLElement,
	type: 'pointerdown' | 'pointermove' | 'pointerup',
	angle: number
) {
	const rect = element.getBoundingClientRect();
	const radians = ( angle * Math.PI ) / 180;
	element.dispatchEvent(
		new PointerEvent( type, {
			bubbles: true,
			cancelable: true,
			pointerId: 1,
			pointerType: 'mouse',
			button: 0,
			clientX: rect.left + rect.width / 2 + 10 * Math.sin( radians ),
			clientY: rect.top + rect.height / 2 - 10 * Math.cos( radians ),
		} )
	);
}

/**
 * Drags the dial through each angle in turn.
 *
 * @param element The dial.
 * @param angles  The angles to visit, starting with the press.
 */
function drag( element: HTMLElement, angles: number[] ) {
	const [ first, ...rest ] = angles;
	pointAt( element, 'pointerdown', first );
	rest.forEach( ( angle ) => pointAt( element, 'pointermove', angle ) );
	pointAt( element, 'pointerup', angles[ angles.length - 1 ] );
}

describe( 'Knob dragging', () => {
	it( 'wraps from 359 to 0 when dragged past the top', async () => {
		const onValueChange = vi.fn();
		await render(
			<Knob aria-label="Angle" onValueChange={ onValueChange } />
		);
		drag( screen.getByRole( 'slider' ), [ 340, 359, 10 ] );
		expect(
			onValueChange.mock.calls.map( ( [ value ] ) => value )
		).toEqual( [ 340, 359, 10 ] );
	} );

	it( 'stops at min and max instead of wrapping', async () => {
		const onValueChange = vi.fn();
		await render(
			<Knob
				aria-label="Angle"
				defaultValue={ 340 }
				min={ 0 }
				max={ 360 }
				onValueChange={ onValueChange }
			/>
		);
		const knob = screen.getByRole( 'slider' );
		drag( knob, [ 350, 20, 90 ] );
		await waitFor( () => expect( knob ).toHaveValue( 360 ) );
		expect( onValueChange ).toHaveBeenLastCalledWith( 360 );
	} );

	it( 'counts turns past a full circle', async () => {
		await render(
			<Knob
				aria-label="Angle"
				defaultValue={ 0 }
				min={ -360 }
				max={ 360 }
			/>
		);
		const knob = screen.getByRole( 'slider' );
		drag( knob, [ 0, 90, 180, 270, 0, 90 ] );
		await waitFor( () => expect( knob ).toHaveValue( 360 ) );
		drag( knob, [ 0, 270, 180, 90, 0, 270, 180 ] );
		await waitFor( () => expect( knob ).toHaveValue( -180 ) );
	} );

	it( 'picks the angle nearest the current value on click', async () => {
		await render(
			<Knob
				aria-label="Angle"
				defaultValue={ -300 }
				min={ -360 }
				max={ 360 }
			/>
		);
		const knob = screen.getByRole( 'slider' );
		drag( knob, [ 90 ] );
		await waitFor( () => expect( knob ).toHaveValue( -270 ) );
	} );

	it( 'shows an indicator once an empty dial is clicked', async () => {
		await render( <Knob aria-label="Angle" defaultValue={ null } /> );
		const knob = screen.getByRole( 'slider' );
		expect( knob ).toBeEmptyDOMElement();
		drag( knob, [ 45 ] );
		await waitFor( () => expect( knob ).toHaveValue( 45 ) );
		expect( knob ).not.toBeEmptyDOMElement();
	} );

	it( 'takes focus on click without showing the focus ring', async () => {
		await render( <Knob aria-label="Angle" /> );
		const knob = screen.getByRole( 'slider' );
		await userEvent.click( knob );
		expect( knob ).toHaveFocus();
		expect( knob.matches( ':focus-visible' ) ).toBe( false );
	} );
} );
