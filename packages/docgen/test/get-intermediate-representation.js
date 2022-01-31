/**
 * Internal dependencies
 */
const getIntermediateRepresentation = require( '../lib/get-intermediate-representation' );

describe( 'Intermediate Representation', () => {
	describe( 'undocumented code', () => {
		it( 'default export on multiple lines', () => {
			const ir = getIntermediateRepresentation(
				null,
				require( './fixtures/default-undocumented-nocomments/exports.json' )
			);
			expect( ir ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Undocumented declaration.",
			    "lineEnd": 3,
			    "lineStart": 3,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
		} );
		it( 'default export on one line', () => {
			const irOneliner = getIntermediateRepresentation(
				null,
				require( './fixtures/default-undocumented-oneliner/exports.json' )
			);
			expect( irOneliner ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Undocumented declaration.",
			    "lineEnd": 2,
			    "lineStart": 2,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
		} );
	} );

	describe( 'JSDoc in export statement', () => {
		describe( 'default export', () => {
			it( 'anonymous class', () => {
				const irClassAnonymous = getIntermediateRepresentation(
					null,
					require( './fixtures/default-class-anonymous/exports.json' )
				);
				expect( irClassAnonymous ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'named class', () => {
				const irClassNamed = getIntermediateRepresentation(
					null,
					require( './fixtures/default-class-named/exports.json' )
				);
				expect( irClassNamed ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'anonymous function', () => {
				const irFnAnonymous = getIntermediateRepresentation(
					null,
					require( './fixtures/default-function-anonymous/exports.json' )
				);
				expect( irFnAnonymous ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'named function', () => {
				const irFnNamed = getIntermediateRepresentation(
					null,
					require( './fixtures/default-function-named/exports.json' )
				);
				expect( irFnNamed ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'variable', () => {
				const irVar = getIntermediateRepresentation(
					null,
					require( './fixtures/default-variable/exports.json' )
				);
				expect( irVar ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Variable declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );
		describe( 'named export', () => {
			it( 'named class', () => {
				const irNamedClass = getIntermediateRepresentation(
					null,
					require( './fixtures/named-class/exports.json' )
				);
				expect( irNamedClass ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "MyDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": "MyDeclaration",
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named function', () => {
				const irNamedFn = getIntermediateRepresentation(
					null,
					require( './fixtures/named-function/exports.json' )
				);
				expect( irNamedFn ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'named variable', () => {
				const irNamedVar = getIntermediateRepresentation(
					null,
					require( './fixtures/named-variable/exports.json' )
				);
				expect( irNamedVar ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'named variables', () => {
				const irNamedVars = getIntermediateRepresentation(
					null,
					require( './fixtures/named-variables/exports.json' )
				);
				expect( irNamedVars ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 5,
			    "lineStart": 4,
			    "name": "firstDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 5,
			    "lineStart": 4,
			    "name": "secondDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );
	} );

	describe( 'JSDoc in same file', () => {
		describe( 'default export', () => {
			it( 'named class', () => {
				const irDefaultId = getIntermediateRepresentation(
					null,
					require( './fixtures/default-identifier/exports.json' ),
					require( './fixtures/default-identifier/ast.json' )
				);
				expect( irDefaultId ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 6,
			    "lineStart": 6,
			    "name": "default",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": "ClassDeclaration",
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named function', () => {
				const namedExport = require( './fixtures/default-named-export/exports.json' );
				const namedExportAST = require( './fixtures/default-named-export/ast.json' );
				const irDefaultNamed0 = getIntermediateRepresentation(
					null,
					namedExport[ 0 ],
					namedExportAST
				);
				expect( irDefaultNamed0 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "functionDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
				const irDefaultNamed1 = getIntermediateRepresentation(
					null,
					namedExport[ 1 ],
					namedExportAST
				);
				expect( irDefaultNamed1 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 6,
			    "lineStart": 6,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );

		describe( 'named export', () => {
			it( 'named identifier', () => {
				const irNamedId = getIntermediateRepresentation(
					null,
					require( './fixtures/named-identifier/exports.json' ),
					require( './fixtures/named-identifier/ast.json' )
				);
				expect( irNamedId ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 6,
			    "lineStart": 6,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'named identifier with destructuring', () => {
				const irNamedIdDestructuring = getIntermediateRepresentation(
					null,
					require( './fixtures/named-identifier-destructuring/exports.json' ),
					require( './fixtures/named-identifier-destructuring/ast.json' )
				);
				expect( irNamedIdDestructuring ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 6,
			    "lineStart": 6,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'named identifiers', () => {
				const irIds = getIntermediateRepresentation(
					null,
					require( './fixtures/named-identifiers/exports.json' ),
					require( './fixtures/named-identifiers/ast.json' )
				);
				expect( irIds ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 16,
			    "lineStart": 16,
			    "name": "functionDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Variable declaration example.",
			    "lineEnd": 16,
			    "lineStart": 16,
			    "name": "variableDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 16,
			    "lineStart": 16,
			    "name": "ClassDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": "ClassDeclaration",
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named identifiers and inline', () => {
				const foo = require( './fixtures/named-identifiers-and-inline/exports.json' );
				const bar = require( './fixtures/named-identifiers-and-inline/ast.json' );
				const irIdInline0 = getIntermediateRepresentation(
					null,
					foo[ 0 ],
					bar
				);
				expect( irIdInline0 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 11,
			    "lineStart": 11,
			    "name": "functionDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 11,
			    "lineStart": 11,
			    "name": "ClassDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": "ClassDeclaration",
			      },
			    ],
			  },
			]
		` );
				const irIdInline1 = getIntermediateRepresentation(
					null,
					foo[ 1 ],
					bar
				);
				expect( irIdInline1 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Variable declaration example.",
			    "lineEnd": 16,
			    "lineStart": 16,
			    "name": "variableDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );
	} );

	describe( 'JSDoc in module dependency', () => {
		describe( 'named export', () => {
			it( 'named import', () => {
				const ir = getIntermediateRepresentation(
					null,
					require( './fixtures/named-import-named/exports.json' ),
					{ body: [] },
					() => require( './fixtures/named-identifiers/ir.json' )
				);
				expect( ir ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 2,
			    "lineStart": 2,
			    "name": "functionDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Variable declaration example.",
			    "lineEnd": 3,
			    "lineStart": 3,
			    "name": "variableDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "ClassDeclaration",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );

		describe( 'named default export', () => {
			it( 'default', () => {
				const irNamedDefault = getIntermediateRepresentation(
					null,
					require( './fixtures/named-default/exports.json' ),
					{ body: [] },
					() => require( './fixtures/named-default/module-ir.json' )
				);
				expect( irNamedDefault ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Module declaration.",
			    "lineEnd": 1,
			    "lineStart": 1,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'renamed', () => {
				const irNamedDefaultExported = getIntermediateRepresentation(
					null,
					require( './fixtures/named-default-exported/exports.json' ),
					{ body: [] },
					() => require( './fixtures/named-default/module-ir.json' )
				);
				expect( irNamedDefaultExported ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Module declaration.",
			    "lineEnd": 1,
			    "lineStart": 1,
			    "name": "moduleName",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );

		describe( 'namespace export', () => {
			const getModule = () =>
				require( './fixtures/namespace/module-ir.json' );
			it( 'exports', () => {
				const irNamespace = getIntermediateRepresentation(
					null,
					require( './fixtures/namespace/exports.json' ),
					{ body: [] },
					getModule
				);
				expect( irNamespace ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Named class.",
			    "lineEnd": 1,
			    "lineStart": 1,
			    "name": "MyClass",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Named function.",
			    "lineEnd": 1,
			    "lineStart": 1,
			    "name": "myFunction",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Named variable.",
			    "lineEnd": 1,
			    "lineStart": 1,
			    "name": "myVariable",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'exports with comment', () => {
				const irNamespaceCommented = getIntermediateRepresentation(
					null,
					require( './fixtures/namespace-commented/exports.json' ),
					{ body: [] },
					getModule
				);
				expect( irNamespaceCommented ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Named class.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "MyClass",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Named function.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "myFunction",
			    "path": null,
			    "tags": Array [],
			  },
			  Object {
			    "description": "Named variable.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "myVariable",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );
	} );

	describe( 'JSDoc in module dependency through import', () => {
		describe( 'default export', () => {
			it( 'default import', () => {
				const irDefault = getIntermediateRepresentation(
					null,
					require( './fixtures/default-import-default/exports.json' ),
					require( './fixtures/default-import-default/ast.json' ),
					() =>
						require( './fixtures/default-import-default/module-ir.json' )
				);
				expect( irDefault ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration.",
			    "lineEnd": 3,
			    "lineStart": 3,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
			it( 'named import', () => {
				const irNamed = getIntermediateRepresentation(
					null,
					require( './fixtures/default-import-named/exports.json' ),
					require( './fixtures/default-import-named/ast.json' ),
					() =>
						require( './fixtures/default-import-named/module-ir.json' )
				);
				expect( irNamed ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration.",
			    "lineEnd": 3,
			    "lineStart": 3,
			    "name": "default",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );

		describe( 'named export', () => {
			it( 'namespace import', () => {
				const getModuleImportNamespace = ( filePath ) => {
					if ( filePath === './named-import-namespace-module' ) {
						return require( './fixtures/named-import-namespace/module-ir.json' );
					}
					return require( './fixtures/default-function/ir.json' );
				};
				const ir = getIntermediateRepresentation(
					null,
					require( './fixtures/named-import-namespace/exports.json' ),
					require( './fixtures/named-import-namespace/ast.json' ),
					getModuleImportNamespace
				);
				expect( ir ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Undocumented declaration.",
			    "lineEnd": 3,
			    "lineStart": 3,
			    "name": "variables",
			    "path": null,
			    "tags": Array [],
			  },
			]
		` );
			} );
		} );
	} );
} );
