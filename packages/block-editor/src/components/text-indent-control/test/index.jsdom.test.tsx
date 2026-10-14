import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextIndentControl from '../index';

globalThis.wpVitest.mockMatchMedia();

vi.mock(
	import( '../../spacing-sizes-control/hooks/use-spacing-sizes' ),
	() => ( {
		__esModule: true,
		default: vi.fn( () => [
			{ name: 'None', slug: '0', size: 0 },
			{ name: 'Small', slug: '20', size: '0.5rem' },
			{ name: 'Medium', slug: '40', size: '1rem' },
			{ name: 'Large', slug: '60', size: '1.5rem' },
			{ name: 'X-Large', slug: '80', size: '2rem' },
		] ),
	} )
);

vi.mock( import( '../../use-settings' ), () => ( {
	useSettings: vi.fn( ( ...keys: string[] ) =>
		keys.map( ( key ) =>
			key === 'spacing.units' ? [ 'px', 'em', 'rem' ] : undefined
		)
	),
} ) );

describe( 'TextIndentControl', () => {
	const onChange = vi.fn();

	beforeEach( () => {
		onChange.mockClear();
	} );

	it( 'renders a spacing preset value on the preset slider', () => {
		render(
			<TextIndentControl
				value="var:preset|spacing|40"
				onChange={ onChange }
			/>
		);

		expect(
			screen.getByRole( 'slider', { name: 'Line indent' } )
		).toHaveValue( '2' );
		expect(
			screen.queryByRole( 'spinbutton', { name: 'Line indent' } )
		).not.toBeInTheDocument();
	} );

	it( 'saves a spacing preset when the preset slider changes', () => {
		render( <TextIndentControl onChange={ onChange } /> );

		fireEvent.change(
			screen.getByRole( 'slider', { name: 'Line indent' } ),
			{ target: { value: 3 } }
		);

		expect( onChange ).toHaveBeenLastCalledWith( 'var:preset|spacing|60' );
	} );

	it( 'renders a custom value in the custom value input', () => {
		render( <TextIndentControl value="3em" onChange={ onChange } /> );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Line indent' } )
		).toHaveValue( 3 );
	} );

	it( 'saves a custom value after switching to custom value mode', async () => {
		const user = userEvent.setup();
		render( <TextIndentControl onChange={ onChange } /> );

		await user.click( screen.getByLabelText( 'Set custom value' ) );
		const input = screen.getByRole( 'spinbutton', { name: 'Line indent' } );
		await user.type( input, '24' );

		expect( onChange ).toHaveBeenLastCalledWith( '24px' );
	} );
} );
