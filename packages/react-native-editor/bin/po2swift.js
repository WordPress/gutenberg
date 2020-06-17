#!/usr/bin/env node

/**
 * External dependencies
 */
// eslint-disable-next-line import/no-extraneous-dependencies
const gettextParser = require( 'gettext-parser' ),
	fs = require( 'fs' );

function po2Swift( poInput ) {
	const po = gettextParser.po.parse( poInput );
	const translations = po.translations[ '' ];
	const swiftStringsMap = Object.values( translations ).reduce(
		( result, translation ) => {
			if ( ! translation.msgid ) {
				return result;
			}
			const encodedValue = JSON.stringify( translation.msgid );
			const encodedComment = JSON.stringify(
				translation.comments.extracted || ''
			);
			result[
				translation.msgid
			] = `_ = NSLocalizedString(${ encodedValue }, comment: ${ encodedComment })`;
			return result;
		},
		{}
	);
	const swiftStringsSortedList = Object.entries( swiftStringsMap )
		.sort( ( left, right ) => left[ 0 ].localeCompare( right[ 0 ] ) )
		.map( ( entry ) => entry[ 1 ] );
	return `import Foundation\n\nprivate func dummy() {\n    ${ swiftStringsSortedList.join(
		'\n    '
	) }\n`;
}

if ( require.main === module ) {
	if ( process.stdin.isTTY ) {
		const potFileName = process.argv[ 2 ];
		const destination = process.argv[ 3 ];
		const potFileContent = fs.readFileSync( potFileName );
		const swiftOutput = po2Swift( potFileContent, process.argv[ 3 ] );
		fs.writeFileSync( destination, swiftOutput );
	} else {
		let inputData = '';
		process.stdin.on( 'readable', function () {
			const chunk = this.read();
			if ( chunk !== null ) {
				inputData += chunk;
			}
		} );
		process.stdin.on( 'end', function () {
			process.stdout.write( po2Swift( inputData ) );
		} );
	}
	return;
}

module.exports = po2Swift;
