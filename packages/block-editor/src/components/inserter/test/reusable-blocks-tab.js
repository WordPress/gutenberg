/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { ReusableBlocksTab } from '../reusable-blocks-tab';
import items, { categories, collections } from './fixtures';
import useBlockTypesState from '../hooks/use-block-types-state';

jest.mock( '../hooks/use-block-types-state', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
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

describe( 'InserterMenu', () => {
	beforeAll( () => {
		registerBlockType( 'core/block', {
			save: () => {},
			title: 'reusable block',
			edit: () => {},
		} );
	} );
	afterAll( () => {
		unregisterBlockType( 'core/block' );
	} );
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
	} );

	it( 'should list reusable blocks', () => {
		const { container } = initializeAllClosedMenuState();
		const blocks = container.querySelectorAll(
			'.block-editor-block-types-list__item-title'
		);

		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].textContent ).toBe( 'My reusable block' );
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
	} );
} );
