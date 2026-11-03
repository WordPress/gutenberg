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
		[ '1rad', 57.3 ],
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
