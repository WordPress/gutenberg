import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createRef } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { ThemeProvider } from '../../../../utils/theme-provider';
import { Field, Knob } from '../../../primitives';

describe( 'Knob', () => {
	it( 'stops at the ends of a bounded range', async () => {
		await render( <Knob aria-label="Opacity" defaultValue={ 99 } /> );
		const slider = page.getByRole( 'slider', { name: 'Opacity' } );
		await userEvent.tab();
		await expect.element( slider ).toHaveFocus();
		await userEvent.keyboard( '{ArrowUp}{ArrowUp}' );
		await expect.element( slider ).toHaveValue( '100' );
		await userEvent.keyboard( '{Home}{ArrowDown}' );
		await expect.element( slider ).toHaveValue( '0' );
	} );

	it( 'wraps in both directions with small and large keyboard steps', async () => {
		await render(
			<Knob aria-label="Angle" max={ 359 } defaultValue={ 359 } wrap />
		);
		const slider = page.getByRole( 'slider', { name: 'Angle' } );
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}' );
		await expect.element( slider ).toHaveValue( '0' );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( slider ).toHaveValue( '359' );
		await userEvent.keyboard( '{PageUp}' );
		await expect.element( slider ).toHaveValue( '9' );
		await userEvent.keyboard( '{End}' );
		await expect.element( slider ).toHaveValue( '359' );
	} );

	it( 'wraps over negative and fractional steps', async () => {
		await render(
			<Knob
				aria-label="Offset"
				min={ -0.2 }
				max={ 0.1 }
				step={ 0.1 }
				defaultValue={ 0.1 }
				wrap
			/>
		);
		const slider = page.getByRole( 'slider', { name: 'Offset' } );
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}' );
		await expect.element( slider ).toHaveValue( '-0.2' );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( slider ).toHaveValue( '0.1' );
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

	it( 'moves at least one whole step with large-step keys in both directions', async () => {
		await render(
			<Knob aria-label="Opacity" step={ 25 } defaultValue={ 50 } />
		);
		const slider = page.getByRole( 'slider' );
		await userEvent.tab();
		await userEvent.keyboard( '{PageUp}' );
		await expect.element( slider ).toHaveValue( '75' );
		await userEvent.keyboard( '{Shift>}{ArrowDown}{/Shift}' );
		await expect.element( slider ).toHaveValue( '50' );
	} );

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
				<Knob max={ 359 } defaultValue={ 359 } wrap />
			</Field.Root>
		);
		await userEvent.tab();
		await userEvent.keyboard( '{ArrowUp}' );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
		await expect
			.element( page.getByRole( 'group' ) )
			.toHaveAttribute( 'data-touched' );
	} );

	it( 'selects the angle at the pointer without dragging', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Angle" max={ 359 } wrap />
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

	it( 'keeps the native slider focus target on the visible dial', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob aria-label="Rotation" />
			</ThemeProvider>
		);
		const slider = page.getByRole( 'slider' ).element();
		const dial = page.getByRole( 'group' ).element();
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
						unitsPerTurn={ 360 }
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

	it( 'wraps at the end of a two-turn range', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					max={ 719 }
					unitsPerTurn={ 360 }
					defaultValue={ 630 }
					wrap
				/>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { width, height } = dial.element().getBoundingClientRect();
		await dial.click( { position: { x: 3, y: height / 2 } } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '630' );
		await dial.dropTo( dial, {
			sourcePosition: { x: 3, y: height / 2 },
			targetPosition: { x: width / 2, y: 3 },
		} );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '0' );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '719' );
	} );

	it( 'selects the clicked direction when the wrapping range ends partway through a turn', async () => {
		await render(
			<ThemeProvider isRoot>
				<Knob
					aria-label="Rotation"
					max={ 500 }
					unitsPerTurn={ 360 }
					defaultValue={ 500 }
					wrap
				/>
			</ThemeProvider>
		);
		const dial = page.getByRole( 'group' );
		const { width, height } = dial.element().getBoundingClientRect();
		await dial.click( { position: { x: width / 2, y: height - 3 } } );
		await expect.element( page.getByRole( 'slider' ) ).toHaveValue( '180' );
	} );

	it.each( [
		{ wrap: false, max: 100, expected: '100' },
		{ wrap: true, max: 359, expected: '225' },
	] )(
		'drags through the bottom of the dial with wrap=$wrap',
		async ( { wrap, max, expected } ) => {
			await render(
				<ThemeProvider isRoot>
					<Knob aria-label="Value" max={ max } wrap={ wrap } />
				</ThemeProvider>
			);
			const dial = page.getByRole( 'group' );
			const { width, height } = dial.element().getBoundingClientRect();
			await dial.dropTo( dial, {
				sourcePosition: { x: width * 0.75, y: height * 0.75 },
				targetPosition: { x: width * 0.25, y: height * 0.75 },
			} );
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

	it( 'ignores pointer input when the surrounding field is disabled', async () => {
		const onValueChange = vi.fn();
		await render(
			<ThemeProvider isRoot>
				<Field.Root disabled>
					<Knob
						aria-label="Angle"
						max={ 359 }
						wrap
						onValueChange={ onValueChange }
					/>
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
					<Knob
						aria-label="Angle"
						max={ 359 }
						wrap
						onValueChange={ onValueChange }
					/>
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
