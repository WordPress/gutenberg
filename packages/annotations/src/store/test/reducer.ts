/**
 * Internal dependencies
 */
import { annotations } from '../reducer';
import type { AnnotationAction, AnnotationsState } from '../../types';

describe( 'annotations', () => {
	const initialState: AnnotationsState = {};

	it( 'returns all annotations and annotation IDs per block', () => {
		const state = annotations( undefined, {} as AnnotationAction );

		expect( state ).toEqual( initialState );
	} );

	it( 'returns a state with an annotation that has been added', () => {
		const state = annotations( undefined, {
			type: 'ANNOTATION_ADD',
			id: 'annotationId',
			blockClientId: 'blockClientId',
			richTextIdentifier: 'identifier',
			source: 'default',
			selector: 'block',
		} );

		expect( state ).toEqual( {
			blockClientId: [
				{
					id: 'annotationId',
					blockClientId: 'blockClientId',
					richTextIdentifier: 'identifier',
					source: 'default',
					selector: 'block',
				},
			],
		} );
	} );

	it( 'allows an annotation to be removed', () => {
		const state = annotations(
			{
				blockClientId: [
					{
						id: 'annotationId',
						blockClientId: 'blockClientId',
						richTextIdentifier: 'identifier',
						source: 'default',
						selector: 'block',
					},
				],
			},
			{
				type: 'ANNOTATION_REMOVE',
				annotationId: 'annotationId',
			}
		);

		expect( state ).toEqual( { blockClientId: [] } );
	} );

	it( 'allows an annotation to be removed by its source', () => {
		const annotation1 = {
			id: 'annotationId',
			blockClientId: 'blockClientId',
			richTextIdentifier: 'identifier',
			source: 'default',
			selector: 'block' as const,
		};
		const annotation2 = {
			id: 'annotationId2',
			blockClientId: 'blockClientId2',
			richTextIdentifier: 'identifier2',
			source: 'other-source',
			selector: 'block' as const,
		};
		const state = annotations(
			{
				blockClientId: [ annotation1 ],
				blockClientId2: [ annotation2 ],
			},
			{
				type: 'ANNOTATION_REMOVE_SOURCE',
				source: 'default',
			}
		);

		expect( state ).toEqual( {
			blockClientId: [],
			blockClientId2: [ annotation2 ],
		} );
	} );

	it( 'allows a range selector', () => {
		const state = annotations( undefined, {
			type: 'ANNOTATION_ADD',
			id: 'annotationId',
			blockClientId: 'blockClientId',
			richTextIdentifier: 'identifier',
			source: 'default',
			selector: 'range',
			range: {
				start: 0,
				end: 100,
			},
		} );

		expect( state ).toEqual( {
			blockClientId: [
				{
					id: 'annotationId',
					blockClientId: 'blockClientId',
					richTextIdentifier: 'identifier',
					source: 'default',
					selector: 'range',
					range: {
						start: 0,
						end: 100,
					},
				},
			],
		} );
	} );

	it( 'moves annotations when said action is dispatched', () => {
		const state = annotations(
			{
				blockClientId: [
					{
						id: 'annotationId',
						blockClientId: 'blockClientId',
						richTextIdentifier: 'identifier',
						source: 'default',
						selector: 'range' as const,
						range: {
							start: 0,
							end: 100,
						},
					},
				],
			},
			{
				type: 'ANNOTATION_UPDATE_RANGE',
				annotationId: 'annotationId',
				start: 50,
				end: 75,
			}
		);

		expect( state ).toEqual( {
			blockClientId: [
				{
					id: 'annotationId',
					blockClientId: 'blockClientId',
					richTextIdentifier: 'identifier',
					source: 'default',
					selector: 'range',
					range: {
						start: 50,
						end: 75,
					},
				},
			],
		} );
	} );

	it( 'rejects invalid annotations', () => {
		let state = annotations( undefined, {
			type: 'ANNOTATION_ADD',
			id: 'test1',
			blockClientId: 'blockClientId',
			richTextIdentifier: 'identifier',
			source: 'default',
			selector: 'range',
			range: {
				start: 5,
				end: 4,
			},
		} );
		state = annotations( state, {
			type: 'ANNOTATION_ADD',
			id: 'test2',
			blockClientId: 'blockClientId',
			richTextIdentifier: 'identifier',
			source: 'default',
			selector: 'range',
			range: {
				// @ts-expect-error Testing invalid input
				start: 'not a number',
				end: 100,
			},
		} );
		state = annotations( state, {
			type: 'ANNOTATION_ADD',
			id: 'test3',
			blockClientId: 'blockClientId',
			richTextIdentifier: 'identifier',
			source: 'default',
			selector: 'range',
			range: {
				start: 100,
				// @ts-expect-error Testing invalid input
				end: 'not a number',
			},
		} );

		expect( state ).toEqual( initialState );
	} );
} );
