import { afterEach, describe, expect, it } from 'vitest';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
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
					clientId: '1',
					isValid: true,
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					clientId: '2',
					isValid: true,
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				clientId: '3',
				isValid: true,
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
					clientId: '4',
					isValid: true,
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
			];
			const results = [
				{
					name: 'core/bar',
					clientId: '5',
					isValid: true,
					attributes: {},
					innerBlocks: [],
				},
				{
					name: 'core/bar',
					clientId: '6',
					isValid: true,
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
					clientId: '7',
					isValid: true,
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					clientId: '8',
					isValid: true,
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				clientId: '9',
				isValid: true,
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
					clientId: '10',
					isValid: true,
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					clientId: '11',
					isValid: true,
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					clientId: '12',
					isValid: true,
					attributes: { metadata: { noteId: 3 } },
					innerBlocks: [],
				},
			];
			const results = [
				{
					name: 'core/bar',
					clientId: '13',
					isValid: true,
					attributes: {},
					innerBlocks: [],
				},
				{
					name: 'core/bar',
					clientId: '14',
					isValid: true,
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
					clientId: '15',
					isValid: true,
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/foo',
					clientId: '16',
					isValid: true,
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
				},
			];
			const results = [
				{
					name: 'core/bar',
					clientId: '17',
					isValid: true,
					attributes: { metadata: { noteId: 1 } },
					innerBlocks: [],
				},
				{
					name: 'core/bar',
					clientId: '18',
					isValid: true,
					attributes: { metadata: { noteId: 2 } },
					innerBlocks: [],
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
				attributes: {},
				category: 'text',
				apiVersion: 3,
				title: 'Bar',
			} );
			const source = [
				{
					name: 'core/foo',
					clientId: '19',
					isValid: true,
					attributes: {
						metadata: { name: 'Custom Name' },
					},
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				clientId: '20',
				isValid: true,
				attributes: {},
				innerBlocks: [],
			};
			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.metadata?.name ).toBe(
				'Custom Name'
			);
		} );

		it( 'should not preserve custom name metadata when target block does not support renaming', () => {
			registerBlockType( 'core/bar', {
				attributes: {},
				category: 'text',
				apiVersion: 3,
				title: 'Bar',
				supports: {
					renaming: false,
				},
			} );

			const source = [
				{
					name: 'core/foo',
					clientId: '21',
					isValid: true,
					attributes: {
						metadata: { name: 'Custom Name' },
					},
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				clientId: '22',
				isValid: true,
				attributes: {},
				innerBlocks: [],
			};
			const transformed = addTransforms( result, source, 0, [ result ] );

			expect( transformed.attributes.metadata?.name ).toBeUndefined();
		} );

		it( 'should preserve block visibility metadata', () => {
			registerBlockType( 'core/bar', {
				attributes: {},
				category: 'text',
				apiVersion: 3,
				title: 'Bar',
			} );

			const source = [
				{
					name: 'core/foo',
					clientId: '23',
					isValid: true,
					attributes: {
						metadata: { blockVisibility: false },
					},
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				clientId: '24',
				isValid: true,
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
				attributes: {},
				category: 'text',
				apiVersion: 3,
				title: 'Bar',
				supports: {
					visibility: false,
				},
			} );

			const source = [
				{
					name: 'core/foo',
					clientId: '25',
					isValid: true,
					attributes: {
						metadata: { blockVisibility: false },
					},
					innerBlocks: [],
				},
			];
			const result = {
				name: 'core/bar',
				clientId: '26',
				isValid: true,
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
					clientId: '27',
					isValid: true,
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
				clientId: '28',
				isValid: true,
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
