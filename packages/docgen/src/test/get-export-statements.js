/**
 * External dependencies
 */
import ts from 'typescript';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Internal dependencies
 */
import { getExportStatements } from '../get-export-statements';

const fixturesDir = join( __dirname, './fixtures' );

const parse = ( dirname ) => {
	const filename = join( fixturesDir, dirname, 'code.js' );

	return ts.createSourceFile(
		filename,
		readFileSync( filename ).toString(),
		ts.ScriptTarget.ES2020
	);
};

describe( 'export in different ways', () => {
	const testExport = ( dirname, tokensLength = 1 ) => {
		it( dirname, () => {
			const sourceFile = parse( dirname );
			const tokens = getExportStatements( sourceFile );

			expect( tokens.length ).toBe( tokensLength );
		} );
	};

	testExport( 'default-class-anonymous' );
	testExport( 'default-class-named' );
	testExport( 'default-function-anonymous' );
	testExport( 'default-function-named' );
	testExport( 'default-identifier' );
	testExport( 'default-import-default' );
	testExport( 'default-import-named' );
	testExport( 'default-named-export', 2 );
	testExport( 'default-parse-error' );
	testExport( 'default-undocumented-nocomments' );
	testExport( 'default-undocumented-oneliner' );
	testExport( 'default-variable' );
	testExport( 'named-class' );
	testExport( 'named-default' );
	testExport( 'named-default-exported' );
	testExport( 'named-function' );
	testExport( 'named-identifier' );
	testExport( 'named-identifier-destructuring' );
	testExport( 'named-identifiers' );
	testExport( 'named-identifiers-and-inline', 2 );
	testExport( 'named-import-named' );
	testExport( 'named-import-namespace' );
	testExport( 'named-variable' );
	testExport( 'named-variables' );
	testExport( 'namespace' );
	testExport( 'namespace-commented' );
	testExport( 'tags-function' );
	testExport( 'tags-variable' );
} );
