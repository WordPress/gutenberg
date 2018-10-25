/**
 * External dependencies
 */
import { transformSync } from '@babel/core';

/**
 * Internal dependencies
 */
import plugin from '../src';

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

	it( 'does nothing if the scope variable is already imported', () => {
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

		expect( string ).toBe( 'import React from "react";\nlet foo = <bar />;' );
	} );

	it( 'adds import for scope variable even if library is required', () => {
		const original = 'const OtherReact = require("react");\n\nlet foo = <bar />;';
		const string = getTransformedCode( original );

		expect( string ).toBe( 'import React from "react";\n\nconst OtherReact = require("react");\n\nlet foo = <bar />;' );
	} );

	it( 'adds import for scope variable even if variable is defined in a child scope is required', () => {
		const original = 'let foo = <bar />;\n\nfunction x() { const React = require("react"); }';
		const string = getTransformedCode( original );

		expect( string ).toBe( 'import React from "react";\nlet foo = <bar />;\n\nfunction x() {\n  const React = require("react");\n}' );
	} );

	it( 'allows options customization', () => {
		const original = 'let foo = <bar />;';
		const string = getTransformedCode( original, {
			scopeVariable: 'createElement',
			source: '@wordpress/element',
			isDefault: false,
		} );

		expect( string ).toBe( 'import { createElement } from "@wordpress/element";\nlet foo = <bar />;' );
	} );
} );
