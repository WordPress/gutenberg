import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSelect } from '@wordpress/data';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import ConvertToTemplatePart, {
	hasReusableBlockSupport,
} from '../convert-to-template-part';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

describe( 'hasReusableBlockSupport', () => {
	const testBlocks = [
		'test/default-block',
		'test/no-reusable-block',
		'test/explicit-reusable-block',
		'test/child-block-default',
		'test/child-block-explicit-reusable',
	];

	beforeEach( () => {
		registerBlockType( 'test/default-block', {
			title: 'Default Block',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			save: () => null,
		} );

		registerBlockType( 'test/no-reusable-block', {
			title: 'No Reusable Block',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			supports: {
				reusable: false,
			},
			save: () => null,
		} );

		registerBlockType( 'test/explicit-reusable-block', {
			title: 'Explicit Reusable Block',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			supports: {
				reusable: true,
			},
			save: () => null,
		} );

		registerBlockType( 'test/child-block-default', {
			title: 'Child Block Default',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			parent: [ 'test/default-block' ],
			save: () => null,
		} );

		registerBlockType( 'test/child-block-explicit-reusable', {
			title: 'Child Block Explicit Reusable',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			parent: [ 'test/default-block' ],
			supports: {
				reusable: true,
			},
			save: () => null,
		} );
	} );

	afterEach( () => {
		testBlocks.forEach( ( name ) => {
			if ( getBlockTypes().some( ( b ) => b.name === name ) ) {
				unregisterBlockType( name );
			}
		} );
	} );

	it( 'returns true for standard blocks without parent', () => {
		expect( hasReusableBlockSupport( 'test/default-block' ) ).toBe( true );
	} );

	it( 'returns false for blocks with supports.reusable = false', () => {
		expect( hasReusableBlockSupport( 'test/no-reusable-block' ) ).toBe(
			false
		);
	} );

	it( 'returns true for blocks with supports.reusable = true', () => {
		expect(
			hasReusableBlockSupport( 'test/explicit-reusable-block' )
		).toBe( true );
	} );

	it( 'returns false by default for child blocks with parent', () => {
		expect( hasReusableBlockSupport( 'test/child-block-default' ) ).toBe(
			false
		);
	} );

	it( 'returns true for child blocks with parent when supports.reusable = true', () => {
		expect(
			hasReusableBlockSupport( 'test/child-block-explicit-reusable' )
		).toBe( true );
	} );
} );

describe( 'ConvertToTemplatePart', () => {
	function mockSelectors( {
		isBlockTheme = true,
		canInsert = true,
		blocks = [] as any[],
	}: {
		isBlockTheme?: boolean;
		canInsert?: boolean;
		blocks?: any[];
	} ) {
		// @ts-expect-error Mocking useSelect
		useSelect.mockImplementation( ( mapSelect ) => {
			return mapSelect( ( store: any ) => {
				const storeName = store?.name || store;
				if ( storeName === 'core' ) {
					return {
						getCurrentTheme: () => ( {
							is_block_theme: isBlockTheme,
						} ),
					};
				}
				if ( storeName === 'core/block-editor' ) {
					return {
						getBlockRootClientId: () => 'root-client-id',
						canInsertBlockType: () => canInsert,
						getBlocksByClientId: () => blocks,
					};
				}
				return {};
			} );
		} );
	}

	it( 'does not render when theme is not block-based', () => {
		const blocks = [
			{
				clientId: '1',
				name: 'core/paragraph',
				isValid: true,
			},
		];
		mockSelectors( {
			isBlockTheme: false,
			canInsert: true,
			blocks,
		} );

		render(
			<ConvertToTemplatePart clientIds={ [ '1' ] } blocks={ blocks } />
		);
		expect(
			screen.queryByRole( 'menuitem', { name: 'Create template part' } )
		).not.toBeInTheDocument();
	} );

	it( 'does not render when canInsertBlockType is false', () => {
		const blocks = [
			{
				clientId: '1',
				name: 'core/paragraph',
				isValid: true,
			},
		];
		mockSelectors( {
			isBlockTheme: true,
			canInsert: false,
			blocks,
		} );

		render(
			<ConvertToTemplatePart clientIds={ [ '1' ] } blocks={ blocks } />
		);
		expect(
			screen.queryByRole( 'menuitem', { name: 'Create template part' } )
		).not.toBeInTheDocument();
	} );

	it( 'does not render when no blocks are selected', () => {
		mockSelectors( {
			isBlockTheme: true,
			canInsert: true,
			blocks: [],
		} );

		render( <ConvertToTemplatePart clientIds={ [] } blocks={ [] } /> );
		expect(
			screen.queryByRole( 'menuitem', { name: 'Create template part' } )
		).not.toBeInTheDocument();
	} );

	it( 'does not render when a selected block has supports.reusable = false', () => {
		registerBlockType( 'test/non-reusable', {
			title: 'Non Reusable',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			supports: { reusable: false },
			save: () => null,
		} );

		const blocks = [
			{
				clientId: '1',
				name: 'test/non-reusable',
				isValid: true,
			},
		];
		mockSelectors( {
			isBlockTheme: true,
			canInsert: true,
			blocks,
		} );

		render(
			<ConvertToTemplatePart clientIds={ [ '1' ] } blocks={ blocks } />
		);
		expect(
			screen.queryByRole( 'menuitem', { name: 'Create template part' } )
		).not.toBeInTheDocument();

		unregisterBlockType( 'test/non-reusable' );
	} );

	it( 'does not render when one of multiple selected blocks has supports.reusable = false', () => {
		registerBlockType( 'test/non-reusable-multi', {
			title: 'Non Reusable Multi',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			supports: { reusable: false },
			save: () => null,
		} );
		registerBlockType( 'test/valid-block', {
			title: 'Valid Block',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			save: () => null,
		} );

		const blocks = [
			{
				clientId: '1',
				name: 'test/valid-block',
				isValid: true,
			},
			{
				clientId: '2',
				name: 'test/non-reusable-multi',
				isValid: true,
			},
		];
		mockSelectors( {
			isBlockTheme: true,
			canInsert: true,
			blocks,
		} );

		render(
			<ConvertToTemplatePart
				clientIds={ [ '1', '2' ] }
				blocks={ blocks }
			/>
		);
		expect(
			screen.queryByRole( 'menuitem', { name: 'Create template part' } )
		).not.toBeInTheDocument();

		unregisterBlockType( 'test/non-reusable-multi' );
		unregisterBlockType( 'test/valid-block' );
	} );

	it( 'renders menu item when all selected blocks support reusable and insertion is allowed', () => {
		registerBlockType( 'test/valid-block-render', {
			title: 'Valid Block Render',
			apiVersion: 3,
			category: 'text',
			attributes: {},
			save: () => null,
		} );

		const blocks = [
			{
				clientId: '1',
				name: 'test/valid-block-render',
				isValid: true,
			},
		];
		mockSelectors( {
			isBlockTheme: true,
			canInsert: true,
			blocks,
		} );

		render(
			<ConvertToTemplatePart clientIds={ [ '1' ] } blocks={ blocks } />
		);
		expect(
			screen.getByRole( 'menuitem', { name: 'Create template part' } )
		).toBeInTheDocument();

		unregisterBlockType( 'test/valid-block-render' );
	} );
} );
