/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockSelectionClearer from '../';

const defaultUseSelectValues = {
	hasSelectedBlock: jest.fn().mockReturnValue( false ),
	hasMultiSelection: jest.fn().mockReturnValue( false ),
	getSettings: jest.fn().mockReturnValue( {
		clearBlockSelection: true,
	} ),
};

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'BlockSelectionClearer component', () => {
	it( 'should clear the selected block when a selected block exists', () => {
		const mockClearSelectedBlock = jest.fn();
		useSelect.mockImplementation( () => ( {
			...defaultUseSelectValues,
			hasSelectedBlock: jest.fn().mockReturnValue( true ),
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
		const mockClearSelectedBlock = jest.fn();
		useSelect.mockImplementation( () => ( {
			...defaultUseSelectValues,
			hasMultiSelection: jest.fn().mockReturnValue( true ),
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
		const mockClearSelectedBlock = jest.fn();
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
		const mockClearSelectedBlock = jest.fn();
		useSelect.mockImplementation( () => ( {
			...defaultUseSelectValues,
			hasSelectedBlock: jest.fn().mockReturnValue( true ),
			getSettings: jest.fn().mockReturnValue( {
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
