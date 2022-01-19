/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const getIntermediateRepresentation = require( '../lib/get-intermediate-representation' );

describe( 'Intermediate Representation', () => {
	describe( 'undocumented code', () => {
		it( 'default export on multiple lines', () => {
			const token = fs.readFileSync(
				path.join(
					__dirname,
					'./fixtures/default-undocumented-nocomments/exports.json'
				),
				'utf-8'
			);
			const ir = getIntermediateRepresentation(
				null,
				JSON.parse( token )
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
			const tokenOneliner = fs.readFileSync(
				path.join(
					__dirname,
					'./fixtures/default-undocumented-oneliner/exports.json'
				),
				'utf-8'
			);
			const irOneliner = getIntermediateRepresentation(
				null,
				JSON.parse( tokenOneliner )
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
				const tokenClassAnonymous = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-class-anonymous/exports.json'
					),
					'utf-8'
				);
				const irClassAnonymous = getIntermediateRepresentation(
					null,
					JSON.parse( tokenClassAnonymous )
				);
				expect( irClassAnonymous ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named class', () => {
				const tokenClassNamed = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-class-named/exports.json'
					),
					'utf-8'
				);
				const irClassNamed = getIntermediateRepresentation(
					null,
					JSON.parse( tokenClassNamed )
				);
				expect( irClassNamed ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Class declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'anonymous function', () => {
				const tokenFnAnonymous = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-function-anonymous/exports.json'
					),
					'utf-8'
				);
				const irFnAnonymous = getIntermediateRepresentation(
					null,
					JSON.parse( tokenFnAnonymous )
				);
				expect( irFnAnonymous ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named function', () => {
				const tokenFnNamed = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-function-named/exports.json'
					),
					'utf-8'
				);
				const irFnNamed = getIntermediateRepresentation(
					null,
					JSON.parse( tokenFnNamed )
				);
				expect( irFnNamed ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'variable', () => {
				const tokenVariable = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-variable/exports.json'
					),
					'utf-8'
				);
				const irVar = getIntermediateRepresentation(
					null,
					JSON.parse( tokenVariable )
				);
				expect( irVar ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Variable declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "default",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
		} );
		describe( 'named export', () => {
			it( 'named class', () => {
				const tokenClass = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-class/exports.json'
					),
					'utf-8'
				);
				const irNamedClass = getIntermediateRepresentation(
					null,
					JSON.parse( tokenClass )
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
				const tokenFn = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-function/exports.json'
					),
					'utf-8'
				);
				const irNamedFn = getIntermediateRepresentation(
					null,
					JSON.parse( tokenFn )
				);
				expect( irNamedFn ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named variable', () => {
				const tokenVariable = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-variable/exports.json'
					),
					'utf-8'
				);
				const irNamedVar = getIntermediateRepresentation(
					null,
					JSON.parse( tokenVariable )
				);
				expect( irNamedVar ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named variables', () => {
				const tokenVariables = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-variables/exports.json'
					),
					'utf-8'
				);
				const irNamedVars = getIntermediateRepresentation(
					null,
					JSON.parse( tokenVariables )
				);
				expect( irNamedVars ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 5,
			    "lineStart": 4,
			    "name": "firstDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 5,
			    "lineStart": 4,
			    "name": "secondDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
		} );
	} );

	describe( 'JSDoc in same file', () => {
		describe( 'default export', () => {
			it( 'named class', () => {
				const token = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-identifier/exports.json'
					),
					'utf-8'
				);
				const ast = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-identifier/ast.json'
					),
					'utf-8'
				);
				const irDefaultId = getIntermediateRepresentation(
					null,
					JSON.parse( token ),
					JSON.parse( ast )
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
				const namedExport = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-named-export/exports.json'
					),
					'utf-8'
				);
				const namedExportAST = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-named-export/ast.json'
					),
					'utf-8'
				);
				const irDefaultNamed0 = getIntermediateRepresentation(
					null,
					JSON.parse( namedExport )[ 0 ],
					JSON.parse( namedExportAST )
				);
				expect( irDefaultNamed0 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 4,
			    "lineStart": 4,
			    "name": "functionDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
				const irDefaultNamed1 = getIntermediateRepresentation(
					null,
					JSON.parse( namedExport )[ 1 ],
					JSON.parse( namedExportAST )
				);
				expect( irDefaultNamed1 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 6,
			    "lineStart": 6,
			    "name": "default",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
		} );

		describe( 'named export', () => {
			it( 'named identifier', () => {
				const token = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifier/exports.json'
					),
					'utf-8'
				);
				const ast = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifier/ast.json'
					),
					'utf-8'
				);
				const irNamedId = getIntermediateRepresentation(
					null,
					JSON.parse( token ),
					JSON.parse( ast )
				);
				expect( irNamedId ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 6,
			    "lineStart": 6,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named identifier with destructuring', () => {
				const tokenObject = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifier-destructuring/exports.json'
					),
					'utf-8'
				);
				const astObject = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifier-destructuring/ast.json'
					),
					'utf-8'
				);
				const irNamedIdDestructuring = getIntermediateRepresentation(
					null,
					JSON.parse( tokenObject ),
					JSON.parse( astObject )
				);
				expect( irNamedIdDestructuring ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "My declaration example.",
			    "lineEnd": 6,
			    "lineStart": 6,
			    "name": "myDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
			it( 'named identifiers', () => {
				const tokens = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifiers/exports.json'
					),
					'utf-8'
				);
				const asts = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifiers/ast.json'
					),
					'utf-8'
				);
				const irIds = getIntermediateRepresentation(
					null,
					JSON.parse( tokens ),
					JSON.parse( asts )
				);
				expect( irIds ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 16,
			    "lineStart": 16,
			    "name": "functionDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			  Object {
			    "description": "Variable declaration example.",
			    "lineEnd": 16,
			    "lineStart": 16,
			    "name": "variableDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
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
				const foo = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifiers-and-inline/exports.json'
					),
					'utf-8'
				);
				const bar = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-identifiers-and-inline/ast.json'
					),
					'utf-8'
				);
				const irIdInline0 = getIntermediateRepresentation(
					null,
					JSON.parse( foo )[ 0 ],
					JSON.parse( bar )
				);
				expect( irIdInline0 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Function declaration example.",
			    "lineEnd": 11,
			    "lineStart": 11,
			    "name": "functionDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
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
					JSON.parse( foo )[ 1 ],
					JSON.parse( bar )
				);
				expect( irIdInline1 ).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "description": "Variable declaration example.",
			    "lineEnd": 16,
			    "lineStart": 16,
			    "name": "variableDeclaration",
			    "path": null,
			    "tags": Array [
			      Object {
			        "description": "",
			        "name": "",
			        "tag": "type",
			        "type": undefined,
			      },
			    ],
			  },
			]
		` );
			} );
		} );
	} );

	describe( 'JSDoc in module dependency', () => {
		describe( 'named export', () => {
			it( 'named import', () => {
				const tokenImportNamed = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-import-named/exports.json'
					),
					'utf-8'
				);
				const getModuleImportNamed = () =>
					JSON.parse(
						fs.readFileSync(
							path.join(
								__dirname,
								'./fixtures/named-identifiers/ir.json'
							),
							'utf-8'
						)
					);
				const ir = getIntermediateRepresentation(
					null,
					JSON.parse( tokenImportNamed ),
					{ body: [] },
					getModuleImportNamed
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
			const getModule = () =>
				JSON.parse(
					fs.readFileSync(
						path.join(
							__dirname,
							'./fixtures/named-default/module-ir.json'
						),
						'utf-8'
					)
				);
			it( 'default', () => {
				const tokenDefault = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-default/exports.json'
					),
					'utf-8'
				);
				const irNamedDefault = getIntermediateRepresentation(
					null,
					JSON.parse( tokenDefault ),
					{ body: [] },
					getModule
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
				const tokenDefaultExported = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-default-exported/exports.json'
					),
					'utf-8'
				);
				const irNamedDefaultExported = getIntermediateRepresentation(
					null,
					JSON.parse( tokenDefaultExported ),
					{ body: [] },
					getModule
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
				JSON.parse(
					fs.readFileSync(
						path.join(
							__dirname,
							'./fixtures/namespace/module-ir.json'
						),
						'utf-8'
					)
				);
			it( 'exports', () => {
				const token = fs.readFileSync(
					path.join( __dirname, './fixtures/namespace/exports.json' ),
					'utf-8'
				);
				const irNamespace = getIntermediateRepresentation(
					null,
					JSON.parse( token ),
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
				const tokenCommented = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/namespace-commented/exports.json'
					),
					'utf-8'
				);
				const irNamespaceCommented = getIntermediateRepresentation(
					null,
					JSON.parse( tokenCommented ),
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
				const tokenDefault = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-import-default/exports.json'
					),
					'utf-8'
				);
				const astDefault = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-import-default/ast.json'
					),
					'utf-8'
				);
				const getModuleDefault = () =>
					JSON.parse(
						fs.readFileSync(
							path.join(
								__dirname,
								'./fixtures/default-import-default/module-ir.json'
							),
							'utf-8'
						)
					);
				const irDefault = getIntermediateRepresentation(
					null,
					JSON.parse( tokenDefault ),
					JSON.parse( astDefault ),
					getModuleDefault
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
				const tokenNamed = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-import-named/exports.json'
					),
					'utf-8'
				);
				const astNamed = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/default-import-named/ast.json'
					),
					'utf-8'
				);
				const getModuleNamed = () =>
					JSON.parse(
						fs.readFileSync(
							path.join(
								__dirname,
								'./fixtures/default-import-named/module-ir.json'
							),
							'utf-8'
						)
					);
				const irNamed = getIntermediateRepresentation(
					null,
					JSON.parse( tokenNamed ),
					JSON.parse( astNamed ),
					getModuleNamed
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
				const tokenImportNamespace = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-import-namespace/exports.json'
					),
					'utf-8'
				);
				const astImportNamespace = fs.readFileSync(
					path.join(
						__dirname,
						'./fixtures/named-import-namespace/ast.json'
					),
					'utf-8'
				);
				const getModuleImportNamespace = ( filePath ) => {
					if ( filePath === './named-import-namespace-module' ) {
						return JSON.parse(
							fs.readFileSync(
								path.join(
									__dirname,
									'./fixtures/named-import-namespace/module-ir.json'
								),
								'utf-8'
							)
						);
					}
					return JSON.parse(
						fs.readFileSync(
							path.join(
								__dirname,
								'./fixtures/default-function/ir.json'
							),
							'utf-8'
						)
					);
				};
				const ir = getIntermediateRepresentation(
					null,
					JSON.parse( tokenImportNamespace ),
					JSON.parse( astImportNamespace ),
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
