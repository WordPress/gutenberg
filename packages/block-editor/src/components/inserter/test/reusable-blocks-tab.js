/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

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

		render( <ReusableBlocksTab filterValue="random" /> );

		expect( screen.queryByRole( 'option' ) ).not.toBeInTheDocument();
	} );

	it( 'should list reusable blocks', () => {
		render( <ReusableBlocksTab /> );

		expect(
			screen.getByRole( 'option', { name: 'My reusable block' } )
		).toBeVisible();
	} );

	it( 'should trim whitespace of search terms', () => {
		render( <ReusableBlocksTab filterValue=" my reusable" /> );

		expect(
			screen.getByRole( 'option', { name: 'My reusable block' } )
		).toBeVisible();
	} );
} );
