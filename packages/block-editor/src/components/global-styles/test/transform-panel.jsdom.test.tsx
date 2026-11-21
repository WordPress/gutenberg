import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransformPanel from '../transform-panel';

globalThis.wpVitest.mockMatchMedia();

const settings = { transform: { rotate: true } };

describe( 'TransformPanel', () => {
	it( 'shows a stored angle in its own unit without changing it', () => {
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
		).toHaveValue( 0.25 );
		expect(
			screen.getByRole( 'combobox', { name: 'Select unit' } )
		).toHaveValue( 'turn' );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it.each( [ '0.25turn', '1rad', '-45deg' ] )(
		'leaves %s unchanged when the field loses focus',
		async ( rotate ) => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<TransformPanel
					value={ { transform: { rotate } } }
					settings={ settings }
					onChange={ onChange }
				/>
			);

			await user.click(
				screen.getByRole( 'spinbutton', { name: 'Rotation' } )
			);
			await user.tab();

			expect( onChange ).not.toHaveBeenCalled();
		}
	);

	it( 'writes a negative rotation in degrees', async () => {
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

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { rotate: '-45deg' },
		} );
	} );

	it( 'keeps an angle beyond the slider range', async () => {
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
			'720'
		);
		await user.tab();

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { rotate: '720deg' },
		} );
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

	it( 'keeps the unit when the slider moves', () => {
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { rotate: '0.25turn' } } }
				settings={ settings }
				onChange={ onChange }
			/>
		);

		const slider = screen.getByRole( 'slider', { name: 'Rotation' } );
		expect( slider ).toHaveAttribute( 'min', '-1' );
		expect( slider ).toHaveAttribute( 'max', '1' );

		fireEvent.change( slider, { target: { value: '0.5' } } );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { rotate: '0.5turn' },
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
