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
import { BlockTypesTab } from '../block-types-tab';
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
	return <BlockTypesTab debouncedSpeak={ debouncedSpeak } { ...props } />;
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

	it( 'should show items from the embed category in the embed tab', () => {
		const { container } = initializeAllClosedMenuState();
		const embedTabContent = container.querySelectorAll(
			'.block-editor-inserter__panel-content'
		)[ 3 ];
		const embedTabTitle = container.querySelectorAll(
			'.block-editor-inserter__panel-title'
		)[ 3 ];
		const blocks = embedTabContent.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( embedTabTitle.textContent ).toBe( 'Embeds' );
		expect( blocks ).toHaveLength( 2 );
		expect( blocks[ 0 ].textContent ).toBe( 'YouTube' );
		expect( blocks[ 1 ].textContent ).toBe( 'A Paragraph Embed' );

		assertNoResultsMessageNotToBePresent( container );
	} );

	it( 'should show the common category blocks', () => {
		const { container } = initializeAllClosedMenuState();
		const commonTabContent = container.querySelectorAll(
			'.block-editor-inserter__panel-content'
		)[ 0 ];
		const commonTabTitle = container.querySelectorAll(
			'.block-editor-inserter__panel-title'
		)[ 0 ];
		const blocks = commonTabContent.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( commonTabTitle.textContent ).toBe( 'Text' );
		expect( blocks ).toHaveLength( 3 );
		expect( blocks[ 0 ].textContent ).toBe( 'Paragraph' );
		expect( blocks[ 1 ].textContent ).toBe( 'Advanced Paragraph' );
		expect( blocks[ 2 ].textContent ).toBe( 'Some Other Block' );

		assertNoResultsMessageNotToBePresent( container );
	} );

	it( 'displays child blocks UI when root block has child blocks', () => {
		useSelect.mockImplementation( () => true );

		const { container } = render( <InserterBlockList /> );

		const childBlocksContent = container.querySelector(
			'.block-editor-inserter__child-blocks'
		);

		expect( childBlocksContent ).not.toBeNull();

		assertNoResultsMessageNotToBePresent( container );
	} );

	it( 'should disable items with `isDisabled`', () => {
		const { container } = initializeAllClosedMenuState();
		const layoutTabContent = container.querySelectorAll(
			'.block-editor-inserter__panel-content'
		)[ 1 ];
		const disabledBlocks = layoutTabContent.querySelectorAll(
			'.block-editor-block-types-list__item[disabled], .block-editor-block-types-list__item[aria-disabled="true"]'
		);

		expect( disabledBlocks ).toHaveLength( 1 );
		expect( disabledBlocks[ 0 ].textContent ).toBe( 'More' );
	} );

	it( 'should allow searching for items', () => {
		const { container } = render(
			<InserterBlockList filterValue="paragraph" />
		);

		const matchingCategories = container.querySelectorAll(
			'.block-editor-inserter__panel-title'
		);

		expect( matchingCategories ).toHaveLength( 3 );
		expect( matchingCategories[ 0 ].textContent ).toBe( 'Text' );
		expect( matchingCategories[ 1 ].textContent ).toBe( 'Embeds' );
		expect( matchingCategories[ 2 ].textContent ).toBe( 'Core' ); // "Core" namespace collection

		const blocks = container.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		// There are five buttons present for 3 total distinct results. The
		// additional two account for the collection results (repeated).
		expect( blocks ).toHaveLength( 5 );
		expect( debouncedSpeak ).toHaveBeenCalledWith( '3 results found.' );

		// Default block results.
		expect( blocks[ 0 ].textContent ).toBe( 'Paragraph' );
		expect( blocks[ 1 ].textContent ).toBe( 'Advanced Paragraph' );
		expect( blocks[ 2 ].textContent ).toBe( 'A Paragraph Embed' );

		// Collection results.
		expect( blocks[ 3 ].textContent ).toBe( 'Paragraph' );
		expect( blocks[ 4 ].textContent ).toBe( 'Advanced Paragraph' );

		assertNoResultsMessageNotToBePresent( container );
	} );

	it( 'should speak after any change in search term', () => {
		// The search result count should always be announced any time the user
		// changes the search term, even if it results in the same count.
		//
		// See: https://github.com/WordPress/gutenberg/pull/22279#discussion_r423317161
		const { rerender } = render(
			<InserterBlockList filterValue="Advanced Para" />
		);

		rerender( <InserterBlockList filterValue="Advanced Paragraph" /> );
		rerender( <InserterBlockList filterValue="Advanced Paragraph" /> );

		expect( debouncedSpeak ).toHaveBeenCalledTimes( 2 );
		expect( debouncedSpeak.mock.calls[ 0 ][ 0 ] ).toBe( '1 result found.' );
		expect( debouncedSpeak.mock.calls[ 1 ][ 0 ] ).toBe( '1 result found.' );
	} );

	it( 'should trim whitespace of search terms', () => {
		const { container } = render(
			<InserterBlockList filterValue=" paragraph" />
		);

		const matchingCategories = container.querySelectorAll(
			'.block-editor-inserter__panel-title'
		);

		expect( matchingCategories ).toHaveLength( 3 );
		expect( matchingCategories[ 0 ].textContent ).toBe( 'Text' );
		expect( matchingCategories[ 1 ].textContent ).toBe( 'Embeds' );

		const blocks = container.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( blocks ).toHaveLength( 5 );
		expect( blocks[ 0 ].textContent ).toBe( 'Paragraph' );
		expect( blocks[ 1 ].textContent ).toBe( 'Advanced Paragraph' );
		expect( blocks[ 2 ].textContent ).toBe( 'A Paragraph Embed' );

		assertNoResultsMessageNotToBePresent( container );
	} );
} );
