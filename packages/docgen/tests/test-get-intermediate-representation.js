/**
 * Node dependencies.
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const getIntermediateRepresentation = require( '../src/get-intermediate-representation' );

test( 'default export (inline)', function( t ) {
	const tokenClassAnonymous = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-anonymous.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClassAnonymous ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		tags: [],
	} ] );
	const tokenClassNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-named.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClassNamed ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		tags: [],
	} ] );
	const tokenFnAnonymous = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-anonymous.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFnAnonymous ) ), [ {
		name: 'default',
		description: 'Function declaration example.',
		tags: [],
	} ] );
	const tokenFnNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-named.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFnNamed ) ), [ {
		name: 'default',
		description: 'Function declaration example.',
		tags: [],
	} ] );
	const tokenVariable = fs.readFileSync(
		path.join( __dirname, './fixtures/default-variable.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenVariable ) ), [ {
		name: 'default',
		description: 'Variable declaration example.',
		tags: [],
	} ] );
	t.end();
} );

test( 'default export (lookup identifier)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-identifier.json' ),
		'utf-8'
	);
	const ast = fs.readFileSync(
		path.join( __dirname, './fixtures/default-identifier-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( token ), JSON.parse( ast ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		tags: [],
	} ] );
	t.end();
} );
