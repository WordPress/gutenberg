import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import type { BlockType } from '../../types';
import { partial } from '../../store/test/fixtures/types';
import '../../store';
import { createBlock } from '../factory';
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	setDefaultBlockName,
} from '../registration';
import {
	isUnmodifiedBlock,
	isUnmodifiedDefaultBlock,
	getAccessibleBlockLabel,
	getBlockLabel,
	isBlockRegistered,
	sanitizeBlockAttributes,
	__experimentalSanitizeBlockAttributes,
	getBlockAttributesNamesByRole,
	isContentBlock,
} from '../utils';

const noop = () => null;

describe( 'block helpers', () => {
	afterEach( () => {
		setDefaultBlockName( '' );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'isUnmodifiedDefaultBlock()', () => {
		it( 'should return true if the default block is unmodified', () => {
			registerBlockType( 'core/test-block', {
				apiVersion: 3,
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
				apiVersion: 3,
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
				apiVersion: 3,
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
				apiVersion: 3,
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
		const blockType = { title: 'Recipe' } as BlockType;
		const attributes = {};

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Recipe' );
	} );

	it( 'returns only the block title when the block has a `getLabel` function, but it returns a falsey value', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: () => '',
		} as unknown as BlockType;
		const attributes = {};

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Recipe' );
	} );

	it( 'returns the block title with the label when the `getLabel` function returns a value', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading }: { heading?: string } ) =>
				heading,
		} as unknown as BlockType;
		const attributes = { heading: 'Cupcakes!' };

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Cupcakes!' );
	} );

	it( 'removes any html elements from the output of the `getLabel` function', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading }: { heading?: string } ) =>
				heading,
		} as unknown as BlockType;
		const attributes = {
			heading: '<b><span class="my-class">Cupcakes!</span></b>',
		};

		expect( getBlockLabel( blockType, attributes ) ).toBe( 'Cupcakes!' );
	} );
} );

describe( 'getAccessibleBlockLabel', () => {
	it( 'returns only the block title when the block has no `getLabel` function', () => {
		const blockType = { title: 'Recipe' } as BlockType;
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe(
			'Recipe Block'
		);
	} );

	it( 'returns only the block title when the block has a `getLabel` function, but it returns a falsey value', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: () => '',
		} as unknown as BlockType;
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe(
			'Recipe Block'
		);
	} );

	it( 'returns the block title with the label when the `getLabel` function returns a value', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading }: { heading?: string } ) =>
				heading,
		} as unknown as BlockType;
		const attributes = { heading: 'Cupcakes!' };

		expect( getAccessibleBlockLabel( blockType, attributes ) ).toBe(
			'Recipe Block. Cupcakes!'
		);
	} );

	it( 'removes any html elements from the output of the `getLabel` function', () => {
		const blockType = {
			title: 'Recipe',
			__experimentalLabel: ( { heading }: { heading?: string } ) =>
				heading,
		} as unknown as BlockType;
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
			__experimentalLabel: ( { heading }: { heading?: string } ) =>
				heading,
		} as unknown as BlockType;
		const attributes = { heading: 'Cupcakes!' };

		expect( getAccessibleBlockLabel( blockType, attributes, 3 ) ).toBe(
			'Recipe Block. Row 3. Cupcakes!'
		);
	} );

	it( 'outputs just the block title and row number when there no label is available for the block', () => {
		const blockType = { title: 'Recipe' } as BlockType;
		const attributes = {};

		expect( getAccessibleBlockLabel( blockType, attributes, 3 ) ).toBe(
			'Recipe Block. Row 3'
		);
	} );
} );

describe( 'isBlockRegistered', () => {
	it( 'returns true if the block is registered', () => {
		registerBlockType( 'core/test-block', {
			apiVersion: 3,
			category: 'text',
			title: 'Test block',
			attributes: {},
			save: () => null,
		} );
		expect( isBlockRegistered( 'core/test-block' ) ).toBe( true );
		unregisterBlockType( 'core/test-block' );
	} );

	it( 'returns false if the block is not registered', () => {
		expect( isBlockRegistered( 'core/not-registered-test-block' ) ).toBe(
			false
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
			apiVersion: 3,
			category: 'text',
			attributes: {
				defined: {
					type: 'string',
				},
			},
			title: 'Test block',
		} );

		const attributes = sanitizeBlockAttributes( 'core/test-block', {
			defined: 'defined-attribute',
			notDefined: 'not-defined-attribute',
		} );

		expect( attributes ).toEqual( {
			defined: 'defined-attribute',
		} );
	} );

	it( 'throws error if the block is not registered', () => {
		expect( () => {
			sanitizeBlockAttributes( 'core/not-registered-test-block', {} );
		} ).toThrow(
			"Block type 'core/not-registered-test-block' is not registered."
		);
	} );

	it( 'handles undefined values and default values', () => {
		registerBlockType( 'core/test-block', {
			apiVersion: 3,
			category: 'text',
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

		const attributes = sanitizeBlockAttributes( 'core/test-block', {} );

		expect( attributes ).toEqual( {
			hasDefaultValue: 'default-value',
		} );
	} );

	it( 'handles node and children sources as arrays', () => {
		registerBlockType( 'core/test-block', {
			apiVersion: 3,
			category: 'text',
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

		const attributes = sanitizeBlockAttributes( 'core/test-block', {
			nodeContent: [ 'test-1', 'test-2' ],
		} );

		expect( attributes ).toEqual( {
			nodeContent: [ 'test-1', 'test-2' ],
			childrenContent: [],
			withDefault: [ 'test' ],
		} );
	} );

	it( 'converts rich text to HTML for datetime and url attributes', () => {
		registerBlockType( 'core/test-block', {
			apiVersion: 3,
			category: 'text',
			attributes: {
				date: {
					type: 'datetime',
				},
				link: {
					type: 'url',
				},
			},
			title: 'Test block',
		} );

		const attributes = sanitizeBlockAttributes( 'core/test-block', {
			date: RichTextData.fromHTMLString( '2025-12-03T10:20:30' ),
			link: RichTextData.fromHTMLString(
				'https://example.org/a?b=1&amp;c=2'
			),
		} );

		expect( attributes ).toEqual( {
			date: '2025-12-03T10:20:30',
			link: 'https://example.org/a?b=1&amp;c=2',
		} );
	} );

	it( 'keeps the experimental function as a deprecated alias', () => {
		registerBlockType( 'core/test-block', {
			apiVersion: 3,
			category: 'text',
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
		expect( console ).toHaveWarnedWith(
			'__experimentalSanitizeBlockAttributes is deprecated since version 7.1. Please use sanitizeBlockAttributes instead.'
		);
	} );
} );

describe( 'getBlockAttributesNamesByRole', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block-1', {
			apiVersion: 3,
			attributes: {
				align: {
					type: 'string',
				},
				content: {
					type: 'boolean',
					role: 'content',
				},
				level: {
					type: 'number',
					role: 'content',
				},
				color: {
					type: 'string',
					role: 'other',
				},
			},
			save: noop,
			category: 'text',
			title: 'test block 1',
		} );
		registerBlockType( 'core/test-block-2', {
			apiVersion: 3,
			attributes: {
				align: { type: 'string' },
				content: { type: 'boolean' },
				color: { type: 'string' },
			},
			save: noop,
			category: 'text',
			title: 'test block 2',
		} );
		registerBlockType(
			'core/test-block-3',
			partial< Parameters< typeof registerBlockType >[ 1 ] >( {
				apiVersion: 3,
				save: noop,
				category: 'text',
				title: 'test block 3',
			} )
		);
	} );
	afterAll( () => {
		[
			'core/test-block-1',
			'core/test-block-2',
			'core/test-block-3',
		].forEach( unregisterBlockType );
	} );
	it( 'should return empty array if block has no attributes', () => {
		expect( getBlockAttributesNamesByRole( 'core/test-block-3' ) ).toEqual(
			[]
		);
	} );
	it( 'should return all attribute names if no role is provided', () => {
		expect( getBlockAttributesNamesByRole( 'core/test-block-1' ) ).toEqual(
			expect.arrayContaining( [ 'align', 'content', 'level', 'color' ] )
		);
	} );
	it( 'should return proper results with existing attributes and provided role', () => {
		expect(
			getBlockAttributesNamesByRole( 'core/test-block-1', 'content' )
		).toEqual( expect.arrayContaining( [ 'content', 'level' ] ) );
		expect(
			getBlockAttributesNamesByRole( 'core/test-block-1', 'other' )
		).toEqual( [ 'color' ] );
		expect(
			getBlockAttributesNamesByRole( 'core/test-block-1', 'not-exists' )
		).toEqual( [] );
		// A block with no `role` in any attributes.
		expect(
			getBlockAttributesNamesByRole( 'core/test-block-2', 'content' )
		).toEqual( [] );
	} );
} );

describe( 'isContentBlock', () => {
	it( 'returns true if the block has a content role attribute', () => {
		registerBlockType( 'core/test-content-block', {
			apiVersion: 3,
			attributes: {
				content: {
					type: 'string',
					role: 'content',
				},
				align: {
					type: 'string',
				},
			},
			save: noop,
			category: 'text',
			title: 'test content block',
		} );
		expect( isContentBlock( 'core/test-content-block' ) ).toBe( true );
	} );

	it( 'returns false if the block does not have a content role attribute', () => {
		registerBlockType( 'core/test-non-content-block', {
			apiVersion: 3,
			attributes: {
				content: {
					type: 'string',
				},
				align: {
					type: 'string',
				},
			},
			save: noop,
			category: 'text',
			title: 'test non-content block',
		} );
		expect( isContentBlock( 'core/test-non-content-block' ) ).toBe( false );
	} );
} );

describe( 'isUnmodifiedBlock', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			apiVersion: 3,
			attributes: {
				align: {
					type: 'string',
				},
				includesDefault: {
					type: 'boolean',
					default: true,
				},
				content: {
					type: 'string',
					role: 'content',
				},
				metadata: {
					type: 'object',
				},
			},
			save: noop,
			category: 'text',
			title: 'test block',
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
	} );

	it( 'should return true if all attributes match their defaults', () => {
		const block = createBlock( 'core/test-block' );
		expect( isUnmodifiedBlock( block ) ).toBe( true );
	} );

	it( 'should return false if any attribute does not match its default', () => {
		const block = createBlock( 'core/test-block', {
			includesDefault: false,
		} );
		expect( isUnmodifiedBlock( block ) ).toBe( false );
	} );

	it( 'should return true if attributes with a specific role match their defaults', () => {
		const block = createBlock( 'core/test-block' );
		expect( isUnmodifiedBlock( block, 'content' ) ).toBe( true );
	} );

	it( 'should return false if attributes with a specific role do not match their defaults', () => {
		const block = createBlock( 'core/test-block', {
			content: 'Updated content',
		} );
		expect( isUnmodifiedBlock( block, 'content' ) ).toBe( false );
	} );

	it( 'should return true if no attributes exist for the specified role', () => {
		const block = createBlock( 'core/test-block' );
		expect( isUnmodifiedBlock( block, 'non-existent-role' ) ).toBe( true );
	} );

	it( 'should return false if no attributes exist for the role and some are modified', () => {
		const block = createBlock( 'core/test-block', {
			align: 'center',
			content: 'Updated content',
		} );
		expect( isUnmodifiedBlock( block, 'non-existent-role' ) ).toBe( false );
	} );

	it( 'should return true if metadata attributes is not modified for role content', () => {
		const block = createBlock( 'core/test-block' );
		expect( isUnmodifiedBlock( block, 'content' ) ).toBe( true );
	} );

	it( 'should return false if metadata attributes is modified for role content', () => {
		const block = createBlock( 'core/test-block', {
			metadata: {
				bindings: {
					content: {
						source: 'core/post-meta',
						args: { key: 'genre' },
					},
				},
			},
		} );
		expect( isUnmodifiedBlock( block, 'content' ) ).toBe( false );
	} );
} );
