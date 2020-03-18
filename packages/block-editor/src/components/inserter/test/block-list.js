/**
 * External dependencies
 */
import TestUtils, { act } from 'react-dom/test-utils';
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import InserterBlockList from '../block-list';
import useSelect from '../../../../../data/src/components/use-select';
import items, { categories, collections } from './fixtures';

jest.mock( '../../../../../data/src/components/use-select', () => {
	// This allows us to tweaak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

jest.mock( '../../../../../data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( {} ),
	};
} );

const getWrapperForProps = ( propOverrides ) => {
	let wrapper;
	act( () => {
		wrapper = TestUtils.renderIntoDocument(
			<InserterBlockList { ...propOverrides } />
		);
	} );

	return wrapper;
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
	expect(
		element.querySelectorAll( '.components-panel__body.is-opened ' )
	).toHaveLength( expectedOpen );
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

describe( 'InserterMenu', () => {
	beforeEach( () => {
		useSelect.mockImplementation( () => ( {
			categories,
			collections,
			items,
		} ) );
	} );

	it( 'should show the suggested tab by default', () => {
		const element = initializeMenuDefaultStateAndReturnElement();
		const activeCategory = element.querySelector(
			'.components-panel__body.is-opened > .components-panel__body-title'
		);
		expect( activeCategory.textContent ).toBe( 'Most used' );
	} );

	it( 'should show nothing if there are no items', () => {
		const noItems = [];
		useSelect.mockImplementation( () => ( {
			categories,
			collections,
			items: noItems,
		} ) );
		const element = initializeMenuDefaultStateAndReturnElement();
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
		const commonBlocksTab = getTabButtonWithContent(
			element,
			'Common blocks'
		);

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
			'.block-editor-block-types-list__item[disabled], .block-editor-block-types-list__item[aria-disabled="true"]'
		);

		expect( disabledBlocks ).toHaveLength( 1 );
		expect( disabledBlocks[ 0 ].textContent ).toBe( 'More' );
	} );

	it( 'should allow searching for items', () => {
		const element = initializeMenuDefaultStateAndReturnElement( {
			filterValue: 'text',
		} );

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
		const element = initializeMenuDefaultStateAndReturnElement( {
			filterValue: ' text',
		} );

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
