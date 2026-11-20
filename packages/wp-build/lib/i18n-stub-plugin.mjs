import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseSync, Visitor } from 'rolldown/utils';

/*
 * Translation stubs.
 *
 * A `--no-script-debug` build ships only the minified `*.min.js` files, which
 * `wp i18n make-pot` skips. This plugin collects every i18n call of the
 * modules that end up in a bundle, with its translator comments, from the
 * original sources, and writes them next to the bundle as a small stub at the
 * unminified path (`index.min.js` -> `index.js`). `make-pot` then extracts the
 * strings with references to the unminified path, which is the path that
 * `load_script_textdomain()` hashes to find the JSON translations of
 * `index.min.js`.
 */

/**
 * The i18n functions, with how many arguments `make-pot` reads and the
 * position of the number argument, which it ignores.
 */
const I18N_FUNCTIONS = {
	__: { length: 2 },
	_x: { length: 3 },
	_n: { length: 4, number: 2 },
	_nx: { length: 5, number: 2 },
};

const I18N_CALL_HINT = /(?<![\w$])(?:__|_x|_n|_nx)(?![\w$])/;
// The comment prefixes of `make-pot` (`JsCodeExtractor::$options`).
const TRANSLATOR_COMMENT_PREFIXES = [ 'translators', 'Translators' ];

/**
 * @typedef {Object} I18nCall
 * @property {string}             fn       Function name.
 * @property {Array<string|null>} args     Arguments: strings, or null for the
 *                                         number argument of `_n()`/`_nx()`.
 * @property {string[]}           comments Normalized translator comments.
 */

/** @typedef {import('rolldown/utils').ESTree.CallExpression} CallExpression */
/** @typedef {import('rolldown/utils').ESTree.Argument} Argument */
/** @typedef {import('rolldown/utils').ESTree.Span} Span */
/** @typedef {import('rolldown/utils').ParseResult['comments'][number]} Comment */
/** @typedef {keyof typeof I18N_FUNCTIONS} I18nFunctionName */

/** @type {Map<string, I18nCall[]>} */
const extractionCache = new Map();

/**
 * Resolve the name of the called function, as `make-pot` does
 * (`JsFunctionsScanner::resolveExpressionCallee()`): `__()`, `i18n.__()`,
 * `Object( i18n.__ )()` and `( 0, i18n.__ )()`.
 *
 * @param {CallExpression} node Call expression node.
 * @return {string|undefined} Function name.
 */
function resolveCalleeName( node ) {
	const { callee } = node;
	if ( callee.type === 'Identifier' ) {
		return callee.name;
	}
	if (
		callee.type === 'MemberExpression' &&
		callee.property.type === 'Identifier'
	) {
		return callee.property.name;
	}
	if (
		callee.type === 'CallExpression' &&
		callee.callee.type === 'Identifier' &&
		callee.callee.name === 'Object'
	) {
		const object = callee.arguments[ 0 ];
		if ( object?.type === 'MemberExpression' ) {
			const { property } = object;
			if ( property.type === 'Identifier' ) {
				return property.name;
			}
			if ( property.type === 'Literal' ) {
				return String( property.value );
			}
		}
	}
	if (
		callee.type === 'ParenthesizedExpression' &&
		callee.expression.type === 'SequenceExpression' &&
		callee.expression.expressions.length === 2 &&
		callee.expression.expressions[ 0 ].type === 'Literal' &&
		node.arguments.length > 0
	) {
		const target = callee.expression.expressions[ 1 ];
		if ( target.type === 'Identifier' ) {
			return target.name;
		}
		if (
			target.type === 'MemberExpression' &&
			target.property.type === 'Identifier'
		) {
			return target.property.name;
		}
	}
	return undefined;
}

/**
 * Get the value of a string the bundler turns into a single literal: a
 * concatenation of string literals (`'a' + 'b'`), in parentheses or wrapped in
 * a TypeScript type assertion.
 *
 * @param {Argument} node Argument node.
 * @return {string|undefined} String value, or undefined if it is not one.
 */
function getFoldedString( node ) {
	switch ( node.type ) {
		case 'Literal':
			return typeof node.value === 'string' ? node.value : undefined;
		case 'TemplateLiteral':
			return node.expressions.length === 0
				? ( node.quasis[ 0 ].value.cooked ?? undefined )
				: undefined;
		case 'BinaryExpression': {
			if ( node.operator !== '+' ) {
				return undefined;
			}
			const left = getFoldedString( node.left );
			const right = getFoldedString( node.right );
			return left === undefined || right === undefined
				? undefined
				: left + right;
		}
		case 'ParenthesizedExpression':
		case 'TSAsExpression':
		case 'TSSatisfiesExpression':
		case 'TSNonNullExpression':
		case 'TSTypeAssertion':
			return getFoldedString( node.expression );
		default:
			return undefined;
	}
}

/**
 * Read the arguments of an i18n call the way `make-pot` reads them in the
 * bundle: string literals and template literals without expressions keep
 * their value, identifiers and other expressions count as an empty string,
 * and any other argument (such as a spread element or a JSX element) makes
 * `make-pot` skip the call. Strings that the bundler folds into a single
 * literal, like `'a' + 'b'`, are read as that literal, as `make-pot` finds
 * them in the non-minified bundle.
 *
 * @param {Argument[]} nodes Argument nodes.
 * @return {Array<string|null>|null} Argument values (null for literals that
 *                                   are not strings), or null to skip the call.
 */
function readArguments( nodes ) {
	/** @type {Array<string|null>} */
	const values = [];
	for ( const node of nodes ) {
		const folded = getFoldedString( node );
		if ( folded !== undefined ) {
			values.push( folded );
		} else if ( node.type === 'Literal' ) {
			values.push( null );
		} else if (
			node.type === 'Identifier' ||
			node.type.endsWith( 'Expression' )
		) {
			values.push( '' );
		} else {
			return null;
		}
	}
	return values;
}

/**
 * Normalize a comment the way `make-pot` does (`Gettext\Utils\ParsedComment`):
 * strip `#`, `*`, `/` and whitespace from both ends of each line, drop empty
 * lines, and join the rest with spaces.
 *
 * @param {string} rawText Comment, with its delimiters.
 * @return {string} Normalized comment.
 */
export function normalizeComment( rawText ) {
	return rawText
		.split( '\n' )
		.map( ( line ) =>
			line
				.replace( /^[#*/ \t]+/, '' )
				.replace( /[#*/ \t]+$/, '' )
				.trim()
		)
		.filter( Boolean )
		.join( ' ' );
}

/**
 * Get the parser language for a file. JavaScript is parsed with JSX enabled,
 * as `make-pot` does, since `.js` files often contain JSX.
 *
 * @param {string} filename File name.
 * @return {'js'|'jsx'|'ts'|'tsx'} Parser language.
 */
function getParserLanguage( filename ) {
	if ( /\.[cm]?ts$/.test( filename ) ) {
		return 'ts';
	}
	if ( filename.endsWith( '.tsx' ) ) {
		return 'tsx';
	}
	return 'jsx';
}

/**
 * Find the original source of a module: the file its source map points to
 * (e.g. `src/foo.ts` for a transpiled `build-module/foo.mjs`), or the module
 * itself.
 *
 * @param {string} id   Module id (absolute path).
 * @param {string} code Module code, as passed to the transform hook.
 * @return {{ filename: string, code: string }} Original source.
 */
function getOriginalSource( id, code ) {
	const mapFile = `${ id }.map`;
	if ( existsSync( mapFile ) ) {
		try {
			const map = JSON.parse( readFileSync( mapFile, 'utf8' ) );
			if ( map.sources?.length === 1 ) {
				const sourceFile = path.resolve(
					path.dirname( mapFile ),
					map.sourceRoot || '',
					map.sources[ 0 ]
				);
				if ( existsSync( sourceFile ) ) {
					return {
						filename: sourceFile,
						code: readFileSync( sourceFile, 'utf8' ),
					};
				}
				if ( typeof map.sourcesContent?.[ 0 ] === 'string' ) {
					return {
						filename: sourceFile,
						code: map.sourcesContent[ 0 ],
					};
				}
			}
		} catch {
			// Fall back to the module itself.
		}
	}
	return { filename: id, code };
}

/**
 * Extract the i18n calls of a source file with their translator comments.
 *
 * Mirrors how `make-pot` (`JsFunctionsScanner`) attaches comments, so that a
 * stub carries the comments `make-pot` would have found in the original
 * source. While walking the AST, `make-pot` collects the comments in front of
 * each node, plus those in front of the arguments of an i18n call. At each
 * i18n call, it takes the collected comments that end on the line of the call
 * or the line before (and, on the same line, start before the call), and
 * attaches those that start with `translators` or `Translators` and were not
 * attached to an earlier call.
 *
 * @param {string} filename File name, which determines the parser language.
 * @param {string} code     Source code.
 * @return {I18nCall[]} Calls, in source order.
 */
export function extractI18nCalls( filename, code ) {
	if ( ! I18N_CALL_HINT.test( code ) ) {
		return [];
	}

	const {
		program,
		comments: allComments,
		errors,
	} = parseSync( filename, code, { lang: getParserLanguage( filename ) } );
	const error = errors.find( ( { severity } ) => severity === 'Error' );
	if ( error ) {
		throw new Error(
			`Could not parse ${ filename } for translation stubs: ${ error.message }`
		);
	}

	/** @type {Array<I18nCall & { node: CallExpression }>} */
	const calls = [];
	/** @type {Span[]} */
	const emptyJsxExpressions = [];
	new Visitor( {
		JSXEmptyExpression( node ) {
			emptyJsxExpressions.push( node );
		},
		CallExpression( node ) {
			const fn = resolveCalleeName( node );
			if (
				! fn ||
				! Object.prototype.hasOwnProperty.call( I18N_FUNCTIONS, fn )
			) {
				return;
			}
			const values = readArguments( node.arguments );
			// `make-pot` needs a non-empty string as the first argument.
			if ( ! values || ! values[ 0 ] ) {
				return;
			}
			/** @type {{ length: number, number?: number }} */
			const layout =
				I18N_FUNCTIONS[ /** @type {I18nFunctionName} */ ( fn ) ];
			const { length, number } = layout;
			const args = values
				.slice( 0, length )
				.map( ( value, index ) =>
					index === number ? null : ( value ?? '' )
				);
			calls.push( { fn, args, node, comments: [] } );
		},
	} ).visit( program );

	if ( ! calls.length ) {
		return [];
	}

	/*
	 * `make-pot` never sees a comment that is alone in a JSX expression
	 * container, like `{ /* translators: … *\/ }`, as it is not in front of
	 * any node.
	 */
	const comments = allComments.filter(
		( comment ) =>
			! emptyJsxExpressions.some(
				( node ) =>
					comment.start >= node.start && comment.end <= node.end
			)
	);

	// Parents before children, then source order, like `make-pot`'s traverser.
	calls.sort( ( a, b ) => a.node.start - b.node.start );

	const lineStarts = [ 0 ];
	for ( let i = 0; i < code.length; i++ ) {
		if ( code.charCodeAt( i ) === 10 ) {
			lineStarts.push( i + 1 );
		}
	}
	/** @param {number} offset Offset in the code. */
	const lineAt = ( offset ) => {
		let low = 0;
		let high = lineStarts.length - 1;
		while ( low < high ) {
			const mid = Math.ceil( ( low + high ) / 2 );
			if ( lineStarts[ mid ] <= offset ) {
				low = mid;
			} else {
				high = mid - 1;
			}
		}
		return low + 1;
	};

	/*
	 * Comments in front of the arguments of a call: those between the end of
	 * the callee (or of the previous argument) and the start of an argument.
	 */
	/** @param {CallExpression} node Call expression node. */
	const getArgumentComments = ( node ) => {
		/** @type {Comment[]} */
		const result = [];
		let from = node.callee.end;
		for ( const argument of node.arguments ) {
			for ( const comment of comments ) {
				if ( comment.start >= from && comment.end <= argument.start ) {
					result.push( comment );
				}
			}
			from = argument.end;
		}
		return result;
	};

	const used = new Set();
	/** @type {Comment[]} */
	let collected = [];
	let next = 0;
	for ( const call of calls ) {
		const callStart = call.node.start;
		const callLine = lineAt( callStart );
		while ( next < comments.length && comments[ next ].end <= callStart ) {
			collected.push( comments[ next++ ] );
		}
		/*
		 * Only comments that end on the line of the call or the line before
		 * count. Comments in front of arguments are never above the call.
		 */
		collected = collected.filter(
			( comment ) => lineAt( comment.end ) >= callLine - 1
		);
		for ( const comment of [
			...collected,
			...getArgumentComments( call.node ),
		] ) {
			// On the line of the call, the comment must start before it.
			if (
				( lineAt( comment.end ) === callLine &&
					callStart < comment.start ) ||
				used.has( comment )
			) {
				continue;
			}
			const text = normalizeComment(
				code.slice( comment.start, comment.end )
			);
			if (
				TRANSLATOR_COMMENT_PREFIXES.some( ( prefix ) =>
					text.startsWith( prefix )
				)
			) {
				call.comments.push( text );
				used.add( comment );
			}
		}
	}

	return calls.map( ( { fn, args, comments: callComments } ) => ( {
		fn,
		args,
		comments: callComments,
	} ) );
}

/**
 * Render a stub file.
 *
 * Each call goes on its own line, with its translator comments on the line
 * before, where `make-pot` looks for them.
 *
 * @param {string}     stubName   File name of the stub.
 * @param {string}     bundleName File name of the real bundle.
 * @param {I18nCall[]} calls      i18n calls.
 * @return {string} Stub source.
 */
export function renderStub( stubName, bundleName, calls ) {
	const lines = [
		'/*',
		` * Translation stub generated by @wordpress/build for ${ bundleName }.`,
		' * It lists the translatable strings of that file for `wp i18n make-pot`',
		' * and is never meant to run: load the minified file instead.',
		' */',
		`throw new Error( ${ JSON.stringify(
			`${ stubName } is a translation stub. Load ${ bundleName } instead.`
		) } );`,
	];
	const seen = new Set();
	for ( const { fn, args, comments } of calls ) {
		// The number argument of `_n()` and `_nx()` is not extracted.
		const renderedArgs = args.map( ( arg ) =>
			arg === null ? '0' : JSON.stringify( arg )
		);
		let entry = `${ fn }(${ renderedArgs.join( ',' ) });`;
		if ( comments.length ) {
			const renderedComments = comments.map(
				( comment ) => `/* ${ comment.replaceAll( '*/', '*\\/' ) } */`
			);
			entry = `${ renderedComments.join( ' ' ) }\n${ entry }`;
		}
		if ( ! seen.has( entry ) ) {
			seen.add( entry );
			lines.push( entry );
		}
	}
	return lines.join( '\n' ) + '\n';
}

/**
 * Get the path of the stub for a bundle: `index.min.js` -> `index.js`.
 *
 * @param {string} fileName File name of the bundle.
 * @return {string|null} File name of the stub, or null if the bundle is not
 *                       minified.
 */
export function getStubFileName( fileName ) {
	return fileName.endsWith( '.min.js' )
		? fileName.slice( 0, -'.min.js'.length ) + '.js'
		: null;
}

/**
 * Rolldown plugin that writes a translation stub next to each bundle.
 *
 * @return {import('rolldown').Plugin} Rolldown plugin.
 */
export function i18nStubPlugin() {
	/** @type {Map<string, I18nCall[]>} */
	const moduleCalls = new Map();

	return {
		name: 'wp-build-i18n-stub',
		transform: {
			filter: { id: /\.[cm]?[jt]sx?$/ },
			handler( code, id ) {
				if ( id.startsWith( '\0' ) ) {
					return null;
				}
				let calls = extractionCache.get( id );
				if ( ! calls ) {
					const original = getOriginalSource( id, code );
					try {
						calls = extractI18nCalls(
							original.filename,
							original.code
						);
					} catch ( error ) {
						if ( original.filename === id ) {
							throw error;
						}
						/*
						 * The original source could not be parsed: use the
						 * module itself, which keeps the strings but may
						 * have lost the translator comments.
						 */
						this.warn(
							error instanceof Error
								? error.message
								: String( error )
						);
						calls = extractI18nCalls( id, code );
					}
					extractionCache.set( id, calls );
				}
				if ( calls.length ) {
					moduleCalls.set( id, calls );
				}
				return null;
			},
		},
		generateBundle( _outputOptions, bundle ) {
			for ( const chunk of Object.values( bundle ) ) {
				if ( chunk.type !== 'chunk' ) {
					continue;
				}
				const stubName = getStubFileName( chunk.fileName );
				if ( ! stubName ) {
					continue;
				}
				/** @type {I18nCall[]} */
				const calls = [];
				for ( const [ id, info ] of Object.entries( chunk.modules ) ) {
					const moduleCallList = moduleCalls.get( id );
					// Skip modules that were tree-shaken out entirely.
					if ( info.renderedLength > 0 && moduleCallList ) {
						calls.push( ...moduleCallList );
					}
				}
				if ( ! calls.length ) {
					continue;
				}
				this.emitFile( {
					type: 'asset',
					fileName: stubName,
					source: renderStub(
						path.basename( stubName ),
						path.basename( chunk.fileName ),
						calls
					),
				} );
			}
		},
	};
}
