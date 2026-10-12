import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import SuggestionActions, {
	SuggestionActionButtons,
	useSuggestionDecision,
} from '../suggestion-actions';
import { registerSuggestionFormat } from '../../inline-suggestions';
import { store as editorStore } from '../../../store';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const decisions = vi.hoisted( () => ( {
	applySuggestion: vi.fn( async () => {} ),
	rejectSuggestion: vi.fn( async () => {} ),
} ) );

// The signed-in user, as `/wp/v2/users/me` answers.
const session = vi.hoisted( () => ( { currentUserId: 1 } ) );

vi.mock(
	import( '../../suggestion-mode/provider' ),
	async ( importOriginal ) => {
		const original = await importOriginal();
		return {
			...original,
			useSuggestionsProvider: () => decisions,
		} as unknown as typeof original;
	}
);

vi.mock( import( '@wordpress/api-fetch' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		default: vi.fn( async ( { path, parse }: any ) => {
			let body: any = {};
			if ( path?.includes( '/users/me' ) ) {
				body = { id: session.currentUserId };
			} else if ( path?.includes( '/users/5' ) ) {
				body = { id: 5, name: 'Riley' };
			}
			// The entity resolver asks for the raw response.
			return parse === false
				? new window.Response( JSON.stringify( body ) )
				: body;
		} ),
	} as unknown as typeof original;
} );

const BLOCK = 'test/suggestion-actions-block';
const NOTE_ID = 9;
const DECIDER_ID = 5;
const MARKED = `Hello <mark class="wp-suggestion-add" data-suggestion-id="${ NOTE_ID }" data-suggestion-type="add" data-author="2">world</mark>`;

beforeAll( () => {
	registerBlockType( BLOCK, {
		apiVersion: 3,
		title: 'Suggestion actions block',
		category: 'text',
		attributes: {
			content: { type: 'rich-text', source: 'rich-text' },
			metadata: { type: 'object' },
		},
		save: () => null,
	} );
	registerSuggestionFormat();
} );

afterAll( () => {
	getBlockTypes()
		.filter( ( { name } ) => name === BLOCK )
		.forEach( ( { name } ) => unregisterBlockType( name ) );
} );

function Harness( {
	thread,
	onReopen,
}: {
	thread: any;
	onReopen: () => void;
} ) {
	const decision = useSuggestionDecision( thread );
	return (
		<>
			<SuggestionActionButtons decision={ decision } />
			<SuggestionActions
				thread={ thread }
				decision={ decision }
				onReopen={ onReopen }
			/>
		</>
	);
}

async function setup( {
	status,
	commentStatus = 'hold',
	anchored,
	currentUserId = 1,
}: {
	status?: string;
	commentStatus?: string;
	anchored: boolean;
	currentUserId?: number;
} ) {
	session.currentUserId = currentUserId;
	const registry = createRegistry();
	registry.register( coreStore );
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	( registry.dispatch( coreStore ) as any ).receiveCurrentUser( {
		id: currentUserId,
	} );

	const block = createBlock( BLOCK, {
		content: RichTextData.fromHTMLString(
			anchored ? MARKED : 'Hello world'
		),
		metadata: { noteId: [ NOTE_ID ] },
	} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

	const thread = {
		id: NOTE_ID,
		parent: 0,
		author: 2,
		status: commentStatus,
		blockClientId: block.clientId,
		meta: {
			_wp_suggestion: JSON.stringify( {
				schemaVersion: 2,
				operations: [
					{
						type: 'inline-suggestion',
						attribute: 'content',
						suggestionType: 'add',
					},
				],
			} ),
			...( status && { _wp_suggestion_status: status } ),
			...( status &&
				status !== 'pending' && {
					_wp_suggestion_decided_by: DECIDER_ID,
				} ),
		},
	};
	const onReopen = vi.fn();
	render(
		<RegistryProvider value={ registry }>
			<Harness thread={ thread } onReopen={ onReopen } />
		</RegistryProvider>
	);
	// Let the selectors' resolvers settle.
	await waitFor( () =>
		expect(
			( registry.select( coreStore ) as any ).getCurrentUser()?.id
		).toBe( currentUserId )
	);
	return { onReopen };
}

const button = ( name: string ) => screen.queryByRole( 'button', { name } );

describe( 'SuggestionActions states', () => {
	it( 'pending, anchor present: Accept and Reject', async () => {
		await setup( { anchored: true } );

		expect( button( 'Accept suggestion' ) ).not.toBeNull();
		expect( button( 'Reject suggestion' ) ).not.toBeNull();
		expect( screen.queryByText( /not saved/ ) ).not.toBeInTheDocument();
	} );

	it( 'pending, anchor absent: Accept and Reject as before', async () => {
		await setup( { anchored: false } );

		expect( button( 'Accept suggestion' ) ).not.toBeNull();
		expect( button( 'Apply again' ) ).toBeNull();
	} );

	it( 'decided but not saved, anchor present: pending again, with a hint', async () => {
		await setup( { status: 'applied-unsaved', anchored: true } );

		expect( button( 'Accept suggestion' ) ).not.toBeNull();
		expect( button( 'Reject suggestion' ) ).not.toBeNull();
		expect(
			await screen.findByText(
				'Riley accepted this suggestion, but the post was not saved.'
			)
		).toBeInTheDocument();
	} );

	it( 'names the current user as "You"', async () => {
		await setup( {
			status: 'rejected-unsaved',
			anchored: true,
			currentUserId: DECIDER_ID,
		} );

		expect(
			screen.getByText(
				'You rejected this suggestion, but the post was not saved.'
			)
		).toBeInTheDocument();
	} );

	it( 'decided but not saved, anchor absent: asks for a save, no buttons', async () => {
		await setup( { status: 'applied-unsaved', anchored: false } );

		expect( screen.getByText( 'Applied' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Save the post to keep this decision.' )
		).toBeInTheDocument();
		expect( button( 'Accept suggestion' ) ).toBeNull();
		expect( button( 'Reject suggestion' ) ).toBeNull();
	} );

	it( 'final, anchor present: Apply again, Reject again and Reopen', async () => {
		const { onReopen } = await setup( {
			status: 'applied',
			commentStatus: 'approved',
			anchored: true,
		} );

		expect(
			screen.getByText( 'Applied, but the change is not in the post.' )
		).toBeInTheDocument();
		expect( button( 'Accept suggestion' ) ).toBeNull();

		fireEvent.click( button( 'Apply again' )! );
		expect( decisions.applySuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( { commentId: NOTE_ID } )
		);
		await waitFor( () =>
			expect(
				button( 'Reject again' )?.getAttribute( 'aria-disabled' )
			).not.toBe( 'true' )
		);
		fireEvent.click( button( 'Reject again' )! );
		expect( decisions.rejectSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( { commentId: NOTE_ID } )
		);
		await waitFor( () =>
			expect(
				button( 'Reopen' )?.getAttribute( 'aria-disabled' )
			).not.toBe( 'true' )
		);
		fireEvent.click( button( 'Reopen' )! );
		expect( onReopen ).toHaveBeenCalled();
	} );

	it( 'final rejection, anchor present: says the suggestion is still there', async () => {
		await setup( {
			status: 'rejected',
			commentStatus: 'approved',
			anchored: true,
		} );

		expect(
			screen.getByText(
				'Rejected, but the suggestion is still in the post.'
			)
		).toBeInTheDocument();
	} );

	it( 'final, anchor absent: the decision only', async () => {
		await setup( {
			status: 'applied',
			commentStatus: 'approved',
			anchored: false,
		} );

		expect( screen.getByText( 'Applied' ) ).toBeInTheDocument();
		expect( button( 'Apply again' ) ).toBeNull();
		expect( button( 'Reopen' ) ).toBeNull();
		expect( button( 'Accept suggestion' ) ).toBeNull();
	} );

	it( 'outdated: says why, and can be reopened', async () => {
		const { onReopen } = await setup( {
			status: 'outdated',
			commentStatus: 'approved',
			anchored: false,
		} );

		expect(
			screen.getByText( 'No longer applies - the text was removed.' )
		).toBeInTheDocument();
		expect( button( 'Accept suggestion' ) ).toBeNull();
		fireEvent.click( button( 'Reopen' )! );
		expect( onReopen ).toHaveBeenCalled();
	} );
} );
