import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { registerStyle } from '@wordpress/style-runtime';
import { ContextSystemProvider } from '../../context';
import StyleProvider from '..';

type GlobalScopeWithStyleRuntime = typeof globalThis & {
	__wpStyleRuntime?: unknown;
};

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
		function getStyleNonces( targetDocument: Document ) {
			return Array.from(
				// eslint-disable-next-line testing-library/no-node-access
				targetDocument.head.querySelectorAll( 'style[data-wp-hash]' ),
				( style ) => style.getAttribute( 'nonce' )
			);
		}

		it( 'does not add a nonce to the injected styles by default', () => {
			const iframeDocument = document.implementation.createHTMLDocument();

			render(
				<StyleProvider document={ iframeDocument }>
					<div />
				</StyleProvider>
			);
			registerStyle( 'test-style', '.test-class{color:red;}' );

			expect( getStyleNonces( iframeDocument ) ).toEqual( [ null ] );
		} );

		it( 'adds the `nonce` prop to the injected styles', () => {
			registerStyle( 'replayed-style', '.replayed{color:red;}' );
			const iframeDocument = document.implementation.createHTMLDocument();

			render(
				<StyleProvider document={ iframeDocument } nonce="prop-nonce">
					<div />
				</StyleProvider>
			);
			registerStyle( 'later-style', '.later{color:red;}' );

			expect( getStyleNonces( iframeDocument ) ).toEqual( [
				'prop-nonce',
				'prop-nonce',
			] );
		} );

		it( 'reads the `nonce` from the context system', () => {
			const iframeDocument = document.implementation.createHTMLDocument();

			render(
				<ContextSystemProvider
					value={ { StyleProvider: { nonce: 'context-nonce' } } }
				>
					<StyleProvider document={ iframeDocument }>
						<div />
					</StyleProvider>
				</ContextSystemProvider>
			);
			registerStyle( 'test-style', '.test-class{color:red;}' );

			expect( getStyleNonces( iframeDocument ) ).toEqual( [
				'context-nonce',
			] );
		} );

		it( 'prefers the `nonce` prop over the context system value', () => {
			const iframeDocument = document.implementation.createHTMLDocument();

			render(
				<ContextSystemProvider
					value={ { StyleProvider: { nonce: 'context-nonce' } } }
				>
					<StyleProvider
						document={ iframeDocument }
						nonce="prop-nonce"
					>
						<div />
					</StyleProvider>
				</ContextSystemProvider>
			);
			registerStyle( 'test-style', '.test-class{color:red;}' );

			expect( getStyleNonces( iframeDocument ) ).toEqual( [
				'prop-nonce',
			] );
		} );

		it( 'adds the nonce to styles already injected into the root document', () => {
			// CSS modules register their styles when they are imported, so
			// they reach the root document before any provider renders.
			registerStyle( 'test-style', '.test-class{color:red;}' );
			expect( getStyleNonces( document ) ).toEqual( [ null ] );

			render(
				<StyleProvider document={ document } nonce="root-nonce">
					<div />
				</StyleProvider>
			);

			expect( getStyleNonces( document ) ).toEqual( [ 'root-nonce' ] );
		} );
	} );
} );
