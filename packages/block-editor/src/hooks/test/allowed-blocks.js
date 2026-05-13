/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { addTransforms } from '../allowed-blocks';

describe( 'allowedBlocks', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'addTransforms()', () => {
		it( 'should not preserve allowedBlocks in wrapping transforms', () => {
			registerBlockType( 'core/bar', {
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

			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );

		it( 'should not preserve allowedBlocks in one-to-many transforms', () => {
			registerBlockType( 'core/bar', {
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

			const transformed = addTransforms(
				results[ 0 ],
				source,
				0,
				results
			);

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );

		it( 'should not preserve allowedBlocks in many-to-one transforms', () => {
			registerBlockType( 'core/bar', {
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

			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );

		it( 'should not preserve allowedBlocks in many-to-many transforms with different counts', () => {
			registerBlockType( 'core/bar', {
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
				( result, index ) =>
					addTransforms( result, source, index, results )
			);

			expect( firstTransformed.attributes.allowedBlocks ).toBeUndefined();
			expect(
				secondTransformed.attributes.allowedBlocks
			).toBeUndefined();
		} );

		it( 'should preserve allowedBlocks in many-to-many transforms with same counts', () => {
			registerBlockType( 'core/bar', {
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
				( result, index ) =>
					addTransforms( result, source, index, results )
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
			registerBlockType( 'core/bar', {
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

			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toEqual( [
				'core/paragraph',
			] );
		} );

		it( 'should not override existing allowedBlocks in target block', () => {
			registerBlockType( 'core/bar', {
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

			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toEqual( [
				'core/heading',
			] );
		} );

		it( 'should not preserve allowedBlocks when target block does not support allowedBlocks', () => {
			registerBlockType( 'core/bar', {
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
			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.allowedBlocks ).toBeUndefined();
		} );
	} );
} );
