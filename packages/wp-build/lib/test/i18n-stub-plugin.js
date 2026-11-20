import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { build } from 'rolldown';
import { parseSync } from 'rolldown/utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	extractI18nCalls,
	getStubFileName,
	i18nStubPlugin,
	normalizeComment,
	renderStub,
} from '../i18n-stub-plugin.mjs';

/*
 * The expected comments follow what `wp i18n make-pot` (WP-CLI 2.12) attaches
 * when it scans the same code: each case was checked against a real
 * `make-pot` run on the source and on the generated stub.
 */

/**
 * Extract the calls of a JavaScript snippet.
 *
 * @param {string} code     Source code.
 * @param {string} filename File name.
 * @return {Array} Calls.
 */
function extract( code, filename = 'source.js' ) {
	return extractI18nCalls( filename, code );
}

describe( 'extractI18nCalls', () => {
	describe( 'call shapes', () => {
		it( 'reads __(), so plain string calls are not lost', () => {
			expect( extract( `__( 'Hello', 'my-plugin' );` ) ).toEqual( [
				{ fn: '__', args: [ 'Hello', 'my-plugin' ], comments: [] },
			] );
		} );

		it( 'reads _x(), so the context is not dropped', () => {
			expect( extract( `_x( 'Post', 'noun' );` ) ).toEqual( [
				{ fn: '_x', args: [ 'Post', 'noun' ], comments: [] },
			] );
		} );

		it( 'reads _n() and blanks the number, so plurals keep both forms', () => {
			expect(
				extract( `_n( '%d item', '%d items', count, 'my-plugin' );` )
			).toEqual( [
				{
					fn: '_n',
					args: [ '%d item', '%d items', null, 'my-plugin' ],
					comments: [],
				},
			] );
		} );

		it( 'reads _nx(), so plurals keep their context', () => {
			expect(
				extract( `_nx( '%d post', '%d posts', count, 'noun' );` )
			).toEqual( [
				{
					fn: '_nx',
					args: [ '%d post', '%d posts', null, 'noun' ],
					comments: [],
				},
			] );
		} );

		it( 'resolves member calls such as wp.i18n.__(), as make-pot does', () => {
			expect(
				extract( `i18n.__( 'One' ); wp.i18n._x( 'Two', 'ctx' );` )
			).toEqual( [
				{ fn: '__', args: [ 'One' ], comments: [] },
				{ fn: '_x', args: [ 'Two', 'ctx' ], comments: [] },
			] );
		} );

		it( 'resolves indirect calls such as ( 0, i18n.__ )(), as emitted by transpilers', () => {
			expect(
				extract(
					`( 0, i18n.__ )( 'One' ); ( 0, __ )( 'Two' ); Object( i18n.__ )( 'Three' );`
				).map( ( { args } ) => args[ 0 ] )
			).toEqual( [ 'One', 'Two', 'Three' ] );
		} );

		it( 'ignores other functions, including inherited object keys', () => {
			expect(
				extract( `sprintf( 'Not %s', x ); constructor( 'No' );` )
			).toEqual( [] );
		} );

		it( 'parses JSX in .js files, so strings in JSX-in-JS sources are not lost', () => {
			expect(
				extract( `const el = <p>{ __( 'In JSX' ) }</p>;`, 'file.js' )
			).toEqual( [ { fn: '__', args: [ 'In JSX' ], comments: [] } ] );
		} );

		it( 'parses TypeScript, so typed sources keep their strings', () => {
			expect(
				extract(
					`const label: string = __( 'Typed' ) as string;`,
					'file.ts'
				)
			).toEqual( [ { fn: '__', args: [ 'Typed' ], comments: [] } ] );
		} );

		it( 'throws on a parse error instead of silently dropping strings', () => {
			expect( () => extract( `__( 'Broken'` ) ).toThrow(
				/Could not parse source\.js/
			);
		} );
	} );

	describe( 'arguments', () => {
		it( 'skips calls whose text is not a static string, as make-pot does', () => {
			expect(
				extract(
					[
						`__( variable );`,
						`__( 'a' + 'b' );`,
						`__( \`\${ x } template\` );`,
						`__( ...spread );`,
						`__( '' );`,
					].join( '\n' )
				)
			).toEqual( [] );
		} );

		it( 'keeps template literals without expressions', () => {
			expect( extract( '__( `Template` );' ) ).toEqual( [
				{ fn: '__', args: [ 'Template' ], comments: [] },
			] );
		} );

		it( 'turns other non-literal arguments into empty strings, as make-pot does', () => {
			expect(
				extract( `_x( 'Text', context ); __( 'Text', domain );` )
			).toEqual( [
				{ fn: '_x', args: [ 'Text', '' ], comments: [] },
				{ fn: '__', args: [ 'Text', '' ], comments: [] },
			] );
		} );

		it( 'drops arguments past the text domain', () => {
			expect( extract( `__( 'Text', 'domain', extra );` ) ).toEqual( [
				{ fn: '__', args: [ 'Text', 'domain' ], comments: [] },
			] );
		} );
	} );

	describe( 'translator comments', () => {
		const commentOf = ( code, filename ) =>
			extract( code, filename ).map( ( { comments } ) => comments );

		it( 'attaches a block comment on the same line', () => {
			expect(
				commentOf( `/* translators: %s: Name. */ __( 'Hi %s' );` )
			).toEqual( [ [ 'translators: %s: Name.' ] ] );
		} );

		it( 'attaches a line comment on the line before', () => {
			expect(
				commentOf( `// translators: %s: Name.\n__( 'Hi %s' );` )
			).toEqual( [ [ 'translators: %s: Name.' ] ] );
		} );

		it( 'joins the lines of a multi-line comment, as make-pot does', () => {
			expect(
				commentOf(
					`/*\n * translators: %s: Name.\n * Second line.\n */\n__( 'Hi %s' );`
				)
			).toEqual( [ [ 'translators: %s: Name. Second line.' ] ] );
		} );

		it( 'ignores /*! comments, which make-pot does not read as translator comments', () => {
			expect(
				commentOf( `/*! translators: Legal. */\n__( 'Hi' );` )
			).toEqual( [ [] ] );
		} );

		it( 'accepts the "Translators" prefix, with or without a colon', () => {
			expect(
				commentOf(
					`/* Translators: One. */\n__( 'One' );\n/* translators two */\n__( 'Two' );`
				)
			).toEqual( [ [ 'Translators: One.' ], [ 'translators two' ] ] );
		} );

		it( 'attaches a comment above the statement when the call starts on the next line', () => {
			expect(
				commentOf(
					`// translators: %s: Name.\nconst message = sprintf( __( 'Hi %s' ), name );`
				)
			).toEqual( [ [ 'translators: %s: Name.' ] ] );
		} );

		it( 'does not attach a comment two or more lines above the call, as make-pot does not', () => {
			expect(
				commentOf( `// translators: Two lines up.\n\n__( 'Near' );` )
			).toEqual( [ [] ] );
			expect(
				commentOf(
					`// translators: Far.\nconst label =\n\tcondition\n\t\t? text\n\t\t: __( 'Far' );`
				)
			).toEqual( [ [] ] );
		} );

		it( 'does not attach a comment above a skipped call to the next call', () => {
			expect(
				commentOf(
					`// translators: Skipped.\n__( variable );\n__( 'Next' );`
				)
			).toEqual( [ [] ] );
		} );

		it( 'attaches a comment in front of an argument on a later line', () => {
			expect(
				commentOf( `__(\n\t/* translators: Inside. */\n\t'Inside'\n);` )
			).toEqual( [ [ 'translators: Inside.' ] ] );
		} );

		it( 'does not attach a comment after the call start on the same line', () => {
			expect(
				commentOf( `__( /* translators: After. */ 'After' );` )
			).toEqual( [ [] ] );
		} );

		it( 'attaches a comment to one call only', () => {
			expect(
				commentOf(
					`/* translators: Once. */ sprintf( __( 'One' ), __( 'Two' ) );`
				)
			).toEqual( [ [ 'translators: Once.' ], [] ] );
		} );

		it( 'keeps every translator comment in front of a call, in order', () => {
			expect(
				commentOf(
					`/* translators: First. */ /* translators: Second. */\n__( 'Both' );`
				)
			).toEqual( [ [ 'translators: First.', 'translators: Second.' ] ] );
		} );

		it( 'ignores a comment alone in a JSX expression container, as make-pot does', () => {
			expect(
				commentOf(
					`const el = (\n\t<p>\n\t\t{ /* translators: Alone. */ }\n\t\t{ __( 'Alone' ) }\n\t</p>\n);`,
					'file.jsx'
				)
			).toEqual( [ [] ] );
		} );
	} );
} );

describe( 'normalizeComment', () => {
	it( 'strips delimiters and leading stars like make-pot', () => {
		expect(
			normalizeComment( '/**\n * translators: A.\n *\n * B.\n */' )
		).toBe( 'translators: A. B.' );
		expect( normalizeComment( '// translators: Line.' ) ).toBe(
			'translators: Line.'
		);
	} );
} );

describe( 'renderStub', () => {
	const calls = [
		{ fn: '__', args: [ 'Hi %s' ], comments: [ 'translators: %s: Name.' ] },
		{ fn: '_x', args: [ 'Post', 'noun', 'domain' ], comments: [] },
		{
			fn: '_n',
			args: [ '%d "item"', '%d items', null ],
			comments: [ 'translators: Ends */ early.' ],
		},
		{ fn: '__', args: [ 'Hi %s' ], comments: [ 'translators: %s: Name.' ] },
		{ fn: '__', args: [ 'Hi %s' ], comments: [] },
	];
	const stub = renderStub( 'index.js', 'index.min.js', calls );

	it( 'puts each comment on the line before its call, where make-pot looks', () => {
		expect( stub ).toContain(
			'/* translators: %s: Name. */\n__("Hi %s");\n'
		);
	} );

	it( 'renders the number argument as 0 and escapes strings', () => {
		expect( stub ).toContain( '_n("%d \\"item\\"","%d items",0);' );
		expect( stub ).toContain( '_x("Post","noun","domain");' );
	} );

	it( 'escapes */ in comments, so a comment cannot end early', () => {
		expect( stub ).toContain( '/* translators: Ends *\\/ early. */' );
	} );

	it( 'removes duplicate entries, but keeps a call with a different comment', () => {
		expect( stub.match( /__\("Hi %s"\);/g ) ).toHaveLength( 2 );
	} );

	it( 'is valid JavaScript, so make-pot can parse it', () => {
		const { errors } = parseSync( 'index.js', stub, { lang: 'js' } );
		expect( errors ).toEqual( [] );
	} );

	it( 'throws before any call when executed, so loading it by mistake fails loudly', () => {
		expect( stub.split( '\n' )[ 5 ] ).toBe(
			'throw new Error( "index.js is a translation stub. Load index.min.js instead." );'
		);
		const context = vm.createContext( {
			__: () => {
				throw new Error( 'A call ran.' );
			},
		} );
		expect( () => vm.runInContext( stub, context ) ).toThrow(
			'index.js is a translation stub. Load index.min.js instead.'
		);
	} );
} );

describe( 'getStubFileName', () => {
	it( 'maps the minified file to the path load_script_textdomain() hashes', () => {
		expect( getStubFileName( 'index.min.js' ) ).toBe( 'index.js' );
		expect( getStubFileName( 'nested/content.min.js' ) ).toBe(
			'nested/content.js'
		);
	} );

	it( 'returns null for unminified files, so a real bundle is never overwritten', () => {
		expect( getStubFileName( 'index.js' ) ).toBeNull();
	} );
} );

describe( 'i18nStubPlugin', () => {
	let dir;

	beforeEach( async () => {
		dir = await mkdtemp( path.join( tmpdir(), 'wp-build-i18n-' ) );
		await mkdir( path.join( dir, 'src' ) );
		await mkdir( path.join( dir, 'build-module' ) );
		// The original source, with its translator comment.
		await writeFile(
			path.join( dir, 'src', 'used.ts' ),
			`import { __ } from '@wordpress/i18n';\n// translators: %s: Name.\nexport const used = ( name: string ) => __( 'Hi %s' ) + name;\n`
		);
		// The transpiled module, without comments, and its source map.
		await writeFile(
			path.join( dir, 'build-module', 'used.mjs' ),
			`import { __ } from '@wordpress/i18n';\nexport const used = ( name ) => __( 'Hi %s' ) + name;\n`
		);
		await writeFile(
			path.join( dir, 'build-module', 'used.mjs.map' ),
			JSON.stringify( {
				version: 3,
				sources: [ '../src/used.ts' ],
				names: [],
				mappings: '',
			} )
		);
		await writeFile(
			path.join( dir, 'build-module', 'unused.mjs' ),
			`import { __ } from '@wordpress/i18n';\nexport const unused = () => __( 'Unused' );\n`
		);
		await writeFile(
			path.join( dir, 'build-module', 'index.mjs' ),
			`import { used } from './used.mjs';\nimport { unused } from './unused.mjs';\nconsole.log( used( 'you' ) );\n`
		);
	} );

	afterEach( async () => {
		await rm( dir, { recursive: true, force: true } );
	} );

	const bundle = ( file ) =>
		build( {
			input: path.join( dir, 'build-module', 'index.mjs' ),
			external: [ '@wordpress/i18n' ],
			plugins: [ i18nStubPlugin() ],
			output: { file: path.join( dir, 'out', file ), format: 'esm' },
			logLevel: 'silent',
		} );

	it( 'writes the stub with comments from the original source, for bundled modules only', async () => {
		await bundle( 'index.min.js' );
		const stub = await readFile(
			path.join( dir, 'out', 'index.js' ),
			'utf8'
		);
		expect( stub ).toContain(
			'/* translators: %s: Name. */\n__("Hi %s");'
		);
		// Tree-shaken modules are left out.
		expect( stub ).not.toContain( 'Unused' );
	} );

	it( 'writes no stub next to an unminified bundle', async () => {
		await bundle( 'index.js' );
		const output = await readFile(
			path.join( dir, 'out', 'index.js' ),
			'utf8'
		);
		expect( output ).not.toContain( 'Translation stub' );
		expect( existsSync( path.join( dir, 'out', 'index.min.js' ) ) ).toBe(
			false
		);
	} );
} );
