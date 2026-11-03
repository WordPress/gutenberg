import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalStylesUI } from '../global-styles-ui';

globalThis.wpVitest.mockMatchMedia();

function renderApp( path: string ) {
	return render(
		<GlobalStylesUI
			value={ {} }
			baseValue={ {} }
			onChange={ () => {} }
			path={ path }
			onPathChange={ () => {} }
		/>
	);
}

function renderAt( path: string ) {
	return (
		<GlobalStylesUI
			value={ {} }
			baseValue={ {} }
			onChange={ () => {} }
			path={ path }
			onPathChange={ () => {} }
		/>
	);
}

describe( 'GlobalStylesUI Blocks screen', () => {
	it( 'preserves the search value and the filtered list when a block is opened and the user returns', () => {
		const { rerender } = renderApp( '/blocks' );

		const search = screen.getByRole( 'searchbox', { name: 'Search' } );
		fireEvent.change( search, { target: { value: 'Post' } } );

		expect( search ).toHaveValue( 'Post' );
		// No block or element matches "Post", so the empty list is shown.
		expect( screen.getByText( 'No results found.' ) ).toBeInTheDocument();

		// Opening a block unmounts the Blocks screen.
		rerender( renderAt( '/blocks/core/post-title' ) );
		expect(
			screen.queryByRole( 'searchbox', { name: 'Search' } )
		).not.toBeInTheDocument();

		// Returning remounts it with the same filter state.
		rerender( renderAt( '/blocks' ) );

		expect(
			screen.getByRole( 'searchbox', { name: 'Search' } )
		).toHaveValue( 'Post' );
		expect( screen.getByText( 'No results found.' ) ).toBeInTheDocument();
	} );

	it( 'preserves the style filter when a block is opened and the user returns', async () => {
		const user = userEvent.setup();
		const { rerender } = renderApp( '/blocks' );

		const filterButton = screen.getByRole( 'button', {
			name: 'Filter blocks',
		} );
		await user.click( filterButton );
		await user.click(
			await screen.findByRole( 'menuitemradio', { name: 'Customized' } )
		);

		expect( filterButton ).toHaveAttribute( 'aria-pressed', 'true' );

		rerender( renderAt( '/blocks/core/post-title' ) );
		rerender( renderAt( '/blocks' ) );

		expect(
			screen.getByRole( 'button', { name: 'Filter blocks' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );
} );
