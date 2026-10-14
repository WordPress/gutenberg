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
		props: {
			fontFamilies: [ { name: 'Serif', fontFamily: 'serif' } ],
			value: 'serif',
			describedBy: 'Choose the font family',
		},
	},
	{
		Component: FontAppearanceControl,
		label: 'Appearance',
		props: {
			value: { fontStyle: 'normal', fontWeight: '400' },
		},
	},
] )(
	'$label preserves forwarded trigger callbacks',
	async ( { Component, label, props } ) => {
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
		await user.tab();
		expect( trigger ).toHaveFocus();
		expect( onFocus ).toHaveBeenCalledTimes( 1 );
		await user.tab();
		expect( onBlur ).toHaveBeenCalledTimes( 1 );
	}
);

it( 'keeps the selected font hint visible and exposes it as an accessible description', () => {
	render(
		createElement( FontFamilyControl, {
			fontFamilies: [ { name: 'Serif', fontFamily: 'serif' } ],
			value: 'serif',
			onChange: vi.fn(),
			options: [
				{
					key: 'serif',
					name: 'Serif',
					hint: 'A font for body text',
				},
			],
			showSelectedHint: true,
			describedBy: 'Choose the font family',
		} )
	);
	const trigger = screen.getByRole( 'combobox', { name: 'Font' } );
	expect( trigger ).toHaveTextContent( 'Serif A font for body text' );
	expect( trigger ).toHaveAccessibleDescription(
		'Choose the font family A font for body text'
	);
	expect( screen.getByText( 'A font for body text' ) ).toHaveAttribute(
		'aria-hidden',
		'true'
	);
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
