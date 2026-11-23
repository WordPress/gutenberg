/**
 * Accept checks the attribute values a suggestion proposes before it writes
 * them: the suggester wrote them, and the reviewer's save stores them.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import {
	createRegistry,
	createReduxStore,
	RegistryProvider,
} from '@wordpress/data';
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	serialize,
} from '@wordpress/blocks';
import { useSuggestionsProvider } from '../provider';

vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const GROUP = 'core/test-apply-group';
const NOTE = 12;

const payloadOf = ( operations: any[], blockName = GROUP ) => ( {
	schemaVersion: 2,
	blockName,
	baseRevision: null,
	operations,
} );

const set = ( attribute: string, after: unknown, before: unknown = null ) => ( {
	type: 'attribute-set',
	attribute,
	before,
	after,
} );

const proposing = ( after: Record< string, unknown >, extra = {} ) => ( {
	noteId: [ NOTE ],
	suggestion: {
		type: 'pending-attributes',
		authorId: 3,
		commentId: NOTE,
		after,
		...extra,
	},
} );

function setup( attributes: Record< string, any > ) {
	const saves: any[] = [];
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( blockEditorStore );
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEntityRecord:
					( kind: string, name: string, record: any ) => async () => {
						saves.push( record );
						return { id: record.id };
					},
			},
			selectors: {
				getEditedEntityRecord: () => null,
				getEntityRecord: () => ( { id: NOTE, author: 3, meta: {} } ),
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
	const block = createBlock( GROUP, attributes );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
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
	const accept = ( payload: any ) =>
		act( async () => {
			await provider.applySuggestion( {
				commentId: NOTE,
				clientId: block.clientId,
				payload,
			} );
		} );
	return {
		accept,
		saves,
		attributes: (): any =>
			registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId ),
		serialized: () =>
			serialize( registry.select( blockEditorStore ).getBlocks() ),
		errors: () =>
			registry
				.select( noticesStore )
				.getNotices()
				.filter( ( notice: any ) => notice.status === 'error' )
				.map( ( notice: any ) => notice.content ),
		successes: () =>
			registry
				.select( noticesStore )
				.getNotices()
				.filter( ( notice: any ) => notice.status === 'success' ),
	};
}

describe( 'accepting an attribute suggestion', () => {
	beforeAll( () => {
		registerBlockType( GROUP, {
			apiVersion: 3,
			attributes: {
				tagName: { type: 'string', default: 'div' },
				url: { type: 'string' },
			},
			supports: { anchor: true },
			save: ( { attributes: { tagName: Tag } }: any ) => (
				<Tag { ...useInnerBlocksProps.save( useBlockProps.save() ) } />
			),
			category: 'design',
			title: 'Test Apply Group',
		} as any );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	it( 'applies a value the block type allows', async () => {
		const { accept, attributes, serialized, successes } = setup( {
			metadata: proposing( { tagName: 'section', anchor: 'intro' } ),
		} );
		await accept(
			payloadOf( [
				set( 'tagName', 'section' ),
				set( 'anchor', 'intro' ),
			] )
		);
		expect( attributes().tagName ).toBe( 'section' );
		expect( attributes().anchor ).toBe( 'intro' );
		expect( attributes().metadata.suggestion ).toBeUndefined();
		expect( serialized() ).toContain( '<section id="intro"' );
		expect( successes() ).toHaveLength( 1 );
	} );

	it.each( [
		[ 'a script tag name', { tagName: 'script' } ],
		[ 'an attribute the block does not declare', { notDeclared: 'x' } ],
		[ 'a script URL', { url: 'javascript:alert(1)' } ],
		[ 'a value of the wrong type', { url: [ '/about' ] } ],
	] )( 'refuses %s and decides nothing', async ( _label, after ) => {
		const metadata = proposing( { anchor: 'intro', ...after } );
		const { accept, attributes, serialized, saves, errors, successes } =
			setup( { metadata } );
		await accept(
			payloadOf( [
				set( 'anchor', 'intro' ),
				...Object.entries( after ).map( ( [ key, value ] ) =>
					set( key, value )
				),
			] )
		);
		// Nothing lands, not even the valid part of the suggestion.
		expect( attributes() ).toEqual( { tagName: 'div', metadata } );
		expect( serialized() ).not.toContain( '<script' );
		// The note keeps its status: no decision was written.
		expect( saves ).toEqual( [] );
		expect( errors() ).toHaveLength( 1 );
		expect( errors()[ 0 ] ).toMatch( /Reject it to close the note\.$/ );
		expect( successes() ).toHaveLength( 0 );
	} );

	it( 'refuses a suggestion made for another block type', async () => {
		const metadata = proposing( { anchor: 'intro' } );
		const { accept, attributes, saves, errors } = setup( { metadata } );
		await accept(
			payloadOf( [ set( 'anchor', 'intro' ) ], 'core/test-apply-other' )
		);
		expect( attributes() ).toEqual( { tagName: 'div', metadata } );
		expect( saves ).toEqual( [] );
		expect( errors() ).toEqual( [
			'This block changed type after the suggestion was made. Reject it to close the note.',
		] );
	} );

	describe( 'a metadata proposal', () => {
		const rename = { metadata: { name: 'Hero', bindings: { a: 1 } } };

		it( 'lands on the block beside the metadata it does not name', async () => {
			const { accept, attributes, errors } = setup( {
				metadata: { ...proposing( rename ), categories: [ 'x' ] },
			} );
			await accept( payloadOf( [ set( 'metadata', rename.metadata ) ] ) );
			expect( errors() ).toEqual( [] );
			expect( attributes().metadata ).toEqual( {
				noteId: [ NOTE ],
				categories: [ 'x' ],
				name: 'Hero',
				bindings: { a: 1 },
			} );
		} );

		it( 'lands when it rides on a suggested insertion', async () => {
			const { accept, attributes, errors } = setup( {
				metadata: {
					noteId: [ NOTE ],
					suggestion: {
						type: 'pending-insert',
						authorId: 3,
						commentId: NOTE,
						after: rename,
					},
				},
			} );
			await accept(
				payloadOf( [
					{ type: 'block-insert-after', blockName: GROUP },
					set( 'metadata', rename.metadata ),
				] )
			);
			expect( errors() ).toEqual( [] );
			expect( attributes().metadata ).toEqual( {
				noteId: [ NOTE ],
				name: 'Hero',
				bindings: { a: 1 },
			} );
		} );

		it( 'lands when nested, leaving the outer suggestion pending', async () => {
			const outer = {
				type: 'pending-attributes',
				authorId: 4,
				commentId: 5,
				after: { anchor: 'top' },
			};
			const { accept, attributes, errors } = setup( {
				metadata: {
					noteId: [ 5, NOTE ],
					suggestion: {
						...outer,
						nested: [
							{
								type: 'pending-attributes',
								authorId: 3,
								commentId: NOTE,
								after: rename,
							},
						],
					},
				},
			} );
			await accept( payloadOf( [ set( 'metadata', rename.metadata ) ] ) );
			expect( errors() ).toEqual( [] );
			expect( attributes().metadata ).toEqual( {
				noteId: [ 5, NOTE ],
				name: 'Hero',
				bindings: { a: 1 },
				suggestion: outer,
			} );
		} );
	} );

	describe( 'when the note and the content disagree', () => {
		const CHANGED =
			'This suggestion no longer matches the post. Reload and try again, or reject it.';
		const GONE =
			'This suggestion is no longer in the post. Reject it to close the note.';

		it( 'refuses a note whose value differs from the proposal shown', async () => {
			const metadata = proposing( { anchor: 'shown' } );
			const { accept, attributes, saves, errors } = setup( { metadata } );
			await accept( payloadOf( [ set( 'anchor', 'stale' ) ] ) );
			expect( attributes() ).toEqual( { tagName: 'div', metadata } );
			expect( saves ).toEqual( [] );
			expect( errors() ).toEqual( [ CHANGED ] );
		} );

		it( 'refuses a note that lacks part of the proposal shown', async () => {
			const metadata = proposing( { anchor: 'intro', tagName: 'main' } );
			const { accept, attributes, saves, errors } = setup( { metadata } );
			await accept( payloadOf( [ set( 'anchor', 'intro' ) ] ) );
			expect( attributes() ).toEqual( { tagName: 'div', metadata } );
			expect( saves ).toEqual( [] );
			expect( errors() ).toEqual( [ CHANGED ] );
		} );

		it( 'refuses a structural note whose proposal was added after it was saved', async () => {
			const metadata = {
				noteId: [ NOTE ],
				suggestion: {
					type: 'pending-insert',
					authorId: 3,
					commentId: NOTE,
					after: { anchor: 'late' },
				},
			};
			const { accept, attributes, saves, errors } = setup( { metadata } );
			await accept(
				payloadOf( [
					{ type: 'block-insert-after', blockName: GROUP },
				] )
			);
			expect( attributes() ).toEqual( { tagName: 'div', metadata } );
			expect( saves ).toEqual( [] );
			expect( errors() ).toEqual( [ CHANGED ] );
		} );

		it( 'refuses a note whose proposal is not on the block', async () => {
			const metadata = { noteId: [ NOTE ] };
			const { accept, attributes, saves, errors } = setup( { metadata } );
			await accept( payloadOf( [ set( 'anchor', 'intro' ) ] ) );
			expect( attributes() ).toEqual( { tagName: 'div', metadata } );
			expect( saves ).toEqual( [] );
			expect( errors() ).toEqual( [ GONE ] );
		} );

		it( 'accepts when the only difference is a value the block already has', async () => {
			const { accept, attributes, errors } = setup( {
				anchor: 'intro',
				metadata: proposing( { tagName: 'main' } ),
			} );
			await accept(
				payloadOf( [
					set( 'tagName', 'main' ),
					set( 'anchor', 'intro', 'old' ),
				] )
			);
			expect( errors() ).toEqual( [] );
			expect( attributes().tagName ).toBe( 'main' );
			expect( attributes().metadata.suggestion ).toBeUndefined();
		} );

		it( 'matches a proposal not yet linked to its note through the block', async () => {
			const { accept, attributes, errors } = setup( {
				metadata: {
					noteId: [ NOTE ],
					suggestion: {
						type: 'pending-attributes',
						authorId: 3,
						after: { anchor: 'intro' },
					},
				},
			} );
			await accept( payloadOf( [ set( 'anchor', 'intro' ) ] ) );
			expect( errors() ).toEqual( [] );
			expect( attributes().anchor ).toBe( 'intro' );
		} );
	} );

	it( 'refuses an unsafe value that rides on a suggested insertion', async () => {
		const metadata = {
			noteId: [ NOTE ],
			suggestion: {
				type: 'pending-insert',
				authorId: 3,
				commentId: NOTE,
				after: { tagName: 'script' },
			},
		};
		const { accept, attributes, saves, errors } = setup( { metadata } );
		await accept(
			payloadOf( [
				{ type: 'block-insert-after', blockName: GROUP },
				set( 'tagName', 'script' ),
			] )
		);
		expect( attributes() ).toEqual( { tagName: 'div', metadata } );
		expect( saves ).toEqual( [] );
		expect( errors() ).toHaveLength( 1 );
	} );

	it( 'refuses an unsafe value nested on another suggestion', async () => {
		const metadata = {
			noteId: [ 5, NOTE ],
			suggestion: {
				type: 'pending-attributes',
				authorId: 4,
				commentId: 5,
				after: { anchor: 'top' },
				nested: [
					{
						type: 'pending-attributes',
						authorId: 3,
						commentId: NOTE,
						after: { tagName: 'iframe' },
					},
				],
			},
		};
		const { accept, attributes, saves, errors } = setup( { metadata } );
		await accept( payloadOf( [ set( 'tagName', 'iframe' ) ] ) );
		expect( attributes() ).toEqual( { tagName: 'div', metadata } );
		expect( saves ).toEqual( [] );
		expect( errors() ).toHaveLength( 1 );
	} );
} );
