/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	createRegistry,
	createReduxStore,
	RegistryProvider,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isSuggestionModeEnabled, useCanSuggest } from '../gate';

/*
 * Stub stores expose exactly the selectors the gate reads. Registering
 * stubs (instead of the real editor / core-data stores) keeps the test
 * free of entity bootstrapping.
 */
function createStubRegistry( { postTypeSupports } ) {
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
			reducer: ( state = {} ) => state,
			selectors: {
				getPostType: () =>
					postTypeSupports === undefined
						? null
						: { supports: postTypeSupports },
			},
		} )
	);
	return registry;
}

function renderCanSuggest( registry ) {
	let result;
	function Capture() {
		result = useCanSuggest();
		return null;
	}
	render(
		<RegistryProvider value={ registry }>
			<Capture />
		</RegistryProvider>
	);
	return result;
}

describe( 'suggestion mode gate', () => {
	afterEach( () => {
		delete window.__experimentalSuggestionMode;
	} );

	describe( 'isSuggestionModeEnabled', () => {
		it( 'reflects the experiment flag', () => {
			expect( isSuggestionModeEnabled() ).toBe( false );
			window.__experimentalSuggestionMode = true;
			expect( isSuggestionModeEnabled() ).toBe( true );
		} );
	} );

	describe( 'useCanSuggest', () => {
		it( 'is false when the experiment is off, even with notes support', () => {
			const registry = createStubRegistry( {
				postTypeSupports: { 'editor.notes': true },
			} );
			expect( renderCanSuggest( registry ) ).toBe( false );
		} );

		it( 'is true when the experiment is on and the post type supports notes', () => {
			window.__experimentalSuggestionMode = true;
			const registry = createStubRegistry( {
				postTypeSupports: { 'editor.notes': true },
			} );
			expect( renderCanSuggest( registry ) ).toBe( true );
		} );

		it( 'unwraps the array-wrapped editor support form', () => {
			window.__experimentalSuggestionMode = true;
			const registry = createStubRegistry( {
				postTypeSupports: { editor: [ { notes: true } ] },
			} );
			expect( renderCanSuggest( registry ) ).toBe( true );
		} );

		it( 'is false when the post type does not support notes', () => {
			window.__experimentalSuggestionMode = true;
			const registry = createStubRegistry( {
				postTypeSupports: { editor: true },
			} );
			expect( renderCanSuggest( registry ) ).toBe( false );
		} );

		it( 'is false while the post type record has not resolved', () => {
			window.__experimentalSuggestionMode = true;
			const registry = createStubRegistry( {
				postTypeSupports: undefined,
			} );
			expect( renderCanSuggest( registry ) ).toBe( false );
		} );
	} );
} );
