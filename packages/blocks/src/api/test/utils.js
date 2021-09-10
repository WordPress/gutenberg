/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	setDefaultBlockName,
} from '../registration';
import {
	isUnmodifiedDefaultBlock,
	getAccessibleBlockLabel,
	getBlockLabel,
	__experimentalSanitizeBlockAttributes,
	__experimentalGetBlockAttributesNamesByRole,
	__experimentalStripInternalBlockAttributes,
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
				category: 'text',
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
				category: 'text',
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
				category: 'text',
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
				category: 'text',
				title: 'test block',
			} );
			setDefaultBlockName( 'core/test-block1' );
			isUnmodifiedDefaultBlock( createBlock( 'core/test-block1' ) );
			setDefaultBlockName( 'core/test-block2' );
			expect(
				isUnmodifiedDefaultBlock( createBlock( 'core/test-block2' ) )
			).toBe( true );
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
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading } ) => heading,
		};
		const attributes = { heading: 'Cupcakes!' };

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Cupcakes!' );
	} );

	it( 'removes any html elements from the output of the `getLabel` function', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading } ) => heading,
		};
		const attributes = {
			heading: '<b><span class="my-class">Cupcakes!</span></b>',
		};

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Cupcakes!' );
	} );
} );

describe( 'getAccessibleBlockLabel', () => {
	it( 'returns only the block title when the block has no `getLabel` function', () => {
		const blockType = { title: 'Recipe' };
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe(
			'Recipe Block'
		);
	} );

	it( 'returns only the block title when the block has a `getLabel` function, but it returns a falsey value', () => {
		const blockType = { title: 'Recipe', __experimentalLabel: () => '' };
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe(
			'Recipe Block'
		);
	} );

	it( 'returns the block title with the label when the `getLabel` function returns a value', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading } ) => heading,
		};
		const attributes = { heading: 'Cupcakes!' };

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe(
			'Recipe Block. Cupcakes!'
		);
	} );

	it( 'removes any html elements from the output of the `getLabel` function', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading } ) => heading,
		};
		const attributes = {
			heading: '<b><span class="my-class">Cupcakes!</span></b>',
		};

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe(
			'Recipe Block. Cupcakes!'
		);
	} );

	it( 'outputs the block title and label with a row number indicating the position of the block, when the optional third parameter is provided', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading } ) => heading,
		};
		const attributes = { heading: 'Cupcakes!' };

		expect( getAccessibleBlockLabel( blockType, attributes, 3 ) ).toBe(
			'Recipe Block. Row 3. Cupcakes!'
		);
	} );

	it( 'outputs just the block title and row number when there no label is available for the block', () => {
		const blockType = { title: 'Recipe' };
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes, 3 ) ).toBe(
			'Recipe Block. Row 3'
		);
	} );
} );

describe( 'sanitizeBlockAttributes', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'sanitize block attributes not defined in the block type', () => {
		registerBlockType( 'core/test-block', {
			attributes: {
				defined: {
					type: 'string',
				},
			},
			title: 'Test block',
		} );

		const attributes = __experimentalSanitizeBlockAttributes(
			'core/test-block',
			{
				defined: 'defined-attribute',
				notDefined: 'not-defined-attribute',
			}
		);

		expect( attributes ).toEqual( {
			defined: 'defined-attribute',
		} );
	} );

	it( 'throws error if the block is not registered', () => {
		expect( () => {
			__experimentalSanitizeBlockAttributes(
				'core/not-registered-test-block',
				{}
			);
		} ).toThrowErrorMatchingInlineSnapshot(
			`"Block type 'core/not-registered-test-block' is not registered."`
		);
	} );

	it( 'handles undefined values and default values', () => {
		registerBlockType( 'core/test-block', {
			attributes: {
				hasDefaultValue: {
					type: 'string',
					default: 'default-value',
				},
				noDefaultValue: {
					type: 'string',
				},
			},
			title: 'Test block',
		} );

		const attributes = __experimentalSanitizeBlockAttributes(
			'core/test-block',
			{}
		);

		expect( attributes ).toEqual( {
			hasDefaultValue: 'default-value',
		} );
	} );

	it( 'handles node and children sources as arrays', () => {
		registerBlockType( 'core/test-block', {
			attributes: {
				nodeContent: {
					source: 'node',
				},
				childrenContent: {
					source: 'children',
				},
				withDefault: {
					source: 'children',
					default: 'test',
				},
			},
			title: 'Test block',
		} );

		const attributes = __experimentalSanitizeBlockAttributes(
			'core/test-block',
			{
				nodeContent: [ 'test-1', 'test-2' ],
			}
		);

		expect( attributes ).toEqual( {
			nodeContent: [ 'test-1', 'test-2' ],
			childrenContent: [],
			withDefault: [ 'test' ],
		} );
	} );
} );

describe( '__experimentalGetBlockAttributesNamesByRole', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block-1', {
			attributes: {
				align: {
					type: 'string',
				},
				content: {
					type: 'boolean',
					__experimentalRole: 'content',
				},
				level: {
					type: 'number',
					__experimentalRole: 'content',
				},
				color: {
					type: 'string',
					__experimentalRole: 'other',
				},
			},
			save: noop,
			category: 'text',
			title: 'test block 1',
		} );
		registerBlockType( 'core/test-block-2', {
			attributes: {
				align: { type: 'string' },
				content: { type: 'boolean' },
				color: { type: 'string' },
			},
			save: noop,
			category: 'text',
			title: 'test block 2',
		} );
		registerBlockType( 'core/test-block-3', {
			save: noop,
			category: 'text',
			title: 'test block 3',
		} );
	} );
	afterAll( () => {
		[
			'core/test-block-1',
			'core/test-block-2',
			'core/test-block-3',
		].forEach( unregisterBlockType );
	} );
	it( 'should return empty array if block has no attributes', () => {
		expect(
			__experimentalGetBlockAttributesNamesByRole( 'core/test-block-3' )
		).toEqual( [] );
	} );
	it( 'should return all attribute names if no role is provided', () => {
		expect(
			__experimentalGetBlockAttributesNamesByRole( 'core/test-block-1' )
		).toEqual(
			expect.arrayContaining( [ 'align', 'content', 'level', 'color' ] )
		);
	} );
	it( 'should return proper results with existing attributes and provided role', () => {
		expect(
			__experimentalGetBlockAttributesNamesByRole(
				'core/test-block-1',
				'content'
			)
		).toEqual( expect.arrayContaining( [ 'content', 'level' ] ) );
		expect(
			__experimentalGetBlockAttributesNamesByRole(
				'core/test-block-1',
				'other'
			)
		).toEqual( [ 'color' ] );
		expect(
			__experimentalGetBlockAttributesNamesByRole(
				'core/test-block-1',
				'not-exists'
			)
		).toEqual( [] );
		// A block with no `role` in any attributes.
		expect(
			__experimentalGetBlockAttributesNamesByRole(
				'core/test-block-2',
				'content'
			)
		).toEqual( [] );
	} );
} );

describe( '__experimentalStripInternalBlockAttributes', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block-with-internal-attrs', {
			attributes: {
				align: {
					type: 'string',
				},
				internalData: {
					type: 'boolean',
					__experimentalRole: 'internal',
				},
				productId: {
					type: 'number',
					__experimentalRole: 'internal',
				},
				color: {
					type: 'string',
					__experimentalRole: 'other',
				},
			},
			save: noop,
			category: 'text',
			title: 'test block with internal attrs',
		} );
		registerBlockType( 'core/test-block-with-no-internal-attrs', {
			attributes: {
				align: { type: 'string' },
				color: { type: 'string' },
			},
			save: noop,
			category: 'text',
			title: 'test block with no internal attrs',
		} );
		registerBlockType( 'core/test-block-with-no-attrs', {
			save: noop,
			category: 'text',
			title: 'test block with no attrs',
		} );
	} );
	afterAll( () => {
		[
			'core/test-block-with-internal-attrs',
			'core/test-block-with-no-internal-attrs',
			'core/test-block-with-no-attrs',
		].forEach( unregisterBlockType );
	} );

	it( 'should return empty object if no attributes are passed', () => {
		expect(
			__experimentalStripInternalBlockAttributes(
				'core/test-block-with-internal-attrs',
				{}
			)
		).toEqual( {} );
	} );
	it( 'should return all attributes when block has no attributes with internal role', () => {
		expect(
			__experimentalStripInternalBlockAttributes(
				'core/test-block-with-no-internal-attrs',
				{ align: 'left', color: 'blue' }
			)
		).toEqual( { align: 'left', color: 'blue' } );
	} );
	it( 'should remove attributes with internal role and return all others', () => {
		expect(
			__experimentalStripInternalBlockAttributes(
				'core/test-block-with-internal-attrs',
				{
					align: 'left',
					internalData: true,
					productId: 12345,
					color: 'blue',
				}
			)
		).toEqual( { align: 'left', color: 'blue' } );
	} );
} );
