import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import { Knob } from '../../index';

describe( 'Knob', () => {
	it( 'exposes a slider with its range and value text', () => {
		render( <Knob aria-label="Angle" defaultValue={ 45 } /> );
		const knob = screen.getByRole( 'slider', { name: 'Angle' } );
		expect( knob ).toHaveValue( 45 );
		expect( knob ).toHaveAttribute( 'aria-valuemin', '0' );
		expect( knob ).toHaveAttribute( 'aria-valuemax', '359' );
		expect( knob ).toHaveAttribute( 'aria-valuetext', '45 degrees' );
	} );

	it( 'forwards refs and element props when rendering a custom element', () => {
		const ref = createRef< HTMLDivElement >();
		render(
			<Knob
				ref={ ref }
				aria-label="Angle"
				className="custom-knob"
				render={ <div data-custom="knob" /> }
			/>
		);
		expect( ref.current ).toBe( screen.getByRole( 'slider' ) );
		expect( ref.current ).toHaveClass( 'custom-knob' );
		expect( ref.current ).toHaveAttribute( 'data-custom', 'knob' );
	} );

	it( 'wraps around a full turn with the arrow keys', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<Knob
				aria-label="Angle"
				defaultValue={ 359 }
				onValueChange={ onValueChange }
			/>
		);
		await user.tab();
		await user.keyboard( '{ArrowUp}' );
		expect( onValueChange ).toHaveBeenLastCalledWith( 0 );
		await user.keyboard( '{ArrowLeft}' );
		expect( onValueChange ).toHaveBeenLastCalledWith( 359 );
	} );

	it( 'stops at min and max with the keyboard', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<Knob
				aria-label="Angle"
				defaultValue={ 85 }
				min={ 0 }
				max={ 90 }
				onValueChange={ onValueChange }
			/>
		);
		const knob = screen.getByRole( 'slider' );
		await user.tab();
		await user.keyboard( '{PageUp}' );
		expect( knob ).toHaveValue( 90 );
		await user.keyboard( '{ArrowUp}' );
		expect( onValueChange ).toHaveBeenCalledTimes( 1 );
		await user.keyboard( '{Home}' );
		expect( knob ).toHaveValue( 0 );
		await user.keyboard( '{ArrowDown}' );
		expect( knob ).toHaveValue( 0 );
		await user.keyboard( '{End}' );
		expect( knob ).toHaveValue( 90 );
	} );

	it( 'changes by the large step with Page keys and Shift', async () => {
		const user = userEvent.setup();
		render(
			<Knob
				aria-label="Angle"
				defaultValue={ 0 }
				min={ -360 }
				max={ 360 }
			/>
		);
		const knob = screen.getByRole( 'slider' );
		await user.tab();
		await user.keyboard( '{PageDown}' );
		expect( knob ).toHaveValue( -10 );
		await user.keyboard( '{Shift>}{ArrowRight}{/Shift}' );
		expect( knob ).toHaveValue( 0 );
	} );

	it( 'shows no indicator for an empty value until it changes', async () => {
		const user = userEvent.setup();
		render( <Knob aria-label="Angle" defaultValue={ null } /> );
		const knob = screen.getByRole( 'slider' );
		expect( knob ).toBeEmptyDOMElement();
		expect( knob ).toHaveAttribute( 'aria-valuetext', 'Not set' );
		await user.tab();
		await user.keyboard( '{ArrowUp}' );
		expect( knob ).toHaveAttribute( 'aria-valuetext', '1 degree' );
		expect( knob ).not.toBeEmptyDOMElement();
	} );

	it( 'follows the value in controlled mode', async () => {
		const user = userEvent.setup();
		function Controlled() {
			const [ value, setValue ] = useState< number | null >( 10 );
			return (
				<>
					<Knob
						aria-label="Angle"
						value={ value }
						onValueChange={ ( next ) => setValue( next * 2 ) }
					/>
					<button onClick={ () => setValue( null ) }>Clear</button>
				</>
			);
		}
		render( <Controlled /> );
		const knob = screen.getByRole( 'slider' );
		await user.tab();
		await user.keyboard( '{ArrowUp}' );
		expect( knob ).toHaveValue( 22 );
		await user.click( screen.getByRole( 'button', { name: 'Clear' } ) );
		expect( knob ).toBeEmptyDOMElement();
	} );

	it.each( [
		[ 'deg', 90, '90 degrees' ],
		[ 'turn', 0.25, '0.25 turns' ],
		[ 'rad', 1.57, '1.57 radians' ],
		[ 'grad', 100, '100 gradians' ],
	] as const )(
		'names the unit in the value text for %s',
		( unit, value, text ) => {
			render(
				<Knob aria-label="Angle" unit={ unit } defaultValue={ value } />
			);
			expect( screen.getByRole( 'slider' ) ).toHaveAttribute(
				'aria-valuetext',
				text
			);
		}
	);

	it( 'uses singular value text for one turn', () => {
		render(
			<Knob
				aria-label="Angle"
				unit="turn"
				defaultValue={ 1 }
				min={ 0 }
				max={ 2 }
			/>
		);
		expect( screen.getByRole( 'slider' ) ).toHaveAttribute(
			'aria-valuetext',
			'1 turn'
		);
	} );

	it.each( [
		[ 'deg', '359', 359, 0, 10 ],
		[ 'turn', '0.99', 0.99, 0, 0.1 ],
		[ 'rad', '6.28', 6.28, 0, 0.1 ],
		[ 'grad', '399', 399, 0, 10 ],
	] as const )(
		'wraps one full turn with the keys in %s',
		async ( unit, valueMax, last, first, large ) => {
			const user = userEvent.setup();
			render(
				<Knob aria-label="Angle" unit={ unit } defaultValue={ last } />
			);
			const knob = screen.getByRole( 'slider' );
			expect( knob ).toHaveAttribute( 'aria-valuemax', valueMax );
			await user.tab();
			await user.keyboard( '{ArrowUp}' );
			expect( knob ).toHaveValue( first );
			await user.keyboard( '{ArrowDown}' );
			expect( knob ).toHaveValue( last );
			await user.keyboard( '{Home}{PageUp}' );
			expect( knob ).toHaveValue( large );
		}
	);

	it( 'steps without floating point noise in turn units', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<Knob
				aria-label="Angle"
				unit="turn"
				defaultValue={ 0.1 }
				min={ -1 }
				max={ 1 }
				onValueChange={ onValueChange }
			/>
		);
		await user.tab();
		await user.keyboard( '{ArrowUp}{ArrowUp}{PageUp}' );
		expect(
			onValueChange.mock.calls.map( ( [ value ] ) => value )
		).toEqual( [ 0.11, 0.12, 0.22 ] );
		await user.keyboard( '{End}' );
		expect( onValueChange ).toHaveBeenLastCalledWith( 1 );
	} );

	it( 'uses a given step in any unit', async () => {
		const user = userEvent.setup();
		render(
			<Knob
				aria-label="Angle"
				unit="turn"
				step={ 0.125 }
				defaultValue={ 0.875 }
			/>
		);
		const knob = screen.getByRole( 'slider' );
		expect( knob ).toHaveAttribute( 'aria-valuemax', '0.875' );
		await user.tab();
		await user.keyboard( '{ArrowUp}' );
		expect( knob ).toHaveValue( 0 );
	} );

	it( 'rotates the indicator in the given unit', () => {
		render( <Knob aria-label="Angle" unit="turn" defaultValue={ 0.25 } /> );
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = screen.getByRole( 'slider' ).firstElementChild;
		expect( indicator ).toHaveStyle( { transform: 'rotate(0.25turn)' } );
	} );

	it( 'ignores input and leaves the Tab order when disabled', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<Knob aria-label="Angle" disabled onValueChange={ onValueChange } />
		);
		const knob = screen.getByRole( 'slider' );
		expect( knob ).toHaveAttribute( 'aria-disabled', 'true' );
		await user.tab();
		expect( knob ).not.toHaveFocus();
		knob.focus();
		await user.keyboard( '{ArrowUp}' );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );
} );
