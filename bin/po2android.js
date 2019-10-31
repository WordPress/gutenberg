#!/usr/bin/env node

const gettextParser = require( 'gettext-parser' ),
	fs = require( 'fs' );

function escapeResourceXML( unsafeXMLValue ) {
	// See: https://tekeye.uk/android/examples/android-string-resources-gotchas
	// Let's first replace XML special characters that JSON.stringify does not escape: <, > and &
	// Then let's use JSON.stringify to handle pre and post spaces as well as escaping ", \, \t and \n
	return JSON.stringify( unsafeXMLValue.replace( /[<>&]/g, function( character ) {
		switch ( character ) {
			case '<': return '&lt;';
			case '>': return '&gt;';
			case '&': return '&amp;';
		}
	} ) );
}

function po2Android( poInput ) {
	const po = gettextParser.po.parse( poInput );
	const translations = po.translations[ '' ];
	const androidResources = Object.values( translations ).map( ( translation, id ) => {
		if ( translation.msgid === '' ) {
			return null;
		}
		const escapedValue = escapeResourceXML( translation.msgid );
		const escapedValuePlural = escapeResourceXML( translation.msgid_plural || '' );
		const comment = translation.comments.extracted || '';
		let localizedEntry = '';
		if ( comment ) {
			localizedEntry += `\t<!-- ${ comment.replace( '--', '—' ) } -->\n`;
		}
		if ( translation.msgid_plural ) {
			localizedEntry += `\t<plurals name="gutenberg_native_string_${id}" tools:ignore="UnusedResources">
		<item quantity="one">${ escapedValue }</item>
		<item quantity="other">${ escapedValuePlural }</item>
	</plurals>
`;
		} else {
			localizedEntry += `\t<string name="gutenberg_native_string_${id}" tools:ignore="UnusedResources">${ escapedValue }</string>\n`;
		}
		return localizedEntry;
	} ).filter( Boolean );
	return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${ androidResources.join( '' ) }</resources>\n`;
}

if ( require.main === module ) {
	if ( process.stdin.isTTY ) {
		const potFileName = process.argv[2];
		const destination = process.argv[3];
		const potFileContent = fs.readFileSync( potFileName );
		const swiftOutput = po2Android( potFileContent, process.argv[3] );
		fs.writeFileSync( destination, swiftOutput );
	} else {
		let inputData = '';
		process.stdin.on( 'readable', function() {
			var chunk = this.read();
			if ( chunk !== null ) {
				inputData += chunk;
			}
		} );
		process.stdin.on( 'end', function() {
			console.log( po2Android( inputData ) );
		} );
	}
	return;
}

module.exports = po2Android;

