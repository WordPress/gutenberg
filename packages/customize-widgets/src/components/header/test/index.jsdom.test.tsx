import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Header from '..';

vi.mock( import( '../../inserter' ), () => ( {
	default: () => <></>,
} ) );

function createSidebar( { hasUndo = false, hasRedo = false } = {} ) {
	const listeners = new Set< () => void >();
	const sidebar = {
		hasUndo: vi.fn( () => hasUndo ),
		hasRedo: vi.fn( () => hasRedo ),
		undo: vi.fn(),
		redo: vi.fn(),
		subscribeHistory: vi.fn( ( listener: () => void ) => {
			listeners.add( listener );
			return () => listeners.delete( listener );
		} ),
		setHistory( next: { hasUndo: boolean; hasRedo: boolean } ) {
			sidebar.hasUndo.mockImplementation( () => next.hasUndo );
			sidebar.hasRedo.mockImplementation( () => next.hasRedo );
			listeners.forEach( ( listener ) => listener() );
		},
	};
	return sidebar;
}

function renderHeader( sidebar: ReturnType< typeof createSidebar > ) {
	return render(
		<Header
			sidebar={ sidebar }
			inserter={ {
				contentContainer: [ document.createElement( 'div' ) ],
			} }
			isInserterOpened={ false }
			setIsInserterOpened={ vi.fn() }
			isFixedToolbarActive={ false }
		/>
	);
}

describe( 'Header', () => {
	it( 'keeps the undo and redo buttons focusable when there is nothing to undo or redo', async () => {
		const user = userEvent.setup();
		const sidebar = createSidebar();
		renderHeader( sidebar );

		const undoButton = screen.getByRole( 'button', { name: 'Undo' } );
		const redoButton = screen.getByRole( 'button', { name: 'Redo' } );

		expect( undoButton ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( undoButton ).toBeEnabled();
		expect( redoButton ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( redoButton ).toBeEnabled();

		await user.click( undoButton );
		await user.click( redoButton );
		expect( sidebar.undo ).not.toHaveBeenCalled();
		expect( sidebar.redo ).not.toHaveBeenCalled();

		// The disabled buttons still take part in the toolbar navigation.
		await user.tab();
		expect( undoButton ).toHaveFocus();
		await user.keyboard( '{ArrowRight}' );
		expect( redoButton ).toHaveFocus();
		await user.keyboard( '{ArrowRight}' );
		expect(
			screen.getByRole( 'button', { name: 'Add block' } )
		).toHaveFocus();
		await user.keyboard( '{ArrowRight}' );
		expect(
			screen.getByRole( 'button', { name: 'Options' } )
		).toHaveFocus();
	} );

	it( 'undoes and redoes changes when there is history', async () => {
		const user = userEvent.setup();
		const sidebar = createSidebar( { hasUndo: true, hasRedo: true } );
		renderHeader( sidebar );

		const undoButton = screen.getByRole( 'button', { name: 'Undo' } );
		const redoButton = screen.getByRole( 'button', { name: 'Redo' } );

		expect( undoButton ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( redoButton ).not.toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( undoButton );
		expect( sidebar.undo ).toHaveBeenCalledTimes( 1 );
		await user.click( redoButton );
		expect( sidebar.redo ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'updates the undo and redo buttons when the history changes', () => {
		const sidebar = createSidebar();
		renderHeader( sidebar );

		const undoButton = screen.getByRole( 'button', { name: 'Undo' } );
		const redoButton = screen.getByRole( 'button', { name: 'Redo' } );

		act( () => {
			sidebar.setHistory( { hasUndo: true, hasRedo: false } );
		} );
		expect( undoButton ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( redoButton ).toHaveAttribute( 'aria-disabled', 'true' );

		act( () => {
			sidebar.setHistory( { hasUndo: false, hasRedo: true } );
		} );
		expect( undoButton ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( redoButton ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
