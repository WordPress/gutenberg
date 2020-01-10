/**
 * External dependencies
 */
import { noop } from 'lodash';
import TestUtils from 'react-dom/test-utils';
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import items, { categories, collections } from './fixtures';
import { InserterMenu } from '../menu';

const DEFAULT_PROPS = {
	position: 'top center',
	categories,
	collections,
	items,
	debouncedSpeak: noop,
	fetchReusableBlocks: noop,
	setTimeout: noop,
};

const getWrapperForProps = ( propOverrides ) => {
	return TestUtils.renderIntoDocument(
		<InserterMenu { ...DEFAULT_PROPS } { ...propOverrides } />
	);
};

const initializeMenuDefaultStateAndReturnElement = ( propOverrides ) => {
	const wrapper = getWrapperForProps( propOverrides );
	// eslint-disable-next-line react/no-find-dom-node
	return ReactDOM.findDOMNode( wrapper );
};

const initializeAllClosedMenuStateAndReturnElement = ( propOverrides ) => {
	const element = initializeMenuDefaultStateAndReturnElement( propOverrides );
	const activeTabs = element.querySelectorAll(
		'.components-panel__body.is-opened button.components-panel__body-toggle'
	);
	activeTabs.forEach( ( tab ) => {
		TestUtils.Simulate.click( tab );
	} );
	return element;
};

const assertNoResultsMessageToBePresent = ( element ) => {
	const noResultsMessage = element.querySelector(
		'.block-editor-inserter__no-results'
	);
	expect( noResultsMessage.textContent ).toEqual( 'No blocks found.' );
};

const assertNoResultsMessageNotToBePresent = ( element ) => {
	const noResultsMessage = element.querySelector(
		'.block-editor-inserter__no-results'
	);
	expect( noResultsMessage ).toBe( null );
};

const assertOpenedPanels = ( element, expectedOpen = 0 ) => {
	expect( element.querySelectorAll( '.components-panel__body.is-opened ' ) )
		.toHaveLength( expectedOpen );
};

const getTabButtonWithContent = ( element, content ) => {
	let foundButton;
	const buttons = element.querySelectorAll( '.components-button' );
	buttons.forEach( ( button ) => {
		if ( button.textContent === content ) {
			foundButton = button;
		}
	} );
	return foundButton;
};

const performSearchWithText = ( element, searchText ) => {
	const searchElement = element.querySelector( '.block-editor-inserter__search' );
	TestUtils.Simulate.change( searchElement, { target: { value: searchText } } );
};

describe( 'InserterMenu', () => {
	it( 'should show the suggested tab by default', () => {
		const element = initializeMenuDefaultStateAndReturnElement();
		const activeCategory = element.querySelector(
			'.components-panel__body.is-opened > .components-panel__body-title'
		);
		expect( activeCategory.textContent ).toBe( 'Most used' );
	} );

	it( 'should show nothing if there are no items', () => {
		const element = initializeMenuDefaultStateAndReturnElement(
			{ items: [] }
		);
		const visibleBlocks = element.querySelector(
			'.block-editor-block-types-list__item'
		);

		expect( visibleBlocks ).toBe( null );

		assertNoResultsMessageToBePresent( element );
	} );

	it( 'should show only high utility items in the suggested tab', () => {
		const element = initializeMenuDefaultStateAndReturnElement();
		const visibleBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks[ 0 ].textContent ).toEqual( 'Text' );
		expect( visibleBlocks[ 1 ].textContent ).toEqual( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].textContent ).toEqual( 'Some Other Block' );
	} );

	it( 'should limit the number of items shown in the suggested tab', () => {
		const element = initializeMenuDefaultStateAndReturnElement(
			{ maxSuggestedItems: 2 }
		);
		const visibleBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__list-item'
		);
		expect( visibleBlocks ).toHaveLength( 2 );
	} );

	it( 'should show items from the embed category in the embed tab', () => {
		const element = initializeAllClosedMenuStateAndReturnElement();
		const embedTab = getTabButtonWithContent( element, 'Embeds' );

		TestUtils.Simulate.click( embedTab );

		assertOpenedPanels( element, 1 );

		const visibleBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( visibleBlocks ).toHaveLength( 2 );
		expect( visibleBlocks[ 0 ].textContent ).toBe( 'YouTube' );
		expect( visibleBlocks[ 1 ].textContent ).toBe( 'A Text Embed' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should show reusable items in the reusable tab', () => {
		const element = initializeAllClosedMenuStateAndReturnElement();
		const reusableTab = getTabButtonWithContent( element, 'Reusable' );

		TestUtils.Simulate.click( reusableTab );

		assertOpenedPanels( element, 1 );

		const visibleBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( visibleBlocks ).toHaveLength( 1 );
		expect( visibleBlocks[ 0 ].textContent ).toBe( 'My reusable block' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should show the common category blocks', () => {
		const element = initializeAllClosedMenuStateAndReturnElement();
		const commonBlocksTab = getTabButtonWithContent( element, 'Common blocks' );

		TestUtils.Simulate.click( commonBlocksTab );

		assertOpenedPanels( element, 1 );

		const visibleBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks[ 0 ].textContent ).toBe( 'Text' );
		expect( visibleBlocks[ 1 ].textContent ).toBe( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].textContent ).toBe( 'Some Other Block' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should disable items with `isDisabled`', () => {
		const element = initializeMenuDefaultStateAndReturnElement();
		const layoutTab = getTabButtonWithContent( element, 'Layout elements' );

		TestUtils.Simulate.click( layoutTab );

		const disabledBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__item[disabled]'
		);

		expect( disabledBlocks ).toHaveLength( 1 );
		expect( disabledBlocks[ 0 ].textContent ).toBe( 'More' );
	} );

	it( 'should allow searching for items', () => {
		const element = initializeMenuDefaultStateAndReturnElement();
		performSearchWithText( element, 'text' );

		assertOpenedPanels( element, 3 );

		const matchingCategories = element.querySelectorAll(
			'.components-panel__body-toggle'
		);

		expect( matchingCategories ).toHaveLength( 3 );
		expect( matchingCategories[ 0 ].textContent ).toBe( 'Common blocks' );
		expect( matchingCategories[ 1 ].textContent ).toBe( 'Embeds' );

		const visibleBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( visibleBlocks ).toHaveLength( 5 );
		expect( visibleBlocks[ 0 ].textContent ).toBe( 'Text' );
		expect( visibleBlocks[ 1 ].textContent ).toBe( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].textContent ).toBe( 'A Text Embed' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should trim whitespace of search terms', () => {
		const element = initializeMenuDefaultStateAndReturnElement();
		performSearchWithText( element, ' text' );

		assertOpenedPanels( element, 3 );

		const matchingCategories = element.querySelectorAll(
			'.components-panel__body-toggle'
		);

		expect( matchingCategories ).toHaveLength( 3 );
		expect( matchingCategories[ 0 ].textContent ).toBe( 'Common blocks' );
		expect( matchingCategories[ 1 ].textContent ).toBe( 'Embeds' );

		const visibleBlocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( visibleBlocks ).toHaveLength( 5 );
		expect( visibleBlocks[ 0 ].textContent ).toBe( 'Text' );
		expect( visibleBlocks[ 1 ].textContent ).toBe( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].textContent ).toBe( 'A Text Embed' );

		assertNoResultsMessageNotToBePresent( element );
	} );
} );
