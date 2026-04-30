import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Field from '../../field';
import * as Checkbox from '../index';

const originalPointerEvent = globalThis.PointerEvent;

describe( 'Checkbox', () => {
	beforeAll( () => {
		if ( ! globalThis.PointerEvent ) {
			Object.defineProperty( globalThis, 'PointerEvent', {
				configurable: true,
				value: MouseEvent,
			} );
		}
	} );

	afterAll( () => {
		if ( originalPointerEvent ) {
			Object.defineProperty( globalThis, 'PointerEvent', {
				configurable: true,
				value: originalPointerEvent,
			} );
		} else {
			Reflect.deleteProperty( globalThis, 'PointerEvent' );
		}
	} );
	it( 'forwards refs', () => {
		const rootRef = createRef< HTMLElement >();
		const indicatorRef = createRef< HTMLSpanElement >();

		render(
			<Checkbox.Root ref={ rootRef } defaultChecked>
				<Checkbox.Indicator ref={ indicatorRef } />
			</Checkbox.Root>
		);

		expect( rootRef.current ).toBeInstanceOf( HTMLSpanElement );
		expect( indicatorRef.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'toggles an uncontrolled checkbox when clicked', async () => {
		const user = userEvent.setup();
		const onCheckedChange = jest.fn();

		render(
			<Checkbox.Root
				aria-label="Option"
				onCheckedChange={ onCheckedChange }
			/>
		);

		const checkbox = screen.getByRole( 'checkbox', { name: 'Option' } );

		expect( checkbox ).not.toBeChecked();

		await user.click( checkbox );

		expect( checkbox ).toBeChecked();
		expect( onCheckedChange ).toHaveBeenCalledWith(
			true,
			expect.any( Object )
		);
	} );

	it( 'is labeled by Field.Label when composed with Field.Root', async () => {
		const user = userEvent.setup();

		render(
			<Field.Root>
				<Checkbox.Root />
				<Field.Label>Option</Field.Label>
			</Field.Root>
		);

		const checkbox = screen.getByRole( 'checkbox', { name: 'Option' } );

		expect( checkbox ).toBeVisible();
		expect( checkbox ).not.toBeChecked();

		await user.click( screen.getByText( 'Option' ) );

		expect( checkbox ).toBeChecked();
	} );

	it( 'supports an indeterminate state', () => {
		const inputRef = createRef< HTMLInputElement >();

		render(
			<Checkbox.Root
				aria-label="Mixed option"
				indeterminate
				inputRef={ inputRef }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', { name: 'Mixed option' } )
		).toBePartiallyChecked();
		expect( inputRef.current ).toBeInstanceOf( HTMLInputElement );
		expect( inputRef.current?.indeterminate ).toBe( true );
	} );
} );
