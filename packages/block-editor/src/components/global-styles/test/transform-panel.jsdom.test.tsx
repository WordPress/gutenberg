import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransformPanel, { getAngleInDegrees } from '../transform-panel';

globalThis.wpVitest.mockMatchMedia();

const settings = { transform: { rotate: true } };

describe( 'getAngleInDegrees', () => {
	it.each( [
		[ '-15deg', -15 ],
		[ '0.25turn', 90 ],
		[ '100grad', 90 ],
		[ '1rad', 57 ],
		[ '0', 0 ],
	] )( 'reads %s as %s degrees', ( value, degrees ) => {
		expect( getAngleInDegrees( value ) ).toBe( degrees );
	} );

	it.each( [ '45', 'calc(10deg + 5deg)', 'x 45deg', 45 ] )(
		'does not read %s',
		( value ) => {
			expect( getAngleInDegrees( value ) ).toBeUndefined();
		}
	);
} );

describe( 'TransformPanel', () => {
	it( 'shows a stored angle in degrees without changing it', () => {
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { rotate: '0.25turn' } } }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		expect(
			screen.getByRole( 'spinbutton', { name: 'Rotation' } )
		).toHaveValue( 90 );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'leaves a fractional angle unchanged when the field loses focus', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { rotate: '1rad' } } }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'spinbutton', { name: 'Rotation' } )
		);
		await user.tab();

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'writes the rotation in degrees', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Rotation' } ),
			'45'
		);

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { rotate: '45deg' },
		} );
	} );

	it( 'keeps a negative rotation', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Rotation' } ),
			'-45'
		);
		await user.tab();

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { rotate: '-45deg' },
		} );
	} );

	it( 'leaves an inherited negative angle unchanged when the field loses focus', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				inheritedValue={ { transform: { rotate: '-0.025turn' } } }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		const input = screen.getByRole( 'spinbutton', { name: 'Rotation' } );
		expect( input ).toHaveValue( -9 );
		await user.click( input );
		await user.tab();

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'removes the rotation when the field is cleared', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { rotate: '15deg' } } }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		await user.clear(
			screen.getByRole( 'spinbutton', { name: 'Rotation' } )
		);

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { rotate: undefined },
		} );
	} );

	it( 'clears the rotation on reset all', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { rotate: '15deg' } } }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Transform options' } )
		);
		await user.click(
			screen.getByRole( 'menuitem', { name: 'Reset all' } )
		);

		expect( onChange ).toHaveBeenCalledWith( {
			transform: { rotate: undefined },
		} );
	} );
} );
