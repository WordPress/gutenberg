import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import TransformPanel, { getScaleAsNumber } from '../transform-panel';

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

describe( 'TransformPanel offsets', () => {
	const translateSettings = { transform: { translate: true } };

	it( 'shows each stored axis in its own field', () => {
		render(
			<TransformPanel
				value={ { transform: { translate: { x: '10px', y: '-50%' } } } }
				settings={ translateSettings }
				onChange={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'spinbutton', { name: 'X offset' } )
		).toHaveValue( 10 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Y offset' } )
		).toHaveValue( -50 );
	} );

	it( 'writes a negative offset for one axis only', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				settings={ translateSettings }
				onChange={ onChange }
			/>
		);

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Y offset' } ),
			'-8'
		);

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { y: '-8px' } },
		} );
	} );

	it( 'removes an axis when its field is cleared', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { translate: { x: '10px', y: '4px' } } } }
				settings={ translateSettings }
				onChange={ onChange }
			/>
		);

		await user.clear(
			screen.getByRole( 'spinbutton', { name: 'X offset' } )
		);

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { y: '4px' } },
		} );
	} );

	it( 'lists both axes as one Offset menu item', async () => {
		const user = userEvent.setup();
		render(
			<TransformPanel
				value={ {} }
				settings={ translateSettings }
				onChange={ vi.fn() }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Transform options' } )
		);

		expect(
			screen.getByRole( 'menuitemcheckbox', { name: /Offset/ } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'menuitemcheckbox', { name: /X offset/ } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitemcheckbox', { name: /Y offset/ } )
		).not.toBeInTheDocument();
	} );

	it( 'clears both axes when the Offset item is reset', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {
					transform: {
						rotate: '15deg',
						translate: { x: '10px', y: '4px' },
					},
				} }
				settings={ { transform: { rotate: true, translate: true } } }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Transform options' } )
		);
		await user.click( screen.getByRole( 'menuitem', { name: /Offset/ } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			transform: { rotate: '15deg', translate: undefined },
		} );
	} );

	it( 'keeps the unit of each axis when its slider moves', () => {
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { translate: { x: '2rem', y: '-50%' } } } }
				settings={ translateSettings }
				onChange={ onChange }
			/>
		);

		const xSlider = screen.getByRole( 'slider', { name: 'X offset' } );
		const ySlider = screen.getByRole( 'slider', { name: 'Y offset' } );
		expect( xSlider ).toHaveAttribute( 'min', '-50' );
		expect( xSlider ).toHaveAttribute( 'max', '50' );
		expect( ySlider ).toHaveAttribute( 'min', '-100' );
		expect( ySlider ).toHaveAttribute( 'max', '100' );

		fireEvent.change( xSlider, { target: { value: '-2.5' } } );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { x: '-2.5rem', y: '-50%' } },
		} );
	} );

	it( 'shows an inherited axis as a placeholder and saves only the axis set', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				inheritedValue={ {
					transform: { translate: { x: '3rem' } },
				} }
				settings={ translateSettings }
				onChange={ onChange }
			/>
		);

		const xOffset = screen.getByRole( 'spinbutton', { name: 'X offset' } );
		expect( xOffset ).toHaveValue( null );
		expect( xOffset ).toHaveAttribute( 'placeholder', '3' );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Y offset' } ),
			'4'
		);

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { y: '4px' } },
		} );
	} );

	it( 'uses the inherited unit for an empty axis until another unit is picked', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				inheritedValue={ {
					transform: { translate: { x: '3rem' } },
				} }
				settings={ translateSettings }
				onChange={ onChange }
			/>
		);

		const [ xUnit ] = screen.getAllByRole( 'combobox', {
			name: 'Select unit',
		} );
		expect( xUnit ).toHaveValue( 'rem' );

		const xOffset = screen.getByRole( 'spinbutton', { name: 'X offset' } );
		await user.type( xOffset, '1' );
		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { x: '1rem' } },
		} );

		await user.clear( xOffset );
		await user.selectOptions( xUnit, 'px' );
		await user.type( xOffset, '2' );
		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { x: '2px' } },
		} );
	} );

	it.each( [
		[ 'ArrowUp', '{ArrowUp}', '36px' ],
		[ 'ArrowDown', '{ArrowDown}', '34px' ],
		[ 'Shift+ArrowUp', '{Shift>}{ArrowUp}{/Shift}', '45px' ],
	] )(
		'steps %s from the inherited offset and saves only that axis',
		async ( _key, keys, expected ) => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<TransformPanel
					value={ { transform: { translate: { x: '21px' } } } }
					inheritedValue={ {
						transform: { translate: { x: '66px', y: '35px' } },
					} }
					settings={ translateSettings }
					onChange={ onChange }
				/>
			);

			await user.click(
				screen.getByRole( 'spinbutton', { name: 'Y offset' } )
			);
			await user.keyboard( keys );

			expect( onChange ).toHaveBeenLastCalledWith( {
				transform: { translate: { x: '21px', y: expected } },
			} );
		}
	);

	it( 'steps from the Default state offset in a selected state', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { translate: { x: '21px' } } } }
				inheritedValue={ {
					transform: { translate: { x: '21px' } },
				} }
				baseValue={ {
					transform: { translate: { x: '66px', y: '35px' } },
				} }
				settings={ translateSettings }
				onChange={ onChange }
			/>
		);

		const yOffset = screen.getByRole( 'spinbutton', { name: 'Y offset' } );
		expect( yOffset ).toHaveAttribute( 'placeholder', '35' );

		await user.click( yOffset );
		await user.keyboard( '{ArrowUp}' );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { x: '21px', y: '36px' } },
		} );
	} );

	it( 'saves nothing for an inherited offset that is not edited', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				inheritedValue={ {
					transform: { translate: { x: '66px', y: '35px' } },
				} }
				settings={ translateSettings }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'spinbutton', { name: 'X offset' } )
		);
		await user.tab();
		await user.click(
			screen.getByRole( 'spinbutton', { name: 'Y offset' } )
		);
		await user.tab();

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'clears both axes and the rotation on reset all', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {
					transform: { rotate: '15deg', translate: { x: '10px' } },
				} }
				settings={ { transform: { rotate: true, translate: true } } }
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
			transform: { rotate: undefined, translate: undefined },
		} );
	} );
} );

describe( 'getScaleAsNumber', () => {
	it.each( [
		[ 1.2, 1.2 ],
		[ '1.2', 1.2 ],
		[ '120%', 1.2 ],
		[ '.5', 0.5 ],
		[ 0, 0 ],
	] )( 'reads %s as %s', ( value, scale ) => {
		expect( getScaleAsNumber( value ) ).toBe( scale );
	} );

	it.each( [ -1, '-1', '1.2 1.5', 'calc(1 + 1)', 'var(--x)', '2x', NaN ] )(
		'does not read %s',
		( value ) => {
			expect( getScaleAsNumber( value ) ).toBeUndefined();
		}
	);
} );

describe( 'TransformPanel scale', () => {
	const scaleSettings = { transform: { scale: true } };

	it( 'writes the scale as a number', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				settings={ scaleSettings }
				onChange={ onChange }
			/>
		);

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Scale' } ),
			'1.25'
		);

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { scale: 1.25 },
		} );
	} );

	it( 'shows an inherited percentage and leaves it unchanged when the field loses focus', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				inheritedValue={ { transform: { scale: '120%' } } }
				settings={ scaleSettings }
				onChange={ onChange }
			/>
		);

		const input = screen.getByRole( 'spinbutton', { name: 'Scale' } );
		expect( input ).toHaveValue( 1.2 );
		await user.click( input );
		await user.tab();

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'removes the scale when the field is cleared', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { scale: 1.5 } } }
				settings={ scaleSettings }
				onChange={ onChange }
			/>
		);

		await user.clear( screen.getByRole( 'spinbutton', { name: 'Scale' } ) );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { scale: undefined },
		} );
	} );

	it( 'never writes a negative scale', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				settings={ scaleSettings }
				onChange={ onChange }
			/>
		);

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Scale' } ),
			'-2'
		);

		expect( onChange ).not.toHaveBeenCalledWith( {
			transform: { scale: -2 },
		} );
	} );

	function ControlledScalePanel( {
		inheritedValue,
		onChange,
	}: {
		inheritedValue?: { transform: { scale: number } };
		onChange: ( value: unknown ) => void;
	} ) {
		const [ value, setValue ] = useState( {} );
		return (
			<TransformPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ scaleSettings }
				onChange={ ( nextValue ) => {
					onChange( nextValue );
					setValue( nextValue );
				} }
			/>
		);
	}

	async function pressAndRecord(
		user: ReturnType< typeof userEvent.setup >,
		keys: string[],
		onChange: ReturnType< typeof vi.fn >
	) {
		const input = screen.getByRole( 'spinbutton', { name: 'Scale' } );
		const slider = screen.getByRole( 'slider', { name: 'Scale' } );
		const stored = [];
		for ( const key of keys ) {
			await user.keyboard( key );
			stored.push( onChange.mock.lastCall?.[ 0 ]?.transform?.scale );
			expect( input ).toHaveValue( stored.at( -1 ) );
			expect( slider ).toHaveValue( `${ stored.at( -1 ) }` );
		}
		return stored;
	}

	it.each( [
		[ 'ArrowUp', '{ArrowUp}', [ 1.01, 1.02, 1.03 ] ],
		[ 'ArrowDown', '{ArrowDown}', [ 0.99, 0.98, 0.97 ] ],
		[ 'Shift+ArrowUp', '{Shift>}{ArrowUp}{/Shift}', [ 1.1, 1.2, 1.3 ] ],
		[ 'Shift+ArrowDown', '{Shift>}{ArrowDown}{/Shift}', [ 0.9, 0.8, 0.7 ] ],
	] )(
		'steps %s from the unscaled size in an empty field',
		async ( _key, key, expected ) => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render( <ControlledScalePanel onChange={ onChange } /> );

			await user.click(
				screen.getByRole( 'spinbutton', { name: 'Scale' } )
			);

			expect(
				await pressAndRecord( user, [ key, key, key ], onChange )
			).toEqual( expected );
		}
	);

	it( 'steps up then down from a typed scale', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render( <ControlledScalePanel onChange={ onChange } /> );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Scale' } ),
			'1.5'
		);

		expect(
			await pressAndRecord(
				user,
				[
					'{ArrowUp}',
					'{ArrowUp}',
					'{ArrowDown}',
					'{ArrowDown}',
					'{ArrowDown}',
				],
				onChange
			)
		).toEqual( [ 1.51, 1.52, 1.51, 1.5, 1.49 ] );
	} );

	it( 'steps up then down from an inherited scale', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<ControlledScalePanel
				inheritedValue={ { transform: { scale: 1.2 } } }
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'spinbutton', { name: 'Scale' } ) );

		expect(
			await pressAndRecord(
				user,
				[
					'{ArrowUp}',
					'{ArrowUp}',
					'{ArrowDown}',
					'{ArrowDown}',
					'{ArrowDown}',
				],
				onChange
			)
		).toEqual( [ 1.21, 1.22, 1.21, 1.2, 1.19 ] );
	} );

	it( 'starts the slider from the unscaled size', () => {
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				settings={ scaleSettings }
				onChange={ onChange }
			/>
		);

		const slider = screen.getByRole( 'slider', { name: 'Scale' } );
		expect( slider ).toHaveValue( '1' );
		expect( slider ).toHaveAttribute( 'min', '0' );
		expect( slider ).toHaveAttribute( 'max', '3' );

		fireEvent.change( slider, { target: { value: '1.5' } } );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { scale: 1.5 },
		} );
	} );

	it( 'keeps a typed scale beyond the slider range', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ {} }
				settings={ scaleSettings }
				onChange={ onChange }
			/>
		);

		const input = screen.getByRole( 'spinbutton', { name: 'Scale' } );
		await user.type( input, '4.5' );
		await user.tab();

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { scale: 4.5 },
		} );
	} );

	it( 'shows a stored percentage as a number on both controls', () => {
		render(
			<TransformPanel
				value={ { transform: { scale: '150%' } } }
				settings={ scaleSettings }
				onChange={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'spinbutton', { name: 'Scale' } )
		).toHaveValue( 1.5 );
		expect( screen.getByRole( 'slider', { name: 'Scale' } ) ).toHaveValue(
			'1.5'
		);
	} );

	it( 'removes the scale on reset', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ { transform: { scale: 1.5 } } }
				settings={ scaleSettings }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Transform options' } )
		);
		await user.click( screen.getByRole( 'menuitem', { name: /Scale/ } ) );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { scale: undefined },
		} );
	} );
} );
