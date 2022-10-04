/**
 * Internal dependencies
 */
const engine = require( '../lib/engine' );
const getExportEntries = require( '../lib/get-export-entries' );

/**
 * Parses sample code into testable structure.
 *
 * @param {string} code           Sourcecode to analyze in test.
 * @param {string} [importedCode] Sourcecode for module imported in `code`.
 */
const parse = ( code, importedCode ) =>
	engine(
		'test-code.ts',
		code.trim(),
		importedCode
			? () => engine( 'module-code.ts', importedCode.trim() ).ir
			: undefined
	).tokens;

/**
 * Useful for tests asserting properties on the first (or only) export.
 *
 * @param {string} code           Sourcecode to analyze in test.
 * @param {string} [importedCode] Sourcecode for module imported in `code`.
 */
const firstExport = ( code, importedCode ) =>
	getExportEntries( parse( code, importedCode )[ 0 ] );

describe( 'Export entries', () => {
	it( 'default class (anonymous)', () =>
		expect(
			firstExport( `
				/**
				 * Class declaration example.
				 */
				export default class {}
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: '*default*',
				exportName: 'default',
				module: null,
			} ),
		] ) );

	it( 'default class (named)', () =>
		expect(
			firstExport( `
				/**
				 * Class declaration example.
				 */
				export default class ClassDeclaration {}
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'ClassDeclaration',
				exportName: 'default',
				module: null,
			} ),
		] ) );

	it( 'default function (anonymous)', () =>
		expect(
			firstExport( `
				/**
				 * Function declaration example.
				 */
				export default () => {}
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: '*default*',
				exportName: 'default',
				module: null,
			} ),
		] ) );

	it( 'default function (named)', () =>
		expect(
			firstExport( `
				/**
				 * Function declaration example.
				 */
				export default function myDeclaration() {}
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'myDeclaration',
				exportName: 'default',
				module: null,
			} ),
		] ) );

	it( 'default identifier', () =>
		expect(
			firstExport( `
				/**
				 * Class declaration example.
				 */
				class ClassDeclaration {}

				export default ClassDeclaration;
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'ClassDeclaration',
				exportName: 'default',
				module: null,
			} ),
		] ) );

	it( 'default import (named)', () => {
		const testCode = firstExport(
			`
			/**
			 * Internal dependencies
			 */
			import { functionDeclaration as fnDeclaration } from './module-code';

			export default fnDeclaration;
		`,
			`
			/**
			 * Function declaration.
			 */
			function functionDeclaration() {}

			export default functionDeclaration;
		`
		);
		expect( testCode ).toEqual( [
			expect.objectContaining( {
				localName: 'fnDeclaration',
				exportName: 'default',
				module: null,
			} ),
		] );
	} );

	it( 'default import (default)', () =>
		expect(
			firstExport(
				`
				/**
				 * Internal dependencies
				 */
				import fnDeclaration from './module-code';

				export default fnDeclaration;
			`,
				`
				/**
				 * Function declaration.
				 */
				function functionDeclaration() {}

				export default functionDeclaration;
			`
			)
		).toEqual( [
			expect.objectContaining( {
				localName: 'fnDeclaration',
				exportName: 'default',
				module: null,
			} ),
		] ) );

	it( 'default named export', () => {
		const [ namedExport, defaultExport ] = parse(
			`
			/**
			 * Function declaration example.
			 */
			export function functionDeclaration() {}

			export default functionDeclaration;
		`
		).map( ( token ) => getExportEntries( token ) );
		expect( namedExport ).toEqual( [
			expect.objectContaining( {
				localName: 'functionDeclaration',
				exportName: 'functionDeclaration',
				module: null,
			} ),
		] );
		expect( defaultExport ).toEqual( [
			expect.objectContaining( {
				localName: 'functionDeclaration',
				exportName: 'default',
				module: null,
			} ),
		] );
	} );

	it( 'default variable', () =>
		expect(
			firstExport( `
				/**
				 * Variable declaration example.
				 */
				export default true;
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: '*default*',
				exportName: 'default',
				module: null,
			} ),
		] ) );

	it( 'named class', () =>
		expect(
			firstExport( `
				/**
				 * My declaration example.
				 */
				export class MyDeclaration {}
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'MyDeclaration',
				exportName: 'MyDeclaration',
				module: null,
				lineStart: 4,
				lineEnd: 4,
			} ),
		] ) );

	it( 'named default', () =>
		expect(
			firstExport(
				`
				export { default } from './module-code';
			`,
				`
				/**
				 * Module declaration.
				 */
				export default function () {}
			`
			)
		).toEqual( [
			expect.objectContaining( {
				localName: 'default',
				exportName: 'default',
				module: './module-code',
			} ),
		] ) );

	it( 'named default (exported)', () =>
		expect(
			firstExport(
				`
				export { default as moduleName } from './module-code';
			`,
				`
				/**
				 * Module declaration.
				 */
				export default function () {}
			`
			)
		).toEqual( [
			expect.objectContaining( {
				localName: 'default',
				exportName: 'moduleName',
				module: './module-code',
			} ),
		] ) );

	it( 'named function', () =>
		expect(
			firstExport( `
				/**
				 * My declaration example.
				 */
				export function myDeclaration() {}
			` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'myDeclaration',
				exportName: 'myDeclaration',
				module: null,
			} ),
		] ) );

	it( 'named identifier', () => {
		expect(
			firstExport( `
				/**
				 * My declaration example.
				 */
				function myDeclaration() {}

				export { myDeclaration };
			` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'myDeclaration',
				exportName: 'myDeclaration',
				module: null,
			} ),
		] );

		expect(
			firstExport( `
				/**
				 * My declaration example.
				 */
				const { someDeclaration } = { someDeclaration: () => {} };

				export { someDeclaration as myDeclaration };
			` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'someDeclaration',
				exportName: 'myDeclaration',
				module: null,
			} ),
		] );
	} );

	it( 'named identifiers', () => {
		expect(
			firstExport( `
				/**
				 * Function declaration example.
				 */
				function functionDeclaration() {}

				/**
				 * Class declaration example.
				 */
				class ClassDeclaration {}

				/**
				 * Variable declaration example.
				 */
				const variableDeclaration = true;

				export { functionDeclaration, variableDeclaration, ClassDeclaration };
			` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'functionDeclaration',
				exportName: 'functionDeclaration',
				module: null,
			} ),
			expect.objectContaining( {
				localName: 'variableDeclaration',
				exportName: 'variableDeclaration',
				module: null,
			} ),
			expect.objectContaining( {
				localName: 'ClassDeclaration',
				exportName: 'ClassDeclaration',
				module: null,
			} ),
		] );

		expect(
			parse( `
				/**
				 * Function declaration example.
				 */
				function functionDeclaration() {}

				/**
				 * Class declaration example.
				 */
				class ClassDeclaration {}

				export { functionDeclaration, ClassDeclaration };

				/**
				 * Variable declaration example.
				 */
				export const variableDeclaration = true;
			` ).map( ( token ) => getExportEntries( token ) )
		).toEqual( [
			[
				expect.objectContaining( {
					localName: 'functionDeclaration',
					exportName: 'functionDeclaration',
					module: null,
				} ),
				expect.objectContaining( {
					localName: 'ClassDeclaration',
					exportName: 'ClassDeclaration',
					module: null,
				} ),
			],
			[
				expect.objectContaining( {
					localName: 'variableDeclaration',
					exportName: 'variableDeclaration',
					module: null,
				} ),
			],
		] );
	} );

	it( 'named import namespace', () =>
		expect(
			firstExport(
				`
				/**
				 * Internal dependencies
				 */
				import * as variables from './module-code';

				export { variables };
			`,
				`
				/**
				 * Function declaration example.
				 */
				export default function myDeclaration() {}
			`
			)
		).toEqual( [
			expect.objectContaining( {
				localName: 'variables',
				exportName: 'variables',
				module: null,
			} ),
		] ) );

	it( 'named variable', () =>
		expect(
			firstExport( `
				/**
				 * My declaration example.
				 */
				export const myDeclaration = true;
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'myDeclaration',
				exportName: 'myDeclaration',
				module: null,
			} ),
		] ) );

	it( 'named variables', () =>
		expect(
			firstExport( `
				/**
				 * My declaration example.
				 */
				export const firstDeclaration = true,
					secondDeclaration = 42;
		` )
		).toEqual( [
			expect.objectContaining( {
				localName: 'firstDeclaration',
				exportName: 'firstDeclaration',
				module: null,
			} ),
			expect.objectContaining( {
				localName: 'secondDeclaration',
				exportName: 'secondDeclaration',
				module: null,
			} ),
		] ) );

	it( 'namespace (*)', () => {
		expect(
			firstExport(
				`
				export * from './module-code';
			`,
				`
				/**
				 * Named variable.
				 */
				export const myVariable = true;

				/**
				 * Named function.
				 */
				export const myFunction = () => {};

				/**
				 * Named class.
				 */
				export class MyClass {}

				/**
				 * Default variable declaration.
				 */
				export default 42;
			`
			)
		).toEqual( [
			expect.objectContaining( {
				localName: '*',
				exportName: null,
				module: './module-code',
			} ),
		] );
	} );
} );
