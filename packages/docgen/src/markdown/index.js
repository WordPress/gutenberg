/**
 * External dependencies.
 */
const remark = require( 'remark' );
const unified = require( 'unified' );
const remarkParser = require( 'remark-parse' );
const inject = require( 'mdast-util-inject' );
const fs = require( 'fs' );

/**
 * Internal dependencies.
 */
const formatter = require( './formatter' );
const embed = require( './embed' );

const appendOrEmbedContents = ( { options, newContents } ) => {
	return function transform( targetAst, file, next ) {
		if (
			options.toSection &&
			! inject( options.toSection, targetAst, newContents )
		) {
			return next(
				new Error( `Heading ${ options.toSection } not found.` )
			);
		} else if (
			options.toToken &&
			! embed( options.useToken, targetAst, newContents )
		) {
			return next(
				new Error(
					`Start and/or end tokens for ${ options.useToken } not found.`
				)
			);
		}
		next();
	};
};

module.exports = function(
	options,
	processDir,
	doc,
	filteredIR,
	headingTitle
) {
	if ( options.toSection || options.toToken ) {
		const currentReadmeFile = fs.readFileSync( options.output, 'utf8' );
		const newContents = unified()
			.use( remarkParser )
			.parse( formatter( processDir, doc, filteredIR, null ) );
		remark()
			.use( { settings: { commonmark: true } } )
			.use( appendOrEmbedContents, { options, newContents } )
			.process( currentReadmeFile, function( err, file ) {
				if ( err ) {
					throw err;
				}
				fs.writeFileSync( doc, file );
			} );
	} else {
		const output = formatter( processDir, doc, filteredIR, headingTitle );
		fs.writeFileSync( doc, output );
	}
};
