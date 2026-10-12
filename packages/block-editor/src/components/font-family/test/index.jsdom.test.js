import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, useState } from '@wordpress/element';
import FontFamilyControl from '..';

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
