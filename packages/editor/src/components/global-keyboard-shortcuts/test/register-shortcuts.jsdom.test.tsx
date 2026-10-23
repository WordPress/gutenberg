import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import {
	createRegistry,
	createReduxStore,
	RegistryProvider,
} from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import EditorKeyboardShortcutsRegister from '../register-shortcuts';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

/*
 * The block-editor half of the registration reads block editor settings,
 * which would drag the whole block editor store into a test about the
 * editor-level shortcut list.
 */
// @ts-expect-error The block editor package is untyped.
vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		BlockEditorKeyboardShortcuts: { Register: () => null },
	};
} );

const INTENT_SHORTCUTS = [
	'core/editor/intent-edit',
	'core/editor/intent-suggest',
	'core/editor/intent-view',
];

/*
 * Stub the two stores the Suggest mode gate reads and register the real
 * keyboard shortcuts store, so the assertions run against the same state
 * the Keyboard Shortcuts help modal renders from. The post type supports
 * live in the stub's state so a test can change them and watch the
 * registration follow.
 */
function createStubRegistry( postTypeSupports: any ) {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core/editor', {
			reducer: ( state = {} ) => state,
			selectors: {
				getEditedPostAttribute: () => 'post',
			},
		} )
	);
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = { supports: postTypeSupports }, action ) =>
				action.type === 'SET_SUPPORTS'
					? { supports: action.supports }
					: state,
			actions: {
				setPostTypeSupports: ( supports: any ) => ( {
					type: 'SET_SUPPORTS',
					supports,
				} ),
			},
			selectors: {
				getPostType: ( state: any ) =>
					state.supports === undefined
						? null
						: { supports: state.supports },
			},
		} )
	);
	registry.register( keyboardShortcutsStore );
	return registry;
}

function registeredIntentShortcuts( registry: any ) {
	return INTENT_SHORTCUTS.filter( ( name ) =>
		registry
			.select( keyboardShortcutsStore )
			.getShortcutKeyCombination( name )
	);
}

/*
 * The untyped .js component's inferred type is not a valid JSX component to
 * the checker; the alias keeps the render call sites clean.
 */
const AnyEditorKeyboardShortcutsRegister: any = EditorKeyboardShortcutsRegister;

function renderRegister( registry: any ) {
	return render(
		<RegistryProvider value={ registry }>
			<AnyEditorKeyboardShortcutsRegister />
		</RegistryProvider>
	);
}

describe( 'EditorKeyboardShortcutsRegister', () => {
	afterEach( () => {
		delete window.__experimentalSuggestionMode;
	} );

	it( 'registers the intent shortcuts when the post type can host suggestions', () => {
		window.__experimentalSuggestionMode = true;
		const registry = createStubRegistry( { 'editor.notes': true } );

		renderRegister( registry );

		expect( registeredIntentShortcuts( registry ) ).toEqual(
			INTENT_SHORTCUTS
		);
		expect(
			registry
				.select( keyboardShortcutsStore )
				.getShortcutDescription( 'core/editor/intent-suggest' )
		).toBe( 'Switch to Suggest mode.' );
	} );

	it( 'leaves the intent shortcuts unregistered when the post type has no notes support', () => {
		window.__experimentalSuggestionMode = true;
		const registry = createStubRegistry( { editor: true } );

		renderRegister( registry );

		/*
		 * The rest of the editor shortcuts still register, so an empty
		 * intent list means the component ran and skipped them rather
		 * than never having registered anything at all.
		 */
		expect(
			registry
				.select( keyboardShortcutsStore )
				.getShortcutKeyCombination( 'core/editor/keyboard-shortcuts' )
		).toEqual( { modifier: 'access', character: 'h' } );
		expect( registeredIntentShortcuts( registry ) ).toEqual( [] );
	} );

	it( 'leaves the intent shortcuts unregistered when the experiment is off', () => {
		const registry = createStubRegistry( { 'editor.notes': true } );

		renderRegister( registry );

		expect( registeredIntentShortcuts( registry ) ).toEqual( [] );
	} );

	it( 'removes the intent shortcuts when notes support goes away', () => {
		window.__experimentalSuggestionMode = true;
		const registry = createStubRegistry( { 'editor.notes': true } );

		renderRegister( registry );
		expect( registeredIntentShortcuts( registry ) ).toEqual(
			INTENT_SHORTCUTS
		);

		act( () => {
			registry.dispatch( 'core' ).setPostTypeSupports( { editor: true } );
		} );

		expect( registeredIntentShortcuts( registry ) ).toEqual( [] );
	} );

	it( 'removes the intent shortcuts when the editor unmounts', () => {
		window.__experimentalSuggestionMode = true;
		const registry = createStubRegistry( { 'editor.notes': true } );

		const { unmount } = renderRegister( registry );
		expect( registeredIntentShortcuts( registry ) ).toEqual(
			INTENT_SHORTCUTS
		);

		// The shortcuts store outlives the component, so a set left behind
		// would still be advertised to whatever mounts into it next.
		unmount();

		expect( registeredIntentShortcuts( registry ) ).toEqual( [] );
	} );
} );
