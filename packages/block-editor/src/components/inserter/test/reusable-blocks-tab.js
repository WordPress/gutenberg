/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { ReusableBlocksTab } from '../reusable-blocks-tab';
import items, { categories, collections } from './fixtures';
import useBlockTypesState from '../hooks/use-block-types-state';

jest.mock( '../hooks/use-block-types-state', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( {} ),
	};
} );

const debouncedSpeak = jest.fn();

function InserterBlockList( props ) {
	return <ReusableBlocksTab debouncedSpeak={ debouncedSpeak } { ...props } />;
}

const initializeAllClosedMenuState = ( propOverrides ) => {
	const result = render( <InserterBlockList { ...propOverrides } /> );
	const activeTabs = result.container.querySelectorAll(
		'.components-panel__body.is-opened button.components-panel__body-toggle'
	);
	activeTabs.forEach( ( tab ) => {
		fireEvent.click( tab );
	} );
	return result;
};

const assertNoResultsMessageToBePresent = ( element ) => {
	const noResultsMessage = element.querySelector(
		'.block-editor-inserter__no-results'
	);
	expect( noResultsMessage.textContent ).toEqual( 'No results found.' );
};

const assertNoResultsMessageNotToBePresent = ( element ) => {
	const noResultsMessage = element.querySelector(
		'.block-editor-inserter__no-results'
	);
	expect( noResultsMessage ).toBe( null );
};

describe( 'InserterMenu', () => {
	beforeEach( () => {
		debouncedSpeak.mockClear();

		useBlockTypesState.mockImplementation( () => [
			items,
			categories,
			collections,
		] );

		useSelect.mockImplementation( () => false );
	} );

	it( 'should show nothing if there are no items', () => {
		const noItems = [];
		useBlockTypesState.mockImplementation( () => [
			noItems,
			categories,
			collections,
		] );
		const { container } = render(
			<InserterBlockList filterValue="random" />
		);
		const visibleBlocks = container.querySelector(
			'.block-editor-block-types-list__item'
		);

		expect( visibleBlocks ).toBe( null );

		assertNoResultsMessageToBePresent( container );
	} );

	it( 'should list reusable blocks', () => {
		const { container } = initializeAllClosedMenuState();
		const blocks = container.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].textContent ).toBe( 'My reusable block' );

		assertNoResultsMessageNotToBePresent( container );
	} );

	it( 'should allow searching for reusable blocks by title', () => {
		const { container } = render(
			<InserterBlockList filterValue="my reusable" />
		);

		const blocks = container.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( blocks ).toHaveLength( 1 );
		expect( debouncedSpeak ).toHaveBeenCalledWith( '1 result found.' );
		expect( blocks[ 0 ].textContent ).toBe( 'My reusable block' );

		assertNoResultsMessageNotToBePresent( container );
	} );

	it( 'should speak after any change in search term', () => {
		// The search result count should always be announced any time the user
		// changes the search term, even if it results in the same count.
		//
		// See: https://github.com/WordPress/gutenberg/pull/22279#discussion_r423317161
		const { rerender } = render(
			<InserterBlockList filterValue="my reusab" />
		);

		rerender( <InserterBlockList filterValue="my reusable" /> );
		rerender( <InserterBlockList filterValue="my reusable" /> );

		expect( debouncedSpeak ).toHaveBeenCalledTimes( 2 );
		expect( debouncedSpeak.mock.calls[ 0 ][ 0 ] ).toBe( '1 result found.' );
		expect( debouncedSpeak.mock.calls[ 1 ][ 0 ] ).toBe( '1 result found.' );
	} );

	it( 'should trim whitespace of search terms', () => {
		const { container } = render(
			<InserterBlockList filterValue=" my reusable" />
		);

		const blocks = container.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].textContent ).toBe( 'My reusable block' );

		assertNoResultsMessageNotToBePresent( container );
	} );
} );
