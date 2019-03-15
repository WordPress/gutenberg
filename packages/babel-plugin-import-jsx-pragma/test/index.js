/**
 * External dependencies
 */
import { transformSync } from '@babel/core';

/**
 * Internal dependencies
 */
import plugin from '../';

describe( 'babel-plugin-import-jsx-pragma', () => {
	function getTransformedCode( source, options = {} ) {
		const { code } = transformSync( source, {
			configFile: false,
			plugins: [
				[ plugin, options ],
				'@babel/plugin-syntax-jsx',
			],
		} );

		return code;
	}

	it( 'does nothing if there is no jsx', () => {
		const original = 'let foo;';
		const string = getTransformedCode( original );

		expect( string ).toBe( original );
	} );

	it( 'does nothing if there scope variable already imported', () => {
		const original = 'import React from "react";\nlet foo = <bar />;';
		const string = getTransformedCode( original );

		expect( string ).toBe( original );
	} );

	it( 'does nothing if the scope variable is already defined', () => {
		const original = 'const React = require("react");\n\nlet foo = <bar />;';
		const string = getTransformedCode( original );

		expect( string ).toBe( original );
	} );

	it( 'adds import for scope variable', () => {
		const original = 'let foo = <bar />;';
		const string = getTransformedCode( original );

		expect( string ).toBe( 'import React from "react";\n' + original );
	} );

	it( 'allows options customization', () => {
		const original = 'let foo = <bar />;';
		const string = getTransformedCode( original, {
			scopeVariable: 'createElement',
			source: '@wordpress/element',
			isDefault: false,
		} );

		expect( string ).toBe( 'import { createElement } from "@wordpress/element";\n' + original );
	} );

	it( 'adds import for scope variable even when defined inside the local scope', () => {
		const original = 'let foo = <bar />;\n\nfunction local() {\n  const createElement = wp.element.createElement;\n}';
		const string = getTransformedCode( original, {
			scopeVariable: 'createElement',
			source: '@wordpress/element',
			isDefault: false,
		} );

		expect( string ).toBe( 'import { createElement } from "@wordpress/element";\n' + original );
	} );

	it( 'does nothing if the outer scope variable is already defined when using custom options', () => {
		const original = 'const {\n  createElement\n} = wp.element;\nlet foo = <bar />;';
		const string = getTransformedCode( original, {
			scopeVariable: 'createElement',
		} );

		expect( string ).toBe( original );
	} );

	it( 'does nothing if the inner scope variable is already defined when using custom options', () => {
		const original = '(function () {\n  const {\n    createElement\n  } = wp.element;\n  let foo = <bar />;\n})();';
		const string = getTransformedCode( original, {
			scopeVariable: 'createElement',
		} );

		expect( string ).toBe( original );
	} );
} );
