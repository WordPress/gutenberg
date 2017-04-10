/**
 * Credits:
 *
 * babel-gettext-extractor
 * https://github.com/getsentry/babel-gettext-extractor
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 jruchaud
 * Copyright (c) 2015 Sentry
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * External dependencies
 */

const { po } = require( 'gettext-parser' );
const { pick, uniq, fromPairs, sortBy, toPairs, isEqual } = require( 'lodash' );
const { relative } = require( 'path' );
const { writeFileSync } = require( 'fs' );

const DEFAULT_HEADERS = {
	'content-type': 'text/plain; charset=UTF-8',
	'x-generator': 'babel-plugin-wp-i18n'
};

const DEFAULT_FUNCTIONS = {
	__: [ 'msgid' ],
	_n: [ 'msgid', 'msgid_plural' ],
	_x: [ 'msgid', 'msgctxt' ],
	_nx: [ 'msgid', 'msgctxt', 'msgid_plural' ]
};

const DEFAULT_OUTPUT = 'gettext.pot';

const VALID_TRANSLATION_KEYS = [ 'msgid', 'msgid_plural', 'msgctxt' ];

function getTranslatorComment( node ) {
	if ( ! node.leadingComments ) {
		return;
	}

	const comments = node.leadingComments.reduce( ( memo, comment ) => {
		const match = comment.value.match( /^\s*translators:\s*(.*?)\s*$/im );
		if ( match ) {
			memo.push( match[ 1 ] );
		}

		return memo;
	}, [] );

	if ( comments.length > 0 ) {
		return comments.join( '\n' );
	}
}

function isValidTranslationKey( key ) {
	return -1 !== VALID_TRANSLATION_KEYS.indexOf( key );
}

function isSameTranslation( a, b ) {
	return isEqual(
		pick( a, VALID_TRANSLATION_KEYS ),
		pick( b, VALID_TRANSLATION_KEYS )
	);
}

module.exports = function() {
	let nplurals = 2,
		data;

	return {
		visitor: {
			CallExpression( path, state ) {
				const { callee } = path.node;

				// Determine function name by direct invocation or property name
				let name;
				if ( 'MemberExpression' === callee.type ) {
					name = callee.property.name;
				} else {
					name = callee.name;
				}

				// Skip unhandled functions
				const functionKeys = ( state.opts.functions || DEFAULT_FUNCTIONS )[ name ];
				if ( ! functionKeys ) {
					return;
				}

				// Assign translation keys by argument position
				const translation = path.node.arguments.reduce( ( memo, arg, i ) => {
					const key = functionKeys[ i ];
					if ( isValidTranslationKey( key ) ) {
						memo[ key ] = arg.value;
					}

					return memo;
				}, {} );

				// Can only assign translation with usable msgid
				if ( ! translation.msgid ) {
					return;
				}

				// At this point we assume we'll save data, so initialize if
				// we haven't already
				if ( ! data ) {
					data = {
						charset: 'utf-8',
						headers: state.opts.headers || DEFAULT_HEADERS,
						translations: { '': {}, messages: {} }
					};

					data.translations[ '' ][ '' ] = {
						msgid: '',
						msgstr: []
					};

					for ( const key in data.headers ) {
						data.translations[ '' ][ '' ].msgstr.push( `${ key }: ${ data.headers[ key ] };\n` );
					}

					// Attempt to exract nplurals from header
					const pluralsMatch = ( data.headers[ 'plural-forms' ] || '' ).match( /nplurals\s*=\s*(\d+);/ );
					if ( pluralsMatch ) {
						nplurals = pluralsMatch[ 1 ];
					}
				}

				// Create empty msgstr or array of empty msgstr by nplurals
				if ( translation.msgid_plural ) {
					translation.msgstr = Array.from( Array( nplurals ) ).map( () => '' );
				} else {
					translation.msgstr = '';
				}

				// Assign file reference comment
				let { filename } = this.file.opts;
				filename = relative( process.cwd(), filename );
				translation.comments = {
					reference: filename + ':' + path.node.loc.start.line
				};

				// If exists, also assign translator comment
				const translator = getTranslatorComment( path.parent );
				if ( translator ) {
					translation.comments.translator = translator;
				}

				const { messages } = data.translations;

				// Test whether equivalent translation already exists. If so,
				// merge into references of existing translation.
				if ( isSameTranslation( translation, messages[ translation.msgid ] ) ) {
					translation.comments.reference = uniq( [
						...messages[ translation.msgid ].comments.reference.split( '\n' ),
						translation.comments.reference
					] ).sort().join( '\n' );
				}

				messages[ translation.msgid ] = translation;
				this.hasPendingWrite = true;
			},
			Program: {
				exit( path, state ) {
					if ( ! this.hasPendingWrite ) {
						return;
					}

					// By spec, enumeration order of object keys cannot be
					// guaranteed, but in practice most runtimes respect order
					// in which keys are inserted. We rely on this to specify
					// ordering alphabetically by file, line. A better solution
					// is to support or reimplement translations as array.
					data.translations.messages = fromPairs( sortBy(
						toPairs( data.translations.messages ),
						( [ , translation ] ) => translation.comments.reference
					) );

					// Ideally we could wait until Babel has finished parsing
					// all files or at least asynchronously write, but Babel
					// doesn't expose these entry points and async write may
					// hit file lock (need queue).
					const compiled = po.compile( data );
					writeFileSync( state.opts.output || DEFAULT_OUTPUT, compiled );
					this.hasPendingWrite = false;
				}
			}
		}
	};
};
