/**
 * Accept checks a post-level suggestion against the fields that can be
 * suggested before it edits the post.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import {
	createRegistry,
	createReduxStore,
	RegistryProvider,
} from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { unlock } from '../../../lock-unlock';
import { useSuggestionsProvider } from '../provider';

vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const NOTE = 12;
const PROPOSABLE = [ 'title', 'excerpt', 'featured_media', 'slug', 'tags' ];
const META_KEYS = [ 'rating', 'footnotes' ];

const postOp = ( attribute: string, after: unknown, key?: string ) => ( {
	type: 'post-attribute-set',
	attribute,
	...( key !== undefined ? { key } : {} ),
	before: null,
	after,
} );

function setup() {
	const saves: any[] = [];
	const edits: any[] = [];
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
				getTaxonomies: () => [],
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
	const editor = createReduxStore( 'core/editor', {
		reducer: ( state = {} ) => state,
		actions: {},
		selectors: {},
	} );
	unlock( editor ).registerPrivateActions( {
		applyPostFieldSuggestion: ( applied: any ) => {
			edits.push( applied );
			return { type: 'NOOP' };
		},
		clearPostFieldProposal: () => ( { type: 'NOOP' } ),
	} );
	unlock( editor ).registerPrivateSelectors( {
		getPostFieldProposals: () => ( {} ),
		isProposablePostField: (
			_state: any,
			attribute: string,
			key?: string
		) =>
			attribute === 'meta'
				? META_KEYS.includes( key ?? '' )
				: PROPOSABLE.includes( attribute ),
	} );
	registry.register( editor );
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
		saves,
		edits,
		accept: ( operations: any[] ) =>
			act( async () => {
				await provider.applySuggestion( {
					commentId: NOTE,
					payload: {
						schemaVersion: 2,
						blockName: '',
						baseRevision: null,
						operations,
					},
				} );
			} ),
		errors: () =>
			registry
				.select( noticesStore )
				.getNotices()
				.filter( ( notice: any ) => notice.status === 'error' )
				.map( ( notice: any ) => notice.content ),
	};
}

describe( 'accepting a post-level suggestion', () => {
	it( 'edits the fields that can be suggested', async () => {
		const { accept, edits, errors } = setup();
		await accept( [
			postOp( 'title', 'New title' ),
			postOp( 'featured_media', 7 ),
			postOp( 'tags', [ 3, 4 ] ),
			postOp( 'meta', 'five', 'rating' ),
		] );
		expect( errors() ).toEqual( [] );
		expect( edits ).toEqual( [
			{
				title: 'New title',
				featured_media: 7,
				tags: [ 3, 4 ],
				meta: { rating: 'five' },
			},
		] );
	} );

	it.each( [
		[
			'a field that cannot be suggested',
			[ postOp( 'status', 'publish' ) ],
		],
		[ 'the post content', [ postOp( 'content', '<p>x</p>' ) ] ],
		[
			'a refused field beside an allowed one',
			[ postOp( 'title', 'New title' ), postOp( 'author', 1 ) ],
		],
		[
			'a meta key that is not registered',
			[ postOp( 'meta', 'x', '_edit_lock' ) ],
		],
		[ 'meta with no key', [ postOp( 'meta', { rating: 'five' } ) ] ],
		[
			'meta derived from the content',
			[ postOp( 'meta', '[]', 'footnotes' ) ],
		],
		[
			'a title that is not text',
			[ postOp( 'title', { rendered: 'x' } ) ],
		],
		[
			'a featured image that is not an id',
			[ postOp( 'featured_media', '7' ) ],
		],
		[ 'terms that are not a list', [ postOp( 'tags', '3' ) ] ],
		[
			'a term that is neither an id nor a name',
			[ postOp( 'tags', [ '3' ] ) ],
		],
	] )( 'refuses %s and decides nothing', async ( _label, operations ) => {
		const { accept, edits, saves, errors } = setup();
		await accept( operations );
		expect( edits ).toEqual( [] );
		expect( saves ).toEqual( [] );
		expect( errors() ).toEqual( [
			'This suggestion changes a post setting that cannot be suggested. Reject it to close the note.',
		] );
	} );
} );
