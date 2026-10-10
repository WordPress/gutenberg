/**
 * Decisions on suggestions nested across marker kinds: a reject that empties
 * the suggestions inside an addition says so, an accepted deletion inside a
 * formatting change rebases that change's recorded original, and a format
 * reject that cannot restore its original says that too.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import {
	createRegistry,
	createReduxStore,
	RegistryProvider,
} from '@wordpress/data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { speak } from '@wordpress/a11y';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
} from '../../inline-suggestions';
import { useSuggestionsProvider } from '../provider';

vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

vi.mock( '@wordpress/a11y', () => ( { speak: vi.fn() } ) );

const PARAGRAPH = 'core/test-nested-paragraph';
const BOLD = 'test/nested-bold';

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author: number
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

// annezazu's example: A (1) adds, B (2) bolds "red apples" inside it, C (3)
// deletes "apples fell" inside it.
const ANNEZAZU = `Intro.${ mark(
	'add',
	1,
	` Bright ${ mark(
		'format',
		2,
		`<strong>red </strong>${ mark(
			'del',
			3,
			'<strong>apples</strong>',
			3
		) }`,
		2
	) }${ mark( 'del', 3, ' fell', 3 ) }.`,
	1
) }`;

const payload = ( suggestionType: string, extra = {} ) => ( {
	schemaVersion: 2,
	blockName: PARAGRAPH,
	baseRevision: null,
	operations: [
		{
			type: 'inline-suggestion',
			attribute: 'content',
			suggestionType,
			...extra,
		},
	],
} );

const NOTES: Record< number, any > = {
	1: {
		id: 1,
		author: 1,
		meta: { _wp_suggestion: JSON.stringify( payload( 'add' ) ) },
	},
	2: {
		id: 2,
		author: 2,
		meta: {
			_wp_suggestion: JSON.stringify(
				payload( 'format', {
					beforeHTML: 'red apples',
					afterHTML: '<strong>red apples</strong>',
				} )
			),
		},
	},
	3: {
		id: 3,
		author: 3,
		meta: { _wp_suggestion: JSON.stringify( payload( 'del' ) ) },
	},
};

function setup( html: string ) {
	const saved: any[] = [];
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( blockEditorStore );
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEntityRecord:
					( kind: string, name: string, record: any ) => async () => {
						saved.push( record );
						return { id: record.id };
					},
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
	const block = createBlock( PARAGRAPH );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	registry
		.dispatch( blockEditorStore )
		.updateBlockAttributes( block.clientId, {
			content: RichTextData.fromHTMLString( html ),
		} );
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
	const content = () =>
		registry.select( blockEditorStore ).getBlockAttributes( block.clientId )
			?.content;
	return { registry, block, saved, content, provider: () => provider };
}

describe( 'decisions on nested suggestions', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		registerFormatType( BOLD, {
			title: 'Bold',
			tagName: 'strong',
			className: null,
			edit: () => null,
		} as any );
		registerBlockType( PARAGRAPH, {
			apiVersion: 3,
			attributes: {
				content: { type: 'rich-text' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Nested Paragraph',
		} as any );
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		unregisterFormatType( BOLD );
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	it( 'rejecting an addition removes the suggestions inside it and says so', async () => {
		const { block, content, provider } = setup( ANNEZAZU );
		await act( async () => {
			await provider().rejectSuggestion( {
				commentId: 1,
				clientId: block.clientId,
				payload: payload( 'add' ),
			} );
		} );
		expect( content().toHTMLString() ).toBe( 'Intro.' );
		expect( speak ).toHaveBeenCalledWith(
			'2 suggestions on this text are now outdated.'
		);
	} );

	it( 'accepting a deletion inside a formatting change rebases its original', async () => {
		const { block, saved, content, provider } = setup( ANNEZAZU );
		await act( async () => {
			await provider().applySuggestion( {
				commentId: 3,
				clientId: block.clientId,
				payload: payload( 'del' ),
			} );
		} );
		expect( content().text ).toBe( 'Intro. Bright red .' );
		const rebase = saved.find( ( record ) => record.id === 2 );
		expect(
			JSON.parse( rebase.meta._wp_suggestion ).operations[ 0 ]
		).toMatchObject( {
			beforeHTML: 'red ',
			afterHTML: '<strong>red </strong>',
		} );
	} );

	it( 'says when a rejected formatting change could not restore its original', async () => {
		const { block, registry, provider } = setup(
			`a${ mark( 'format', 2, '<strong>bcd</strong>', 2 ) }e`
		);
		await act( async () => {
			await provider().rejectSuggestion( {
				commentId: 2,
				clientId: block.clientId,
				payload: payload( 'format', { beforeHTML: 'bc' } ),
			} );
		} );
		const notices = registry.select( noticesStore ).getNotices();
		expect(
			notices.some(
				( notice: any ) =>
					notice.content ===
					'The original formatting could not be restored.'
			)
		).toBe( true );
	} );
} );
