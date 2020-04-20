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

describe( 'InserterMenu', () => {
	beforeEach( () => {
		useSelect.mockImplementation( () => ( {
			categories,
			collections,
			items,
		} ) );
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
		const firstPanel = element.querySelector(
			'.block-editor-inserter__panel-content'
		);
		const visibleBlocks = firstPanel.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks[ 0 ].textContent ).toEqual( 'Text' );
		expect( visibleBlocks[ 1 ].textContent ).toEqual( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].textContent ).toEqual( 'Some Other Block' );
	} );

	it( 'should show items from the embed category in the embed tab', () => {
		const element = initializeAllClosedMenuStateAndReturnElement();
		const embedTabContent = element.querySelectorAll(
			'.block-editor-inserter__panel-content'
		)[ 4 ];
		const embedTabTitle = element.querySelectorAll(
			'.block-editor-inserter__panel-title'
		)[ 4 ];
		const blocks = embedTabContent.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( embedTabTitle.textContent ).toBe( 'Embeds' );
		expect( blocks ).toHaveLength( 2 );
		expect( blocks[ 0 ].textContent ).toBe( 'YouTube' );
		expect( blocks[ 1 ].textContent ).toBe( 'A Text Embed' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should show reusable items in the reusable tab', () => {
		const element = initializeAllClosedMenuStateAndReturnElement();
		const reusableTabContent = element.querySelectorAll(
			'.block-editor-inserter__panel-content'
		)[ 6 ];
		const reusableTabTitle = element.querySelectorAll(
			'.block-editor-inserter__panel-title'
		)[ 6 ];
		const blocks = reusableTabContent.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( reusableTabTitle.textContent ).toBe( 'Reusable' );
		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].textContent ).toBe( 'My reusable block' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should show the common category blocks', () => {
		const element = initializeAllClosedMenuStateAndReturnElement();
		const commonTabContent = element.querySelectorAll(
			'.block-editor-inserter__panel-content'
		)[ 1 ];
		const commonTabTitle = element.querySelectorAll(
			'.block-editor-inserter__panel-title'
		)[ 1 ];
		const blocks = commonTabContent.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( commonTabTitle.textContent ).toBe( 'Common blocks' );
		expect( blocks ).toHaveLength( 3 );
		expect( blocks[ 0 ].textContent ).toBe( 'Text' );
		expect( blocks[ 1 ].textContent ).toBe( 'Advanced Text' );
		expect( blocks[ 2 ].textContent ).toBe( 'Some Other Block' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should disable items with `isDisabled`', () => {
		const element = initializeAllClosedMenuStateAndReturnElement();
		const layoutTabContent = element.querySelectorAll(
			'.block-editor-inserter__panel-content'
		)[ 2 ];
		const disabledBlocks = layoutTabContent.querySelectorAll(
			'.block-editor-block-types-list__item[disabled], .block-editor-block-types-list__item[aria-disabled="true"]'
		);

		expect( disabledBlocks ).toHaveLength( 1 );
		expect( disabledBlocks[ 0 ].textContent ).toBe( 'More' );
	} );

	it( 'should allow searching for items', () => {
		const element = initializeMenuDefaultStateAndReturnElement( {
			filterValue: 'text',
		} );

		const matchingCategories = element.querySelectorAll(
			'.block-editor-inserter__panel-title'
		);

		expect( matchingCategories ).toHaveLength( 3 );
		expect( matchingCategories[ 0 ].textContent ).toBe( 'Common blocks' );
		expect( matchingCategories[ 1 ].textContent ).toBe( 'Embeds' );

		const blocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( blocks ).toHaveLength( 5 );
		expect( blocks[ 0 ].textContent ).toBe( 'Text' );
		expect( blocks[ 1 ].textContent ).toBe( 'Advanced Text' );
		expect( blocks[ 2 ].textContent ).toBe( 'A Text Embed' );

		assertNoResultsMessageNotToBePresent( element );
	} );

	it( 'should trim whitespace of search terms', () => {
		const element = initializeMenuDefaultStateAndReturnElement( {
			filterValue: ' text',
		} );

		const matchingCategories = element.querySelectorAll(
			'.block-editor-inserter__panel-title'
		);

		expect( matchingCategories ).toHaveLength( 3 );
		expect( matchingCategories[ 0 ].textContent ).toBe( 'Common blocks' );
		expect( matchingCategories[ 1 ].textContent ).toBe( 'Embeds' );

		const blocks = element.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( blocks ).toHaveLength( 5 );
		expect( blocks[ 0 ].textContent ).toBe( 'Text' );
		expect( blocks[ 1 ].textContent ).toBe( 'Advanced Text' );
		expect( blocks[ 2 ].textContent ).toBe( 'A Text Embed' );

		assertNoResultsMessageNotToBePresent( element );
	} );
} );
