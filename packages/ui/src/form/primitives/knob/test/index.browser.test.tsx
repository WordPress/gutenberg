import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createRef } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { ThemeProvider } from '../../../../utils/theme-provider';
import { Field } from '../../../primitives';
import { Knob } from '../index';

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
			step: 0.01,
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
			const { width, height } = dial.element().getBoundingClientRect();
			await dial.click( { position: { x: width - 3, y: height / 2 } } );
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
		await userEvent.keyboard( '{ArrowUp}{PageUp}{End}' );
		expect( onKeyDown ).toHaveBeenCalledTimes( 3 );
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
		const { width, height } = dial.element().getBoundingClientRect();
		await dial.click( { position: { x: width - 3, y: height / 2 } } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveFocus();
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '90' );
		await dial.click( { position: { x: width / 2, y: 3 } } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
	} );

	it( 'follows a drag across twelve o’clock on a wrapping dial', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Angle" defaultValue={ 180 } />
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { width, height } = dial.element().getBoundingClientRect();
		await dial.dropTo( dial, {
			sourcePosition: { x: width * 0.25, y: height * 0.25 },
			targetPosition: { x: width * 0.75, y: height * 0.25 },
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
			const { width, height } = dial.element().getBoundingClientRect();
			await dial.click( { position: { x: width - 3, y: height / 2 } } );
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
			const { width, height } = dial.element().getBoundingClientRect();
			const top = { x: width / 2, y: 3 };
			const right = { x: width - 3, y: height / 2 };
			const bottom = { x: width / 2, y: height - 3 };
			const left = { x: 3, y: height / 2 };
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
		expect( slider.element().closest( '[data-empty]' ) ).not.toBeNull();
		const { width, height } = dial.element().getBoundingClientRect();
		await dial.click( { position: { x: width - 3, y: height / 2 } } );
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
		expect( slider.element().closest( '[data-empty]' ) ).toBeNull();
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
		const { width, height } = dial.element().getBoundingClientRect();
		await dial.click( { position: { x: width - 3, y: height / 2 } } );
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
		const { width, height } = dial.element().getBoundingClientRect();
		await dial.click( { position: { x: width - 3, y: height / 2 } } );
		await expect.element( slider ).toBeDisabled();
		await expect.element( slider ).toHaveValue( '0' );
		expect( onValueChange ).not.toHaveBeenCalled();
	} );
} );
