import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, useState } from '@wordpress/element';
import FontFamilyControl from '..';
import FontAppearanceControl from '../../font-appearance-control';

vi.mock( import( '../../use-settings' ), () => ( {
	useSettings: () => [ [] ],
} ) );

it( 'keeps Default selected when resetting the font family to an empty string', async () => {
	const user = userEvent.setup();
	const onChange = vi.fn();
	function TestControl() {
		const [ value, setValue ] = useState( '' );
		return createElement( FontFamilyControl, {
			fontFamilies: [ { name: 'Serif', fontFamily: 'serif' } ],
			value,
			onChange: ( nextValue ) => {
				onChange( nextValue );
				setValue( nextValue );
			},
		} );
	}
	render( createElement( TestControl ) );
	const trigger = screen.getByRole( 'combobox', { name: 'Font' } );
	expect( trigger ).toHaveTextContent( 'Default' );
	await user.click( trigger );
	await user.click( await screen.findByRole( 'option', { name: 'Serif' } ) );
	expect( onChange ).toHaveBeenLastCalledWith( 'serif' );
	expect( trigger ).toHaveTextContent( 'Serif' );
	await user.click( trigger );
	await user.click(
		await screen.findByRole( 'option', { name: 'Default' } )
	);
	expect( onChange ).toHaveBeenLastCalledWith( '' );
	expect( trigger ).toHaveTextContent( 'Default' );
} );

it.each( [
	{
		Component: FontFamilyControl,
		label: 'Font',
		description: 'Choose the font family',
		props: {
			fontFamilies: [ { name: 'Serif', fontFamily: 'serif' } ],
			value: 'serif',
			describedBy: 'Choose the font family',
		},
	},
	{
		Component: FontAppearanceControl,
		label: 'Appearance',
		description: 'Currently selected font appearance: Regular',
		props: {
			value: { fontStyle: 'normal', fontWeight: '400' },
		},
	},
] )(
	'$label preserves forwarded trigger callbacks and its description',
	async ( { Component, label, description, props } ) => {
		const user = userEvent.setup();
		const onFocus = vi.fn();
		const onBlur = vi.fn();
		render(
			createElement( Component, {
				...props,
				size: 'small',
				onChange: vi.fn(),
				onFocus,
				onBlur,
			} )
		);
		const trigger = screen.getByRole( 'combobox', { name: label } );
		expect( trigger ).toHaveAccessibleDescription( description );
		await user.tab();
		expect( onFocus ).toHaveBeenCalledTimes( 1 );
		await user.tab();
		expect( onBlur ).toHaveBeenCalledTimes( 1 );
	}
);
