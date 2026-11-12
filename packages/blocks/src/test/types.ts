import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
	BlockConfiguration,
	BlockExample,
	BlockExampleInnerBlock,
	BlockType,
} from '../index';
import type { getBlockFromExample } from '../api/factory';
import metadata from './fixtures/block-example.json';

type Attributes = {
	open: boolean;
	label: string;
};

type Example = NonNullable< BlockType< Attributes >[ 'example' ] >;

describe( 'Block examples', () => {
	it( 'accepts partial attribute values and empty examples', () => {
		const example: Example = {
			attributes: { open: true },
		};

		expectTypeOf( example.attributes ).toEqualTypeOf<
			Partial< Attributes > | undefined
		>();
		expectTypeOf< {} >().toExtend< Example >();
		expect( example.attributes ).toEqual( { open: true } );
	} );

	it( 'accepts attribute values for recursively nested block types', () => {
		const example: Example = {
			attributes: { open: true },
			innerBlocks: [
				{
					name: 'core/group',
					attributes: { align: 'wide' },
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Hello' },
						},
					],
				},
			],
		};

		expectTypeOf( example ).toExtend< BlockExample< Attributes > >();
		expect(
			example.innerBlocks?.[ 0 ].innerBlocks?.[ 0 ].attributes?.content
		).toBe( 'Hello' );
	} );

	it( 'allows inner blocks to omit attributes but requires their names', () => {
		const innerBlock: BlockExampleInnerBlock = {
			name: 'core/group',
			innerBlocks: [ { name: 'core/paragraph' } ],
		};

		expectTypeOf( innerBlock ).toExtend< BlockExample >();
		expectTypeOf< {} >().not.toExtend< BlockExampleInnerBlock >();
		expect( innerBlock.innerBlocks ).toEqual( [
			{ name: 'core/paragraph' },
		] );
	} );

	it( 'accepts JSON metadata with example attribute values', () => {
		const settings = metadata as BlockConfiguration< Attributes >;

		expectTypeOf( settings.example ).toEqualTypeOf<
			BlockExample< Attributes > | undefined
		>();
		expect( settings.example?.attributes?.open ).toBe( true );
	} );

	it( 'rejects parent attribute values that do not match their declared types', () => {
		expect<
			{
				attributes: { open: string };
			} extends Example
				? true
				: false
		>( false ).toBe( false );
	} );

	it( 'accepts static inner content and the preview width', () => {
		const example: Example = {
			innerContent: [ '<div>', null, '</div>' ],
			viewportWidth: 800,
			innerBlocks: [
				{
					name: 'core/html',
					innerContent: [ '<p>Hello</p>' ],
				},
			],
		};

		expectTypeOf( example.innerContent ).toEqualTypeOf<
			Array< string | null > | undefined
		>();
		expectTypeOf( example.viewportWidth ).toEqualTypeOf<
			number | undefined
		>();
		expect( example.innerContent ).toEqual( [ '<div>', null, '</div>' ] );
	} );

	it( 'can pass a public example directly to getBlockFromExample', () => {
		expect<
			Example extends Parameters< typeof getBlockFromExample >[ 1 ]
				? true
				: false
		>( true ).toBe( true );
	} );
} );
