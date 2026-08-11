import { render } from '@testing-library/react';
import { registerStyle } from '@wordpress/style-runtime';
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
} );
