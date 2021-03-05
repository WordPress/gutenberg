/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

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
	return (
		<BlockTypesTab
			debouncedSpeak={ debouncedSpeak }
			onHover={ () => {} }
			{ ...props }
		/>
	);
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

describe( 'InserterMenu', () => {
	beforeAll( () => {
		items.forEach( ( item ) => {
			registerBlockType( item.name, {
				save: () => {},
				title: item.name,
				edit: () => {},
			} );
		} );
	} );
	afterAll( () => {
		items.forEach( ( item ) => {
			unregisterBlockType( item.name );
		} );
	} );
	beforeEach( () => {
		debouncedSpeak.mockClear();

		useBlockTypesState.mockImplementation( () => [
			items,
			categories,
			collections,
		] );
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
} );
