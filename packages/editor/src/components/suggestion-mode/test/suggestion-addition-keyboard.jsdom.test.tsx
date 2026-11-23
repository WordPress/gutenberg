import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { render, act } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getBlockType } from '@wordpress/blocks';
// @ts-expect-error No exported types.
import { __experimentalGetCoreBlocks } from '@wordpress/block-library';
import { RichTextData } from '@wordpress/rich-text';
import SuggestionAdditionKeyboard from '../suggestion-addition-keyboard';
import { SuggestionSessionProvider } from '../suggestion-session';
import { registerSuggestionFormat } from '../../inline-suggestions';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

// The mock factory is hoisted above the imports, so the function it hands
// out has to be created there too.
const { createSuggestion } = vi.hoisted( () => ( {
	createSuggestion: vi.fn(),
} ) );

vi.mock( import( '../provider' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		useSuggestionsProvider: () =>
			( {
				createSuggestion,
				updateSuggestion: vi.fn(),
				deleteSuggestion: vi.fn(),
			} ) as unknown as ReturnType<
				typeof actual.useSuggestionsProvider
			>,
	};
} );

const CELL_KEY = 'body.0.cells.0.content';

beforeAll( () => {
	for ( const name of [ 'core/table', 'core/paragraph' ] ) {
		if ( ! getBlockType( name ) ) {
			__experimentalGetCoreBlocks()
				.find( ( block: any ) => block.name === name )
				.init();
		}
	}
	registerSuggestionFormat();
} );

beforeEach( () => {
	createSuggestion.mockReset();
	createSuggestion.mockResolvedValue( { id: 42 } );
} );

afterEach( () => {
	document.body.innerHTML = '';
} );

/**
 * Mounts the keyboard in Suggestion mode over one block, with the canvas
 * markup of one of its rich-text fields and the caret at the field's end.
 *
 * @param block        The block.
 * @param attributeKey The field's identifier, as the block's edit passes it
 *                     to `RichText`.
 * @param text         The field's text.
 * @return The registry and the field's element.
 */
function mount( block: any, attributeKey: string, text: string ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( coreStore );
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	registry.dispatch( editorStore ).setEditedPost( 'post', 7 as any );
	( registry.dispatch( coreStore ) as any ).receiveCurrentUser( { id: 3 } );
	unlock( registry.dispatch( editorStore ) ).setEditorIntent( 'suggest' );

	const wrapper = document.createElement( 'div' );
	wrapper.setAttribute( 'data-block', block.clientId );
	wrapper.setAttribute( 'data-type', block.name );
	const editable = document.createElement( 'div' );
	editable.className = 'block-editor-rich-text__editable';
	editable.setAttribute( 'data-wp-block-attribute-key', attributeKey );
	const textNode = document.createTextNode( text );
	editable.appendChild( textNode );
	// jsdom does not implement `isContentEditable`.
	Object.defineProperty( editable, 'isContentEditable', { value: true } );
	wrapper.appendChild( editable );
	document.body.appendChild( wrapper );
	document.getSelection()?.collapse( textNode, text.length );

	registry
		.dispatch( blockEditorStore )
		.selectionChange(
			block.clientId,
			attributeKey,
			text.length,
			text.length
		);

	render(
		<RegistryProvider value={ registry }>
			<SuggestionSessionProvider>
				<SuggestionAdditionKeyboard />
			</SuggestionSessionProvider>
		</RegistryProvider>
	);

	return { registry, editable };
}

async function type( editable: HTMLElement, data: string ) {
	const event = new InputEvent( 'beforeinput', {
		inputType: 'insertText',
		data,
		bubbles: true,
		cancelable: true,
	} );
	await act( async () => {
		editable.dispatchEvent( event );
		// The marker is written once the note request resolves.
		for ( let tick = 0; tick < 10; tick++ ) {
			await Promise.resolve();
		}
	} );
	return event;
}

// Suggesting is only offered with the Suggestion mode experiment on.
window.__experimentalSuggestionMode = true;

describe( 'SuggestionAdditionKeyboard', () => {
	it( 'marks text typed into a block attribute', async () => {
		const block = createBlock( 'core/paragraph', {
			content: RichTextData.fromHTMLString( 'Hello' ),
		} );
		const { registry, editable } = mount( block, 'content', 'Hello' );

		const event = await type( editable, '!' );

		expect( event.defaultPrevented ).toBe( true );
		const attributes: any = registry
			.select( blockEditorStore )
			.getBlockAttributes( block.clientId );
		expect( attributes.content.toHTMLString() ).toContain(
			'data-suggestion-id="42"'
		);
	} );

	it.each( [ 'Cell', '' ] )(
		'leaves a table cell (%j) to the block, whose field is not an attribute',
		async ( text ) => {
			const block = createBlock( 'core/table', {
				body: [
					{
						cells: [
							{
								content: RichTextData.fromHTMLString( text ),
								tag: 'td',
							},
						],
					},
				],
			} );
			const { registry, editable } = mount( block, CELL_KEY, text );

			const event = await type( editable, '!' );

			const attributes: any = registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId );
			expect( Object.keys( attributes ) ).not.toContain( CELL_KEY );
			// The native edit goes ahead, and reaches the block through
			// the table's own `onChange`.
			expect( event.defaultPrevented ).toBe( false );
			expect( createSuggestion ).not.toHaveBeenCalled();
		}
	);
} );
