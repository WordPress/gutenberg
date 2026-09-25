import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import BlockSelectionClearer from '../';

const defaultUseSelectValues = {
	hasSelectedBlock: vi.fn().mockReturnValue( false ),
	hasMultiSelection: vi.fn().mockReturnValue( false ),
	getSettings: vi.fn().mockReturnValue( {
		clearBlockSelection: true,
	} ),
};

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: vi.fn(),
	useSelect: vi.fn(),
} ) );

describe( 'BlockSelectionClearer component', () => {
	beforeEach( () => {
		defaultUseSelectValues.hasSelectedBlock.mockReturnValue( false );
		defaultUseSelectValues.hasMultiSelection.mockReturnValue( false );
		defaultUseSelectValues.getSettings.mockReturnValue( {
			clearBlockSelection: true,
		} );
	} );

	it( 'should clear the selected block when a selected block exists', () => {
		const mockClearSelectedBlock = vi.fn();
		useSelect.mockImplementation( () => ( {
			...defaultUseSelectValues,
			hasSelectedBlock: vi.fn().mockReturnValue( true ),
		} ) );
		useDispatch.mockImplementation( () => ( {
			clearSelectedBlock: mockClearSelectedBlock,
		} ) );

		render(
			<BlockSelectionClearer data-testid="selection-clearer">
				<button>Not a block</button>
			</BlockSelectionClearer>
		);

		fireEvent.mouseDown( screen.getByTestId( 'selection-clearer' ) );

		expect( mockClearSelectedBlock ).toHaveBeenCalled();
	} );

	it( 'should clear the selected block when multiple blocks are selected', () => {
		const mockClearSelectedBlock = vi.fn();
		useSelect.mockImplementation( () => ( {
			...defaultUseSelectValues,
			hasMultiSelection: vi.fn().mockReturnValue( true ),
		} ) );
		useDispatch.mockImplementation( () => ( {
			clearSelectedBlock: mockClearSelectedBlock,
		} ) );

		render(
			<BlockSelectionClearer data-testid="selection-clearer">
				<button>Not a block</button>
			</BlockSelectionClearer>
		);

		fireEvent.mouseDown( screen.getByTestId( 'selection-clearer' ) );

		expect( mockClearSelectedBlock ).toHaveBeenCalled();
	} );

	it( 'should not clear the block selection when no blocks are selected', () => {
		const mockClearSelectedBlock = vi.fn();
		useSelect.mockImplementation( () => defaultUseSelectValues );
		useDispatch.mockImplementation( () => ( {
			clearSelectedBlock: mockClearSelectedBlock,
		} ) );

		render(
			<BlockSelectionClearer data-testid="selection-clearer">
				<button>Not a block</button>
			</BlockSelectionClearer>
		);

		fireEvent.mouseDown( screen.getByTestId( 'selection-clearer' ) );

		expect( mockClearSelectedBlock ).not.toHaveBeenCalled();
	} );

	it( 'should not clear the block selection when the feature is disabled', () => {
		const mockClearSelectedBlock = vi.fn();
		useSelect.mockImplementation( () => ( {
			...defaultUseSelectValues,
			hasSelectedBlock: vi.fn().mockReturnValue( true ),
			getSettings: vi.fn().mockReturnValue( {
				clearBlockSelection: false,
			} ),
		} ) );
		useDispatch.mockImplementation( () => ( {
			clearSelectedBlock: mockClearSelectedBlock,
		} ) );

		render(
			<BlockSelectionClearer data-testid="selection-clearer">
				<button>Not a block</button>
			</BlockSelectionClearer>
		);

		fireEvent.mouseDown( screen.getByTestId( 'selection-clearer' ) );

		expect( mockClearSelectedBlock ).not.toHaveBeenCalled();
	} );
} );
