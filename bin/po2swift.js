#!/usr/bin/env node

const gettextParser = require( 'gettext-parser' ),
	fs = require( 'fs' );

function po2Swift( poInput ) {
	const po = gettextParser.po.parse( poInput );
	const translations = po.translations[ '' ];
	const swiftStrings = Object.values( translations ).map( ( translation, id ) => {
		if ( translation.msgid === '' ) {
			return null;
		}
		const encodedValue = JSON.stringify( translation.msgid );
		const encodedComment = JSON.stringify( translation.comments.extracted || '' );
		return `let string${ id } = NSLocalizedString(${ encodedValue }, comment: ${ encodedComment })`;
	} ).filter( Boolean );
	return swiftStrings.join( '\n' ) + '\n';
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
		process.stdin.on( 'readable', function() {
			const chunk = this.read();
			if ( chunk !== null ) {
				inputData += chunk;
			}
		} );
		process.stdin.on( 'end', function() {
			process.stdout.write( po2Swift( inputData ) );
		} );
	}
	return;
}

module.exports = po2Swift;

