import { render } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import SuggestionMultiBlockFormatNotice from '../multi-block-format-notice';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const TEST_BLOCK_NAME = 'core/test-multi-block-format';

beforeAll( () => {
	registerBlockType( TEST_BLOCK_NAME, {
		apiVersion: 3,
		title: 'Test block',
		category: 'text',
		attributes: { content: { type: 'string' } },
		save: () => null,
	} );
} );

// Stands in for the writing-flow wrapper, which is the editing host (and the
// event target) while a multi-block selection is live.
function mountHost( hasMultiSelection = true ) {
	const host = document.createElement( 'div' );
	host.dataset.hasMultiSelection = String( hasMultiSelection );
	document.body.appendChild( host );
	return host;
}

function pressBold( target ) {
	target.dispatchEvent(
		new window.KeyboardEvent( 'keydown', {
			key: 'b',
			code: 'KeyB',
			ctrlKey: true,
			bubbles: true,
			cancelable: true,
		} )
	);
}

function setup( { intent = 'suggest', multiSelect = true } = {} ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	unlock( registry.dispatch( editorStore ) ).setEditorIntent( intent );

	const first = createBlock( TEST_BLOCK_NAME, { content: 'Alpha' } );
	const second = createBlock( TEST_BLOCK_NAME, { content: 'Beta' } );
	registry.dispatch( blockEditorStore ).resetBlocks( [ first, second ] );
	if ( multiSelect ) {
		registry
			.dispatch( blockEditorStore )
			.multiSelect( first.clientId, second.clientId );
	} else {
		registry.dispatch( blockEditorStore ).selectBlock( first.clientId );
	}

	render( <SuggestionMultiBlockFormatNotice />, {
		wrapper: ( { children } ) => (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		),
	} );

	return {
		registry,
		// `setEditorIntent` announces the mode change with its own snackbar,
		// so scope the assertions to this component's notice.
		getNotices: () =>
			registry
				.select( noticesStore )
				.getNotices()
				.filter(
					( notice ) =>
						notice.id ===
						'editor/suggestion-mode/multi-block-format'
				),
	};
}

describe( 'SuggestionMultiBlockFormatNotice', () => {
	afterEach( () => {
		document.body.replaceChildren();
	} );

	it( 'explains the refusal when a format shortcut is pressed across blocks', () => {
		const { getNotices } = setup();
		const host = mountHost();

		expect( getNotices() ).toHaveLength( 0 );
		pressBold( host );

		const notices = getNotices();
		expect( notices ).toHaveLength( 1 );
		expect( notices[ 0 ].content ).toBe(
			'Formatting suggestions apply to a selection within a single block.'
		);
		expect( notices[ 0 ].type ).toBe( 'snackbar' );
	} );

	it( 'replaces rather than stacks when the shortcut repeats', () => {
		const { getNotices } = setup();
		const host = mountHost();

		pressBold( host );
		pressBold( host );
		pressBold( host );

		expect( getNotices() ).toHaveLength( 1 );
	} );

	it( 'stays quiet for a single-block selection', () => {
		const { getNotices } = setup( { multiSelect: false } );
		const host = mountHost( false );

		pressBold( host );

		expect( getNotices() ).toHaveLength( 0 );
	} );

	it( 'stays quiet outside Suggest mode', () => {
		const { getNotices } = setup( { intent: 'edit' } );
		const host = mountHost();

		pressBold( host );

		expect( getNotices() ).toHaveLength( 0 );
	} );

	it( 'stays quiet when the shortcut is pressed outside the multi-selection host', () => {
		const { getNotices } = setup();
		// Block selection survives focus moving to the notes sidebar, so a
		// Cmd+B typed into a note reply must not be answered with this.
		const elsewhere = document.createElement( 'div' );
		document.body.appendChild( elsewhere );

		pressBold( elsewhere );

		expect( getNotices() ).toHaveLength( 0 );
	} );

	it( 'ignores keys that are not inline-format shortcuts', () => {
		const { getNotices } = setup();
		const host = mountHost();

		host.dispatchEvent(
			new window.KeyboardEvent( 'keydown', {
				key: 'a',
				code: 'KeyA',
				ctrlKey: true,
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( getNotices() ).toHaveLength( 0 );
	} );
} );
