import { afterEach, describe, expect, it } from 'vitest';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { addTransforms } from '../allowed-blocks';

// The test blocks carry only the fields the transform reads.
interface TestBlock {
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks: TestBlock[];
}
const transform = addTransforms as unknown as (
	result: TestBlock,
	source: TestBlock[],
	index: number,
	results: TestBlock[]
) => TestBlock;
// The test block types need no category, edit or save.
const register = registerBlockType as unknown as (
	name: string,
	settings: Record< string, unknown >
) => void;

describe( 'allowedBlocks', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'addTransforms()', () => {
		it( 'should not preserve allowedBlocks in wrapping transforms', () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
				supports: { allowedBlocks: true },
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						allowedBlocks: [ 'core/paragraph', 'core/heading' ],
					},
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { allowedBlocks: [ 'core/paragraph' ] },
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: {},
				innerBlocks: source,
			};

			const transformed = transform( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );

		it( 'should not preserve allowedBlocks in one-to-many transforms', () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
				supports: { allowedBlocks: true },
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						allowedBlocks: [ 'core/paragraph', 'core/heading' ],
					},
					innerBlocks: [],
				},
			];
			const results = [
				{ name: 'core/bar', attributes: {}, innerBlocks: [] },
				{ name: 'core/bar', attributes: {}, innerBlocks: [] },
			];

			const transformed = transform( results[ 0 ], source, 0, results );

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );

		it( 'should not preserve allowedBlocks in many-to-one transforms', () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
				supports: { allowedBlocks: true },
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						allowedBlocks: [ 'core/paragraph', 'core/heading' ],
					},
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { allowedBlocks: [ 'core/paragraph' ] },
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: {},
				innerBlocks: [],
			};

			const transformed = transform( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );

		it( 'should not preserve allowedBlocks in many-to-many transforms with different counts', () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
				supports: { allowedBlocks: true },
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						allowedBlocks: [ 'core/paragraph', 'core/heading' ],
					},
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { allowedBlocks: [ 'core/paragraph' ] },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { allowedBlocks: [ 'core/heading' ] },
					innerBlocks: [],
				},
			];
			const results = [
				{ name: 'core/bar', attributes: {}, innerBlocks: [] },
				{ name: 'core/bar', attributes: {}, innerBlocks: [] },
			];

			const [ firstTransformed, secondTransformed ] = results.map(
				( result, index ) => transform( result, source, index, results )
			);

			expect( firstTransformed.attributes.allowedBlocks ).toBeUndefined();
			expect(
				secondTransformed.attributes.allowedBlocks
			).toBeUndefined();
		} );

		it( 'should preserve allowedBlocks in many-to-many transforms with same counts', () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
				supports: { allowedBlocks: true },
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						allowedBlocks: [ 'core/image', 'core/heading' ],
					},
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { allowedBlocks: [ 'core/paragraph' ] },
					innerBlocks: [],
				},
			];
			const results = [
				{ name: 'core/bar', attributes: {}, innerBlocks: [] },
				{ name: 'core/bar', attributes: {}, innerBlocks: [] },
			];

			const [ firstTransformed, secondTransformed ] = results.map(
				( result, index ) => transform( result, source, index, results )
			);

			expect( firstTransformed.attributes.allowedBlocks ).toEqual( [
				'core/image',
				'core/heading',
			] );
			expect( secondTransformed.attributes.allowedBlocks ).toEqual( [
				'core/paragraph',
			] );
		} );

		it( "should filter allowedBlocks based on destination block's allowedBlocks", () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
				supports: { allowedBlocks: true },
				allowedBlocks: [ 'core/paragraph' ],
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						allowedBlocks: [
							'core/paragraph',
							'core/heading',
							'core/image',
						],
					},
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: {},
				innerBlocks: [],
			};

			const transformed = transform( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toEqual( [
				'core/paragraph',
			] );
		} );

		it( 'should not override existing allowedBlocks in target block', () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
				supports: { allowedBlocks: true },
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: { allowedBlocks: [ 'core/paragraph' ] },
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: { allowedBlocks: [ 'core/heading' ] },
				innerBlocks: [],
			};

			const transformed = transform( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toEqual( [
				'core/heading',
			] );
		} );

		it( 'should not preserve allowedBlocks when target block does not support allowedBlocks', () => {
			register( 'core/bar', {
				apiVersion: 3,
				title: 'Bar',
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						allowedBlocks: [ 'core/paragraph', 'core/heading' ],
					},
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: {},
				innerBlocks: [],
			};
			const transformed = transform( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );
	} );
} );
