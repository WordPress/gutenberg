import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelect } from '@wordpress/data';
import RemoveBlockButton from '../remove-block-button';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
	useDispatch: vi.fn(),
} ) );

describe( 'RemoveBlockButton', () => {
	const removeBlocks = vi.fn();

	const setupSelectors = ( {
		canRemoveBlocks = true,
		shortcutRepresentation = 'Shift+Alt+Z',
	} = {} ) => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				canRemoveBlocks: () => canRemoveBlocks,
				getShortcutRepresentation: () => shortcutRepresentation,
			} ) )
		);
		useDispatch.mockReturnValue( { removeBlocks } );
	};

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should render an enabled button labelled "Delete" for a single block', () => {
		setupSelectors();

		render( <RemoveBlockButton clientIds={ [ 'block-1' ] } /> );

		const button = screen.getByRole( 'button', { name: 'Delete' } );
		expect( button ).toBeInTheDocument();
		expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'should remove the selected block when clicked', async () => {
		const user = userEvent.setup();
		setupSelectors();

		render( <RemoveBlockButton clientIds={ [ 'block-1' ] } /> );

		await user.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		expect( removeBlocks ).toHaveBeenCalledWith( [ 'block-1' ] );
	} );

	it( 'should show the removal keyboard shortcut in the tooltip', async () => {
		const user = userEvent.setup();
		setupSelectors();

		render( <RemoveBlockButton clientIds={ [ 'block-1' ] } /> );

		await user.hover( screen.getByRole( 'button', { name: 'Delete' } ) );

		expect( await screen.findByRole( 'tooltip' ) ).toHaveTextContent(
			'Shift+Alt+Z'
		);
	} );

	it( 'should label the button with the block count for a multi-selection', () => {
		setupSelectors();

		render(
			<RemoveBlockButton
				clientIds={ [ 'block-1', 'block-2', 'block-3' ] }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Delete 3 blocks' } )
		).toBeInTheDocument();
	} );

	it( 'should remove every selected block of a multi-selection when clicked', async () => {
		const user = userEvent.setup();
		setupSelectors();

		render( <RemoveBlockButton clientIds={ [ 'block-1', 'block-2' ] } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Delete 2 blocks' } )
		);

		expect( removeBlocks ).toHaveBeenCalledWith( [ 'block-1', 'block-2' ] );
	} );

	it( 'should render a focusable but disabled button when the block cannot be removed', async () => {
		const user = userEvent.setup();
		setupSelectors( { canRemoveBlocks: false } );

		render( <RemoveBlockButton clientIds={ [ 'block-1' ] } /> );

		const button = screen.getByRole( 'button', { name: 'Delete' } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( button );

		expect( removeBlocks ).not.toHaveBeenCalled();
	} );
} );
