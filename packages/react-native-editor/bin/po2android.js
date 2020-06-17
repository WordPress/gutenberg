#!/usr/bin/env node

/**
 * External dependencies
 */
// eslint-disable-next-line import/no-extraneous-dependencies
const gettextParser = require( 'gettext-parser' ),
	fs = require( 'fs' ),
	crypto = require( 'crypto' );

const indent = '    ';

/**
 * Encode a raw string into an Android-compatible value
 *
 * See: https://tekeye.uk/android/examples/android-string-resources-gotchas
 *
 * @param {string} unsafeXMLValue input string to be escaped
 * @return {string} Escaped string to be copied into the XML <string></string> node
 */
function escapeResourceXML( unsafeXMLValue ) {
	// See: https://tekeye.uk/android/examples/android-string-resources-gotchas
	// Let's replace XML special characters  <, >, &, ", ', \, \t and \n
	// Note that this does not support android:textstyle attributes (<b></b>...)
	return unsafeXMLValue.replace( /(\r?\n|\r|\t|<|>|&|'|"|\\)/gm, function (
		character
	) {
		switch ( character ) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case "'":
				return "\\'";
			case '"':
				return '\\"';
			case '\r':
			case '\n':
			case '\r\n':
				return '\\n';
			case '\t':
				return '\\t';
			case '\\':
				return '\\\\';
		}
	} );
}

/**
 * Android specifics replacements.
 *
 * @param {string} XMLValue input to apply replacements.
 * @return {string} valid string passing Android linter rules.
 */
function androidReplacements( XMLValue ) {
	return XMLValue.replace( /(-|\.\.\.)/gm, function ( character ) {
		switch ( character ) {
			case '-':
				return '–'; // Android lint rule: TypographyDashes.
			case '...':
				return '…'; // Android lint rule: TypographyEllipsis
		}
	} );
}

/**
 * Generate a unique string identifier to use as the `name` property in our xml.
 * Try using the string first by stripping any non-alphanumeric characters and cropping it
 * Then try hashing the string and appending it to the the sanatized string
 * If none of the above makes a unique ref for our string throw an error
 *
 * @param {string} str raw string
 * @param {string} prefix Optional prefix to add to the name
 * @return {string} A unique name for this string
 */
const getUniqueName = ( function () {
	const names = {};
	const ANDROID_MAX_NAME_LENGTH = 100;
	const HASH_LENGTH = 8;
	return ( str, prefix = 'gutenberg_native_' ) => {
		const maxNameLength =
			ANDROID_MAX_NAME_LENGTH - prefix.length - HASH_LENGTH - 10; // leave some margin just in case
		let name = str
			.replace( /\W+/g, '_' )
			.toLocaleLowerCase()
			.substring( 0, maxNameLength );
		// trim underscores left and right
		name = name.replace( /^_+|_+$/g, '' );
		// if name exists, use name + hash of the full string
		if ( name in names ) {
			const strHashShort = crypto
				.createHash( 'sha1' )
				.update( str )
				.digest( 'hex' )
				.substring( 0, HASH_LENGTH );
			name = `${ name }_${ strHashShort }`;
		}
		// if name still exists
		if ( name in names ) {
			throw new Error(
				`Could not generate a unique name for string "${ str }"`
			);
		}
		names[ name ] = true;
		return `${ prefix }${ name }`;
	};
} )();

function po2Android( poInput ) {
	const po = gettextParser.po.parse( poInput );
	const translations = po.translations[ '' ];
	const androidResourcesMap = Object.values( translations ).reduce(
		( result, translation ) => {
			if ( ! translation.msgid ) {
				return result;
			}
			const uniqueName = getUniqueName( translation.msgid );
			const escapedValue = androidReplacements(
				escapeResourceXML( translation.msgid )
			);
			const escapedValuePlural = androidReplacements(
				escapeResourceXML( translation.msgid_plural || '' )
			);
			const comment = translation.comments.extracted || '';
			let localizedEntry = '';
			if ( comment ) {
				localizedEntry += `${ indent }<!-- ${ comment.replace(
					'--',
					'—'
				) } -->\n`;
			}
			if ( translation.msgid_plural ) {
				localizedEntry += `${ indent }<string-array name="${ uniqueName }" tools:ignore="UnusedResources">
${ indent }${ indent }<item>${ escapedValue }</item>
${ indent }${ indent }<item>${ escapedValuePlural }</item>
${ indent }</string-array>
`;
			} else {
				localizedEntry += `${ indent }<string name="${ uniqueName }" tools:ignore="UnusedResources">${ escapedValue }</string>\n`;
			}
			result[ uniqueName ] = localizedEntry;
			return result;
		},
		{}
	);
	// try to minimize changes in diffs by sorting strings
	const androidResourcesSortedList = Object.entries( androidResourcesMap )
		.sort( ( left, right ) => left[ 0 ].localeCompare( right[ 0 ] ) )
		.map( ( entry ) => entry[ 1 ] );
	return `<?xml version="1.0" encoding="utf-8"?>\n<resources xmlns:tools="http://schemas.android.com/tools">\n${ androidResourcesSortedList.join(
		''
	) }</resources>\n`;
}

if ( require.main === module ) {
	if ( process.stdin.isTTY ) {
		const potFileName = process.argv[ 2 ];
		const destination = process.argv[ 3 ];
		const potFileContent = fs.readFileSync( potFileName );
		const xmlOutput = po2Android( potFileContent, process.argv[ 3 ] );
		fs.writeFileSync( destination, xmlOutput );
	} else {
		let inputData = '';
		process.stdin.on( 'readable', function () {
			const chunk = this.read();
			if ( chunk !== null ) {
				inputData += chunk;
			}
		} );
		process.stdin.on( 'end', function () {
			process.stdout.write( po2Android( inputData ) );
		} );
	}
	return;
}

module.exports = po2Android;
