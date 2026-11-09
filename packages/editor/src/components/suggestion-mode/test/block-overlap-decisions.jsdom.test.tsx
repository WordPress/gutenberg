/**
 * Decisions on block suggestions from several authors (#73411, phase C):
 * Anne's suggestion is the block's marker (note 12), Bob's is nested on it
 * (note 15). Each is decided on its own note.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import {
	createRegistry,
	createReduxStore,
	RegistryProvider,
} from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import { useSuggestionsProvider } from '../provider';

const attributesOf = ( registry: any, clientId: string ): any =>
	registry.select( blockEditorStore ).getBlockAttributes( clientId );

vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const HEADING = 'core/test-overlap-heading';
const ANNE = 3;
const BOB = 7;

const payload = ( operations: any[] ) => ( {
	schemaVersion: 2,
	blockName: HEADING,
	baseRevision: null,
	operations,
} );

const levelTo = ( level: number ) =>
	payload( [
		{ type: 'attribute-set', attribute: 'level', before: 2, after: level },
	] );

const NOTES: Record< number, any > = {
	12: { id: 12, author: ANNE, meta: {} },
	15: { id: 15, author: BOB, meta: {} },
};

function setup( suggestion: any ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( blockEditorStore );
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEntityRecord:
					( kind: string, name: string, record: any ) =>
					async () => ( {
						id: record.id,
					} ),
			},
			selectors: {
				getEditedEntityRecord: () => null,
				getEntityRecord: (
					state: any,
					kind: string,
					name: string,
					id: any
				) => NOTES[ Number( id ) ] ?? null,
				getCurrentUser: () => null,
			},
		} )
	);
	registry.register(
		createReduxStore( 'core/interface', {
			reducer: ( state = {} ) => state,
			actions: { enableComplementaryArea: () => ( { type: 'NOOP' } ) },
			selectors: { getActiveComplementaryArea: () => null },
		} )
	);
	const block = createBlock( HEADING, {
		level: 2,
		metadata: { noteId: [ 12, 15 ], suggestion },
	} );
	const other = createBlock( HEADING, { level: 2 } );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block, other ] );
	let provider: ReturnType< typeof useSuggestionsProvider >;
	function Capture() {
		provider = useSuggestionsProvider();
		return null;
	}
	render(
		<RegistryProvider value={ registry }>
			<Capture />
		</RegistryProvider>
	);
	return {
		registry,
		block,
		attributes: () => attributesOf( registry, block.clientId ),
		order: () => registry.select( blockEditorStore ).getBlockOrder(),
		provider: () => provider,
	};
}

const anneLevel3 = {
	type: 'pending-attributes',
	authorId: ANNE,
	commentId: 12,
	after: { level: 3 },
};
const bobLevel4 = {
	type: 'pending-attributes',
	authorId: BOB,
	commentId: 15,
	after: { level: 4 },
};

describe( 'decisions on block suggestions from several authors', () => {
	beforeAll( () => {
		registerBlockType( HEADING, {
			apiVersion: 3,
			attributes: {
				level: { type: 'number' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Overlap Heading',
		} as any );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	it( 'accepting the nested proposal applies it and leaves the outer one pending', async () => {
		const { block, attributes, provider } = setup( {
			...anneLevel3,
			nested: [ bobLevel4 ],
		} );
		await act( async () => {
			await provider().applySuggestion( {
				commentId: 15,
				clientId: block.clientId,
				payload: levelTo( 4 ),
			} );
		} );
		expect( attributes().level ).toBe( 4 );
		expect( attributes().metadata.suggestion ).toEqual( anneLevel3 );
	} );

	it( 'rejecting the nested proposal drops only it', async () => {
		const { block, attributes, provider } = setup( {
			...anneLevel3,
			nested: [ bobLevel4 ],
		} );
		await act( async () => {
			await provider().rejectSuggestion( {
				commentId: 15,
				clientId: block.clientId,
				payload: levelTo( 4 ),
			} );
		} );
		expect( attributes().level ).toBe( 2 );
		expect( attributes().metadata.suggestion ).toEqual( anneLevel3 );
	} );

	it( 'accepting the outer proposal lifts the nested one into its place', async () => {
		const { block, attributes, provider } = setup( {
			...anneLevel3,
			nested: [ bobLevel4 ],
		} );
		await act( async () => {
			await provider().applySuggestion( {
				commentId: 12,
				clientId: block.clientId,
				payload: levelTo( 3 ),
			} );
		} );
		expect( attributes().level ).toBe( 3 );
		expect( attributes().metadata.suggestion ).toEqual( bobLevel4 );
	} );

	it( 'drops a proposal an accept left with nothing to change', async () => {
		const { block, attributes, provider } = setup( {
			...anneLevel3,
			nested: [ { ...bobLevel4, after: { level: 3 } } ],
		} );
		await act( async () => {
			await provider().applySuggestion( {
				commentId: 12,
				clientId: block.clientId,
				payload: levelTo( 3 ),
			} );
		} );
		expect( attributes().level ).toBe( 3 );
		expect( attributes().metadata.suggestion ).toBeUndefined();
	} );

	describe( 'a removal nested on a suggested block', () => {
		const insertion = {
			type: 'pending-insert',
			authorId: ANNE,
			commentId: 12,
			nested: [
				{ type: 'pending-remove', authorId: BOB, commentId: 15 },
			],
		};
		const removal = ( clientId: string ) =>
			payload( [
				{ type: 'block-remove', clientId, blockName: HEADING },
			] );
		const insert = ( clientId: string ) =>
			payload( [
				{
					type: 'block-insert-after',
					clientId,
					blockName: HEADING,
					anchorClientId: null,
					parentClientId: null,
				},
			] );

		it( 'accepting the removal removes the block', async () => {
			const { block, order, provider } = setup( insertion );
			await act( async () => {
				await provider().applySuggestion( {
					commentId: 15,
					clientId: block.clientId,
					payload: removal( block.clientId ),
				} );
			} );
			expect( order() ).not.toContain( block.clientId );
		} );

		it( 'rejecting the removal keeps the suggested block', async () => {
			const { block, attributes, order, provider } = setup( insertion );
			await act( async () => {
				await provider().rejectSuggestion( {
					commentId: 15,
					clientId: block.clientId,
					payload: removal( block.clientId ),
				} );
			} );
			expect( order() ).toContain( block.clientId );
			expect( attributes().metadata.suggestion ).toEqual( {
				type: 'pending-insert',
				authorId: ANNE,
				commentId: 12,
			} );
		} );

		it( 'accepting the insertion leaves the removal pending', async () => {
			const { block, attributes, order, provider } = setup( insertion );
			await act( async () => {
				await provider().applySuggestion( {
					commentId: 12,
					clientId: block.clientId,
					payload: insert( block.clientId ),
				} );
			} );
			expect( order() ).toContain( block.clientId );
			expect( attributes().metadata.suggestion ).toEqual( {
				type: 'pending-remove',
				authorId: BOB,
				commentId: 15,
			} );
		} );

		it( 'rejecting the insertion takes the removal with the block', async () => {
			const { block, order, provider } = setup( insertion );
			await act( async () => {
				await provider().rejectSuggestion( {
					commentId: 12,
					clientId: block.clientId,
					payload: insert( block.clientId ),
				} );
			} );
			expect( order() ).not.toContain( block.clientId );
		} );
	} );
} );
