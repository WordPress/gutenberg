import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { createRef, useState } from '@wordpress/element';
import { SearchInput } from '../index';
import * as Field from '../../field';

function ControlledSearchInput( {
	onValueChange,
	...restProps
}: React.ComponentProps< typeof SearchInput > ) {
	const [ value, setValue ] = useState( '' );

	return (
		<SearchInput
			{ ...restProps }
			value={ value }
			onValueChange={ ( nextValue, eventDetails ) => {
				setValue( nextValue );
				onValueChange?.( nextValue, eventDetails );
			} }
		/>
	);
}

describe( 'SearchInput', () => {
	it( 'forwards ref', async () => {
		const ref = createRef< HTMLInputElement >();

		await render( <SearchInput ref={ ref } /> );

		expect( ref.current ).toBe( screen.getByRole( 'searchbox' ) );
	} );

	it( 'is named "Search" by default', async () => {
		await render( <SearchInput /> );

		expect(
			screen.getByRole( 'searchbox', { name: 'Search' } )
		).toBeVisible();
	} );

	it( 'is named by a custom aria-label', async () => {
		await render( <SearchInput aria-label="Search posts" /> );

		expect(
			screen.getByRole( 'searchbox', { name: 'Search posts' } )
		).toBeVisible();
	} );

	it( 'is named by a Field.Label', async () => {
		await render(
			<Field.Root>
				<Field.Label>Search fonts</Field.Label>
				<SearchInput />
			</Field.Root>
		);

		expect(
			screen.getByRole( 'searchbox', { name: 'Search fonts' } )
		).toBeVisible();
	} );

	it( 'is named by a native label', async () => {
		await render(
			<>
				<label htmlFor="search-input">Search the library</label>
				<SearchInput id="search-input" />
			</>
		);

		expect(
			screen.getByRole( 'searchbox', { name: 'Search the library' } )
		).toBeVisible();
	} );

	describe.each( [
		[ 'Uncontrolled', SearchInput ],
		[ 'Controlled', ControlledSearchInput ],
	] )( '%s mode', ( _, Component ) => {
		it( 'resets the value and focuses the field', async () => {
			const onValueChange = vi.fn();
			await render( <Component onValueChange={ onValueChange } /> );

			const searchInput = screen.getByRole( 'searchbox' );
			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();

			await userEvent.type( searchInput, 'test' );
			expect( onValueChange ).toHaveBeenLastCalledWith(
				'test',
				expect.anything()
			);

			await userEvent.click(
				screen.getByRole( 'button', { name: 'Reset search' } )
			);
			expect( searchInput ).toHaveValue( '' );
			expect( searchInput ).toHaveFocus();
			expect( onValueChange ).toHaveBeenLastCalledWith(
				'',
				expect.anything()
			);
			expect(
				screen.queryByRole( 'button', { name: 'Reset search' } )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'shows the reset button for an initial value', async () => {
		await render( <SearchInput defaultValue="test" /> );

		expect(
			screen.getByRole( 'button', { name: 'Reset search' } )
		).toBeVisible();
	} );

	it( 'keeps a controlled value that the consumer does not update', async () => {
		const onValueChange = vi.fn();
		await render(
			<SearchInput value="test" onValueChange={ onValueChange } />
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Reset search' } )
		);

		expect( onValueChange ).toHaveBeenLastCalledWith(
			'',
			expect.anything()
		);
		expect( screen.getByRole( 'searchbox' ) ).toHaveValue( 'test' );
	} );

	it( 'updates the reset button after a form reset', async () => {
		await render(
			<form aria-label="Search form">
				<SearchInput defaultValue="test" />
			</form>
		);

		const searchInput = screen.getByRole( 'searchbox' );
		await userEvent.clear( searchInput );
		expect(
			screen.queryByRole( 'button', { name: 'Reset search' } )
		).not.toBeInTheDocument();

		( screen.getByRole( 'form' ) as HTMLFormElement ).reset();

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: 'Reset search' } )
			).toBeVisible()
		);
		expect( searchInput ).toHaveValue( 'test' );
	} );

	it.each( [
		[ 'disabled', () => <SearchInput defaultValue="test" disabled /> ],
		[ 'read-only', () => <SearchInput defaultValue="test" readOnly /> ],
		[
			'disabled through Field.Root',
			() => (
				<Field.Root disabled>
					<SearchInput defaultValue="test" />
				</Field.Root>
			),
		],
	] )( 'hides the reset button when %s', async ( _, renderElement ) => {
		await render( renderElement() );

		expect(
			screen.queryByRole( 'button', { name: 'Reset search' } )
		).not.toBeInTheDocument();
	} );
} );
