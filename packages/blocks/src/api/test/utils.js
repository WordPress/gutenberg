/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import { getBlockTypes, unregisterBlockType, registerBlockType, setDefaultBlockName } from '../registration';
import {
	isUnmodifiedDefaultBlock,
	getAccessibleBlockLabel,
	getBlockLabel,
} from '../utils';

describe( 'block helpers', () => {
	beforeAll( () => {
		// Initialize the block store
		require( '../../store' );
	} );

	afterEach( () => {
		setDefaultBlockName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'isUnmodifiedDefaultBlock()', () => {
		it( 'should return true if the default block is unmodified', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					align: {
						type: 'string',
					},
					includesDefault: {
						type: 'boolean',
						default: true,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			setDefaultBlockName( 'core/test-block' );
			const unmodifiedBlock = createBlock( 'core/test-block' );
			expect( isUnmodifiedDefaultBlock( unmodifiedBlock ) ).toBe( true );
		} );

		it( 'should return false if the default block is updated', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					align: {
						type: 'string',
					},
					includesDefault: {
						type: 'boolean',
						default: true,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			setDefaultBlockName( 'core/test-block' );
			const block = createBlock( 'core/test-block' );
			block.attributes.align = 'left';

			expect( isUnmodifiedDefaultBlock( block ) ).toBe( false );
		} );

		it( 'should invalidate cache if the default block name changed', () => {
			registerBlockType( 'core/test-block1', {
				attributes: {
					includesDefault1: {
						type: 'boolean',
						default: true,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block2', {
				attributes: {
					includesDefault2: {
						type: 'boolean',
						default: true,
					},
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			setDefaultBlockName( 'core/test-block1' );
			isUnmodifiedDefaultBlock( createBlock( 'core/test-block1' ) );
			setDefaultBlockName( 'core/test-block2' );
			expect( isUnmodifiedDefaultBlock( createBlock( 'core/test-block2' ) ) ).toBe( true );
		} );
	} );
} );

describe( 'getBlockLabel', () => {
	it( 'returns only the block title when the block has no `getLabel` function', () => {
		const blockType = { title: 'Recipe' };
		const attributes = {};

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Recipe' );
	} );

	it( 'returns only the block title when the block has a `getLabel` function, but it returns a falsey value', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: () => '' };
		const attributes = {};

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Recipe' );
	} );

	it( 'returns the block title with the label when the `getLabel` function returns a value', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: ( { heading } ) => heading };
		const attributes = { heading: 'Cupcakes!' };

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Cupcakes!' );
	} );

	it( 'removes any html elements from the output of the `getLabel` function', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: ( { heading } ) => heading };
		const attributes = { heading: '<b><span class="my-class">Cupcakes!</span></b>' };

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Cupcakes!' );
	} );
} );

describe( 'getAccessibleBlockLabel', () => {
	it( 'returns only the block title when the block has no `getLabel` function', () => {
		const blockType = { title: 'Recipe' };
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe( 'Recipe Block' );
	} );

	it( 'returns only the block title when the block has a `getLabel` function, but it returns a falsey value', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: () => '' };
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe( 'Recipe Block' );
	} );

	it( 'returns the block title with the label when the `getLabel` function returns a value', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: ( { heading } ) => heading };
		const attributes = { heading: 'Cupcakes!' };

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe( 'Recipe Block. Cupcakes!' );
	} );

	it( 'removes any html elements from the output of the `getLabel` function', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: ( { heading } ) => heading };
		const attributes = { heading: '<b><span class="my-class">Cupcakes!</span></b>' };

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe( 'Recipe Block. Cupcakes!' );
	} );

	it( 'outputs the block title and label with a row number indicating the position of the block, when the optional third parameter is provided', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: ( { heading } ) => heading };
		const attributes = { heading: 'Cupcakes!' };

		expect( getAccessibleBlockLabel( blockType, attributes, 3 ) ).toBe( 'Recipe Block. Row 3. Cupcakes!' );
	} );

	it( 'outputs just the block title and row number when there no label is available for the block', () => {
		const blockType = { title: 'Recipe' };
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes, 3 ) ).toBe( 'Recipe Block. Row 3' );
	} );
} );

