import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from '@wordpress/element';
import FontAppearanceControl from '..';

it( 'Appearance preserves forwarded trigger callbacks', async () => {
	const user = userEvent.setup();
	const onFocus = vi.fn();
	const onBlur = vi.fn();
	render(
		createElement( FontAppearanceControl, {
			value: { fontStyle: 'normal', fontWeight: '400' },
			size: 'small',
			onChange: vi.fn(),
			onFocus,
			onBlur,
		} )
	);
	const trigger = screen.getByRole( 'combobox', { name: 'Appearance' } );
	await user.tab();
	expect( trigger ).toHaveFocus();
	expect( onFocus ).toHaveBeenCalledTimes( 1 );
	await user.tab();
	expect( onBlur ).toHaveBeenCalledTimes( 1 );
} );

it( "exposes the font appearance's label and selected value without a generated description", () => {
	render(
		createElement( FontAppearanceControl, {
			value: { fontStyle: 'normal', fontWeight: '400' },
			onChange: vi.fn(),
		} )
	);
	const trigger = screen.getByRole( 'combobox', { name: 'Appearance' } );
	expect( trigger ).toHaveTextContent( 'Regular' );
	expect( trigger ).toHaveAccessibleDescription( '' );
} );
