#!/usr/bin/env node

const pegjs = require( 'pegjs' );
const phppegjs = require( 'php-pegjs' );
const fs = require( 'fs' );
const path = require( 'path' );

const peg = fs.readFileSync( 'blocks/api/post.pegjs', 'utf8' );
const parser = pegjs.buildParser(
	peg,
	{ plugins: [ phppegjs ] }
);

fs.writeFileSync(
	path.join( __dirname, '..', 'lib', 'parser.php' ),
	parser
);
