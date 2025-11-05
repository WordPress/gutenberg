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
import { addTransforms } from '../metadata';

describe( 'metadata', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'addTransforms()', () => {
		it( 'should not preserve metadata in wrapping transforms', () => {
			const source = [
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: {},
				innerBlocks: source,
			};
			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.metadata ).toBeUndefined();
		} );

		it( 'should not preserve metadata in one-to-many transforms', () => {
			const source = [
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
			];
			const results = [
				{
					name: 'core/bar',
					attributes: {},
					innerBlocks: [],
				},
				{
					name: 'core/bar',
					attributes: {},
					innerBlocks: [],
				},
			];
			const transformed = addTransforms(
				results[ 0 ],
				source,
				0,
				results
			);

			expect( transformed.attributes.metadata ).toBeUndefined();
		} );

		it( 'should not preserve metadata in many-to-one transforms', () => {
			const source = [
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: {},
				innerBlocks: [],
			};
			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.metadata ).toBeUndefined();
		} );

		it( 'should not preserve metadata in many-to-many transforms with different counts', () => {
			const source = [
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 3 } },
					innerBlocks: [],
				},
			];
			const results = [
				{
					name: 'core/bar',
					attributes: {},
					innerBlocks: [],
				},
				{
					name: 'core/bar',
					attributes: {},
					innerBlocks: [],
				},
			];
			const [ firstTransformed, secondTransformed ] = results.map(
				( result, index ) =>
					addTransforms( result, source, index, results )
			);

			expect( firstTransformed.attributes.metadata ).toBeUndefined();
			expect( secondTransformed.attributes.metadata ).toBeUndefined();
		} );

		it( 'should preserve metadata in many-to-many transforms with same counts', () => {
			const source = [
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
			];
			const results = [
				{
					name: 'core/bar',
					attributes: { metadata: { noteId: 1 } },
				},
				{
					name: 'core/bar',
					attributes: { metadata: { noteId: 2 } },
				},
			];

			const [ firstTransformed, secondTransformed ] = results.map(
				( result, index ) =>
					addTransforms( result, source, index, results )
			);

			expect( firstTransformed.attributes.metadata ).toEqual( {
				noteId: 1,
			} );
			expect( secondTransformed.attributes.metadata ).toEqual( {
				noteId: 2,
			} );
		} );

		it( 'should preserve custom name metadata', () => {
			registerBlockType( 'core/bar', {
				title: 'Bar',
			} );
			const source = [
				{
					name: 'core/foo',
					attributes: {
						metadata: { name: 'Custom Name' },
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

			expect( transformed.attributes.metadata.name ).toBe(
				'Custom Name'
			);
		} );

		it( 'should not preserve custom name metadata when target block does not support renaming', () => {
			registerBlockType( 'core/bar', {
				title: 'Bar',
				supports: {
					renaming: false,
				},
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						metadata: { name: 'Custom Name' },
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

			expect( transformed.attributes.metadata?.name ).toBeUndefined();
		} );

		it( 'should preserve block visibility metadata', () => {
			registerBlockType( 'core/bar', {
				title: 'Bar',
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						metadata: { blockVisibility: false },
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

			expect( transformed.attributes.metadata?.blockVisibility ).toBe(
				false
			);
		} );

		it( 'should not preserve block visibility metadata when target block does not support it', () => {
			registerBlockType( 'core/bar', {
				title: 'Bar',
				supports: {
					blockVisibility: false,
				},
			} );

			const source = [
				{
					name: 'core/foo',
					attributes: {
						metadata: { blockVisibility: false },
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

			expect(
				transformed.attributes.metadata?.blockVisibility
			).toBeUndefined();
		} );

		it( 'should not override existing metadata in target block', () => {
			const source = [
				{
					name: 'core/foo',
					attributes: {
						metadata: {
							noteId: 1,
							name: 'Custom Name',
							blockVisibility: false,
						},
					},
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				attributes: {
					metadata: {
						noteId: 2,
						name: 'Existing Name',
						blockVisibility: true,
					},
				},
				innerBlocks: [],
			};
			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.metadata ).toEqual( {
				noteId: 2,
				name: 'Existing Name',
				blockVisibility: true,
			} );
		} );
	} );
} );
