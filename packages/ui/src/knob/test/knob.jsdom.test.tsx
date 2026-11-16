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
