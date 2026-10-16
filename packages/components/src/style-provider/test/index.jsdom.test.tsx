import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { registerStyle } from '@wordpress/style-runtime';
import { ContextSystemProvider } from '../../context';
import InputControl from '../../input-control';
import StyleProvider from '..';

type GlobalScopeWithStyleRuntime = typeof globalThis & {
	__wpStyleRuntime?: unknown;
};

// `InputControl` is styled with Emotion, so it injects styles through the
// Emotion cache that `StyleProvider` creates.
const StyledComponent = () => <InputControl label="Label" />;

function getEmotionStyleNonces( targetDocument: Document ) {
	return Array.from(
		targetDocument.head.querySelectorAll( 'style[data-emotion]' ),
		( style ) => style.getAttribute( 'nonce' )
	);
}

describe( 'StyleProvider', () => {
	const globalScope = globalThis as GlobalScopeWithStyleRuntime;

	afterEach( () => {
		delete globalScope.__wpStyleRuntime;
		document.head.innerHTML = '';
	} );

	it( 'registers the provided document for package style injection', () => {
		render(
			<StyleProvider document={ document }>
				<div />
			</StyleProvider>
		);

		registerStyle( 'test-style', '.test-class{color:red;}' );

		const iframeDocument = document.implementation.createHTMLDocument();

		render(
			<StyleProvider document={ iframeDocument }>
				<div />
			</StyleProvider>
		);

		expect( iframeDocument.head.innerHTML ).toBe(
			'<style data-wp-hash="test-style">.test-class{color:red;}</style>'
		);
	} );

	describe( 'nonce', () => {
		it( 'does not add a nonce to the Emotion styles by default', () => {
			const targetDocument = document.implementation.createHTMLDocument();

			render(
				<StyleProvider document={ targetDocument }>
					<StyledComponent />
				</StyleProvider>
			);

			const nonces = getEmotionStyleNonces( targetDocument );
			expect( nonces.length ).toBeGreaterThan( 0 );
			expect( nonces ).toEqual( nonces.map( () => null ) );
		} );

		it( 'adds the `nonce` prop to the Emotion styles', () => {
			const targetDocument = document.implementation.createHTMLDocument();

			render(
				<StyleProvider document={ targetDocument } nonce="prop-nonce">
					<StyledComponent />
				</StyleProvider>
			);

			const nonces = getEmotionStyleNonces( targetDocument );
			expect( nonces.length ).toBeGreaterThan( 0 );
			expect( nonces ).toEqual( nonces.map( () => 'prop-nonce' ) );
		} );

		it( 'reads the `nonce` from the context system', () => {
			const targetDocument = document.implementation.createHTMLDocument();

			render(
				<ContextSystemProvider
					value={ { StyleProvider: { nonce: 'context-nonce' } } }
				>
					<StyleProvider document={ targetDocument }>
						<StyledComponent />
					</StyleProvider>
				</ContextSystemProvider>
			);

			const nonces = getEmotionStyleNonces( targetDocument );
			expect( nonces.length ).toBeGreaterThan( 0 );
			expect( nonces ).toEqual( nonces.map( () => 'context-nonce' ) );
		} );

		it( 'prefers the `nonce` prop over the context system value', () => {
			const targetDocument = document.implementation.createHTMLDocument();

			render(
				<ContextSystemProvider
					value={ { StyleProvider: { nonce: 'context-nonce' } } }
				>
					<StyleProvider
						document={ targetDocument }
						nonce="prop-nonce"
					>
						<StyledComponent />
					</StyleProvider>
				</ContextSystemProvider>
			);

			const nonces = getEmotionStyleNonces( targetDocument );
			expect( nonces.length ).toBeGreaterThan( 0 );
			expect( nonces ).toEqual( nonces.map( () => 'prop-nonce' ) );
		} );

		it( 'uses a separate Emotion cache for each nonce in the same document', () => {
			const targetDocument = document.implementation.createHTMLDocument();

			render(
				<>
					<StyleProvider document={ targetDocument }>
						<StyledComponent />
					</StyleProvider>
					<StyleProvider document={ targetDocument } nonce="nonce-a">
						<StyledComponent />
					</StyleProvider>
				</>
			);

			const nonces = getEmotionStyleNonces( targetDocument );
			expect( nonces ).toContain( null );
			expect( nonces ).toContain( 'nonce-a' );
		} );
	} );
} );
