import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '@wordpress/components';
import { dragHandle } from '@wordpress/icons';
import { GridItemHandle } from '../grid-item-handle';
import { GridItemDeleteHandle } from '../grid-item-delete-handle';

const removeBlock = vi.fn();

vi.mock( '@wordpress/data', async ( importOriginal ) => ( {
	...( await importOriginal< typeof import( '@wordpress/data' ) >() ),
	useDispatch: () => ( { removeBlock } ),
} ) );

describe( 'Grid item handles', () => {
	it( 'reaches only the Delete button from the keyboard', async () => {
		const user = userEvent.setup();
		render(
			<>
				<button>Before</button>
				<Toolbar label="Block handles">
					<GridItemHandle label="Drag" icon={ dragHandle } />
					<GridItemDeleteHandle clientId="block" />
				</Toolbar>
			</>
		);

		expect(
			screen.getByRole( 'toolbar', { name: 'Block handles' } )
		).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Before' } ) );
		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Delete' } )
		).toHaveFocus();

		await user.keyboard( '{ArrowLeft}' );
		expect(
			screen.getByRole( 'button', { name: 'Delete' } )
		).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( removeBlock ).toHaveBeenCalledWith( 'block', true );
	} );
} );
