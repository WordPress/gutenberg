/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { pxToValueDelta, clampValue, quantize } from '../use-ruler-drag';
import RotationRuler from '../index';

describe( 'rotation-ruler math', () => {
	describe( 'pxToValueDelta', () => {
		it( 'converts pointer delta to a value delta using pixelsPerStep × step', () => {
			// 60px / 6 px-per-step × 1° step = 10 steps.
			// Negative because dragging the ruler right exposes smaller values.
			expect( pxToValueDelta( 60, 6, 1 ) ).toBeCloseTo( -10 );
			expect( pxToValueDelta( -60, 6, 1 ) ).toBeCloseTo( 10 );
		} );

		it( 'scales with a custom step', () => {
			// 60px / 6 px-per-step × 0.5° step = 5°.
			expect( pxToValueDelta( -60, 6, 0.5 ) ).toBeCloseTo( 5 );
		} );
	} );

	describe( 'clampValue', () => {
		it( 'clamps to [min, max]', () => {
			expect( clampValue( 100, -45, 45 ) ).toBe( 45 );
			expect( clampValue( -100, -45, 45 ) ).toBe( -45 );
			expect( clampValue( 12.3, -45, 45 ) ).toBe( 12.3 );
		} );
	} );

	describe( 'quantize', () => {
		it( 'rounds to the nearest multiple of step', () => {
			expect( quantize( 0.4, 1 ) ).toBe( 0 );
			expect( quantize( 0.6, 1 ) ).toBe( 1 );
			expect( quantize( -0.6, 1 ) ).toBe( -1 );
			expect( quantize( 12.3, 5 ) ).toBe( 10 );
			expect( quantize( 12.5, 5 ) ).toBe( 15 );
		} );
	} );
} );

describe( 'RotationRuler', () => {
	it( 'renders the value on the underlying input and in aria-valuetext', () => {
		render(
			<RotationRuler
				value={ -14 }
				onChange={ () => {} }
				label="Fine rotation"
			/>
		);
		const input = screen.getByRole( 'slider', { name: 'Fine rotation' } );
		expect( ( input as HTMLInputElement ).valueAsNumber ).toBe( -14 );
		expect( input ).toHaveAttribute( 'aria-valuetext', '-14°' );
	} );

	it( 'fires onChange with value + step on ArrowRight', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render(
			<RotationRuler
				value={ 0 }
				onChange={ onChange }
				label="Fine rotation"
			/>
		);
		const input = screen.getByRole( 'slider', { name: 'Fine rotation' } );
		input.focus();
		await user.keyboard( '{ArrowRight}' );
		expect( onChange ).toHaveBeenCalledWith( 1 );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'fires onChange with value + step / 2 on Shift+ArrowRight', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render(
			<RotationRuler
				value={ 0 }
				onChange={ onChange }
				label="Fine rotation"
			/>
		);
		screen.getByRole( 'slider', { name: 'Fine rotation' } ).focus();
		await user.keyboard( '{Shift>}{ArrowRight}{/Shift}' );
		expect( onChange ).toHaveBeenCalledWith( 0.5 );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not fire onChange when disabled', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render(
			<RotationRuler
				value={ 0 }
				onChange={ onChange }
				label="Fine rotation"
				disabled
			/>
		);
		screen.getByRole( 'slider', { name: 'Fine rotation' } ).focus();
		await user.keyboard( '{ArrowRight}' );
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
