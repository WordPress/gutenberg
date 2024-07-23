/**
 * Internal dependencies
 */
const engine = require( '../lib/engine' );
const getIntermediateRepresentation = require( '../lib/get-intermediate-representation' );

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
			? () => engine( 'module-code.ts', importedCode ).ir
			: undefined
	).ir;

describe( 'Intermediate Representation', () => {
	describe( 'undocumented code', () => {
		it( 'default export on multiple lines', () =>
			expect(
				parse( `
					const myDeclaration = function () {};

					export default myDeclaration;
				` )
			).toEqual( [
				expect.objectContaining( {
					description: 'Undocumented declaration.',
					name: 'default',
					tags: [],
				} ),
			] ) );

		it( 'default export on one line', () =>
			expect(
				parse( `
					// This comment should be ignored.
					export default function () {}
				` )
			).toEqual( [
				expect.objectContaining( {
					description: 'Undocumented declaration.',
					name: 'default',
					tags: [],
				} ),
			] ) );
	} );

	describe( 'JSDoc in export statement', () => {
		describe( 'default export', () => {
			it( 'anonymous class', () =>
				expect(
					parse( `
						/**
						 * Class declaration example.
						 */
						export default class {}
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Class declaration example.',
						name: 'default',
						tags: [],
					} ),
				] ) );

			it( 'named class', () =>
				expect(
					parse( `
						/**
						 * Class declaration example.
						 */
						export default class ClassDeclaration {}
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Class declaration example.',
						name: 'default',
						tags: [],
					} ),
				] ) );

			it( 'anonymous function', () =>
				expect(
					parse( `
						/**
						 * Function declaration example.
						 */
						export default function () {}
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Function declaration example.',
						name: 'default',
						tags: [],
					} ),
				] ) );

			it( 'named function', () =>
				expect(
					parse( `
						/**
						 * Function declaration example.
						 */
						export default function myDeclaration() {}
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Function declaration example.',
						name: 'default',
						tags: [],
					} ),
				] ) );

			it( 'variable', () =>
				expect(
					parse( `
						/**
						 * Variable declaration example.
						 */
						export default true;
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Variable declaration example.',
						name: 'default',
						tags: [],
					} ),
				] ) );
		} );

		describe( 'named export', () => {
			it( 'named class', () =>
				expect(
					parse( `
						/**
						 * My declaration example.
						 */
						export class MyDeclaration {}
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'My declaration example.',
						name: 'MyDeclaration',
						tags: [
							{
								description: '',
								name: '',
								tag: 'type',
								type: 'MyDeclaration',
							},
						],
					} ),
				] ) );

			it( 'named function', () =>
				expect(
					parse( `
						/**
						 * My declaration example.
						 */
						export function myDeclaration() {}
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'My declaration example.',
						name: 'myDeclaration',
						tags: [],
					} ),
				] ) );

			it( 'named variable', () =>
				expect(
					parse( `
						/**
						 * My declaration example.
						 */
						export const myDeclaration = true;
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'My declaration example.',
						name: 'myDeclaration',
						tags: [],
					} ),
				] ) );

			it( 'named variables', () =>
				expect(
					parse( `
						/**
						 * My declaration example.
						 */
						export const firstDeclaration = true,
							 secondDeclaration = 42;
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'My declaration example.',
						name: 'firstDeclaration',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'My declaration example.',
						name: 'secondDeclaration',
						tags: [],
					} ),
				] ) );
		} );
	} );

	describe( 'JSDoc in same file', () => {
		describe( 'default export', () => {
			it( 'named class', () =>
				expect(
					parse( `
						/**
						 * Class declaration example.
						 */
						class ClassDeclaration {}

						export default ClassDeclaration;
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Class declaration example.',
						name: 'default',
						tags: [
							{
								description: '',
								name: '',
								tag: 'type',
								type: 'ClassDeclaration',
							},
						],
					} ),
				] ) );

			it( 'named function', () =>
				expect(
					parse( `
						/**
						 * Function declaration example.
						 */
						export function functionDeclaration() {}

						export default functionDeclaration;
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Function declaration example.',
						name: 'functionDeclaration',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Function declaration example.',
						name: 'default',
						tags: [],
					} ),
				] ) );
		} );

		describe( 'named export', () => {
			it( 'named identifier', () =>
				expect(
					parse( `
						/**
						 * My declaration example.
						 */
						function myDeclaration() {}

						export { myDeclaration };
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'My declaration example.',
						name: 'myDeclaration',
						tags: [],
					} ),
				] ) );

			it( 'named identifier with RestElements', () => {
				expect(
					parse( `
						/**
						 * RestElement example.
						 */
						const { someKey, ...someApi } = { someKey: 2, restOne: 1, restTwo: 2 };

						export {someApi};
					` )
				).toEqual( [
					{
						description: 'RestElement example.',
						lineEnd: 6,
						lineStart: 6,
						name: 'someApi',
						path: 'test-code.ts',
						tags: [],
					},
				] );
			} );

			it( 'named identifier with undocumented RestElement', () => {
				expect(
					parse( `
						const { someKey, ...otherKeys } = { someKey: 2, restOne: 1, restTwo: 2 };

						export const someApi = {};
					` )
				).toEqual( [
					{
						description: 'Undocumented declaration.',
						lineEnd: 3,
						lineStart: 3,
						name: 'someApi',
						path: 'test-code.ts',
						tags: [],
					},
				] );
			} );

			it( 'named identifier with destructuring', () =>
				expect(
					parse( `
						/**
						 * My declaration example.
						 */
						const { someDeclaration } = { someDeclaration: () => {} };

						export { someDeclaration as myDeclaration };
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'My declaration example.',
						name: 'myDeclaration',
						tags: [],
					} ),
				] ) );

			it( 'named identifiers', () =>
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

						/**
						 * Variable declaration example.
						 */
						const variableDeclaration = true;

						export { functionDeclaration, variableDeclaration, ClassDeclaration };
					` )
				).toEqual( [
					expect.objectContaining( {
						description: 'Function declaration example.',
						name: 'functionDeclaration',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Variable declaration example.',
						name: 'variableDeclaration',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Class declaration example.',
						name: 'ClassDeclaration',
						tags: [
							{
								description: '',
								name: '',
								tag: 'type',
								type: 'ClassDeclaration',
							},
						],
					} ),
				] ) );

			it( 'named identifiers and inline', () => {
				const {
					ast,
					tokens: [ firstExport, secondExport ],
				} = engine(
					'test-code.ts',
					`
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
					`
				);

				expect(
					getIntermediateRepresentation( '', firstExport, ast )
				).toEqual( [
					expect.objectContaining( {
						description: 'Function declaration example.',
						name: 'functionDeclaration',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Class declaration example.',
						name: 'ClassDeclaration',
						tags: [
							{
								description: '',
								name: '',
								tag: 'type',
								type: 'ClassDeclaration',
							},
						],
					} ),
				] );

				expect(
					getIntermediateRepresentation( '', secondExport, ast )
				).toEqual( [
					expect.objectContaining( {
						description: 'Variable declaration example.',
						name: 'variableDeclaration',
						tags: [],
					} ),
				] );
			} );
		} );
	} );

	describe( 'JSDoc in module dependency', () => {
		describe( 'named export', () => {
			it( 'named import', () =>
				expect(
					parse(
						`
						export {
							 functionDeclaration,
							 variableDeclaration,
							 ClassDeclaration,
						} from './module-code';
					`,
						`
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
					`
					)
				).toEqual( [
					expect.objectContaining( {
						description: 'Function declaration example.',
						name: 'functionDeclaration',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Variable declaration example.',
						name: 'variableDeclaration',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Class declaration example.',
						name: 'ClassDeclaration',
						tags: [
							{
								description: '',
								name: '',
								tag: 'type',
								type: 'ClassDeclaration',
							},
						],
					} ),
				] ) );
		} );

		describe( 'named default export', () => {
			it( 'default', () =>
				expect(
					parse(
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
						description: 'Module declaration.',
						name: 'default',
						tags: [],
					} ),
				] ) );

			it( 'renamed', () =>
				expect(
					parse(
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
						description: 'Module declaration.',
						name: 'moduleName',
						tags: [],
					} ),
				] ) );
		} );

		describe( 'namespace export', () => {
			it( 'exports', () =>
				expect(
					parse(
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
						description: 'Named variable.',
						name: 'myVariable',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Named function.',
						name: 'myFunction',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Named class.',
						name: 'MyClass',
						tags: [
							{
								description: '',
								name: '',
								tag: 'type',
								type: 'MyClass',
							},
						],
					} ),
				] ) );

			it( 'exports with comment', () =>
				expect(
					parse(
						`
						/**
						 * This comment should be ignored.
						 */
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
						description: 'Named variable.',
						name: 'myVariable',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Named function.',
						name: 'myFunction',
						tags: [],
					} ),
					expect.objectContaining( {
						description: 'Named class.',
						name: 'MyClass',
						tags: [
							{
								description: '',
								name: '',
								tag: 'type',
								type: 'MyClass',
							},
						],
					} ),
				] ) );
		} );
	} );

	describe( 'JSDoc in module dependency through import', () => {
		describe( 'default export', () => {
			it( 'default import', () =>
				expect(
					parse(
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
						description: 'Function declaration.',
						name: 'default',
						tags: [],
					} ),
				] ) );

			it( 'named import', () =>
				expect(
					parse(
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

						export { functionDeclaration };
					`
					)
				).toEqual( [
					expect.objectContaining( {
						description: 'Function declaration.',
						name: 'default',
						tags: [],
					} ),
				] ) );
		} );

		describe( 'named export', () => {
			it( 'namespace import', () => {
				const dependency = engine(
					'named-import-namespace-module.ts',
					`export { default as controls } from './default-function-named';`,
					() =>
						parse( `
							 /**
							  * Function declaration example.
							  */
							 export default function myDeclaration() {}
						` )
				).ir;

				expect(
					engine(
						'test-code.ts',
						`
						/**
						 * Internal dependencies
						 */
						import * as variables from './named-import-namespace-module';

						export { variables };
					`,
						() => dependency
					).ir
				).toEqual( [
					expect.objectContaining( {
						description: 'Undocumented declaration.',
						name: 'variables',
						tags: [],
					} ),
				] );
			} );
		} );
	} );
} );
