import { rolldown } from 'rolldown';
import { parseSync } from 'rolldown/utils';
import { describe, expect, it } from 'vitest';
import {
	keepTranslatorComments,
	translatorCommentsPlugin,
} from '../translator-comments-plugin.mjs';

const GETTEXT_FUNCTIONS = [ '__', '_x', '_n', '_nx' ];

/**
 * Bundle a module the way the non-minified builds do.
 *
 * @param {string}   code              Module source.
 * @param {Object}   options           Options.
 * @param {string}   options.extension Module file extension.
 * @param {boolean}  options.minify    Whether to minify the output.
 * @param {Object[]} options.plugins   Rolldown plugins.
 * @return {Promise<string>} Bundled code.
 */
async function bundle(
	code,
	{
		extension = 'jsx',
		minify = false,
		plugins = [ translatorCommentsPlugin() ],
	} = {}
) {
	const id = `/virtual/entry.${ extension }`;
	const build = await rolldown( {
		input: id,
		external: () => true,
		logLevel: 'silent',
		transform: { jsx: { runtime: 'automatic' } },
		plugins: [
			{
				name: 'virtual-entry',
				resolveId: ( source ) => ( source === id ? id : null ),
				load: ( moduleId ) => ( moduleId === id ? code : null ),
			},
			...plugins,
		],
	} );
	const { output } = await build.generate( { format: 'esm', minify } );
	await build.close();
	return output[ 0 ].code;
}

/**
 * Get the translator comments `wp i18n make-pot` gives each string in a file:
 * the unused translator comments that end on the line of the gettext call or
 * the line before, or that come before its first argument.
 *
 * @param {string} code Built code.
 * @return {Record<string, string[]>} Comments by string.
 */
function getExtractedComments( code ) {
	const { program, comments } = parseSync( 'output.js', code );
	const getLine = ( offset ) => code.slice( 0, offset ).split( '\n' ).length;
	const calls = [];
	( function visit( node ) {
		if (
			node.type === 'CallExpression' &&
			GETTEXT_FUNCTIONS.includes( node.callee.name ) &&
			node.arguments[ 0 ]?.type === 'Literal'
		) {
			calls.push( node );
		}
		for ( const child of Object.values( node ) ) {
			for ( const item of Array.isArray( child ) ? child : [ child ] ) {
				if ( item && typeof item.type === 'string' ) {
					visit( item );
				}
			}
		}
	} )( program );

	const used = new Set();
	const extracted = {};
	for ( const call of calls.sort( ( a, b ) => a.start - b.start ) ) {
		extracted[ call.arguments[ 0 ].value ] = comments
			.filter(
				( comment ) =>
					! used.has( comment ) &&
					/^[\s*]*translators/.test( comment.value ) &&
					comment.start < call.arguments[ 0 ].start &&
					getLine( call.start ) - getLine( comment.end ) <= 1
			)
			.map( ( comment ) => {
				used.add( comment );
				return comment.value.replace( /^[\s*]+|\s+$/g, '' );
			} );
	}
	return extracted;
}

describe( 'translatorCommentsPlugin', () => {
	it( 'keeps a line comment before a statement', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			// translators: Button label.
			export const label = __( 'Save' );
		` );

		expect( code ).toContain(
			'/** translators: Button label. */\nconst label = __("Save");'
		);
		expect( getExtractedComments( code ) ).toEqual( {
			Save: [ 'translators: Button label.' ],
		} );
	} );

	it( 'keeps a block comment before a statement', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			/* translators: %s: Post title. */
			export const message = __( '"%s" saved.' );
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			'"%s" saved.': [ 'translators: %s: Post title.' ],
		} );
	} );

	it( 'keeps a comment before a gettext call passed as an argument', async () => {
		const code = await bundle( `
			import { __, sprintf } from '@wordpress/i18n';
			export const message = ( name ) =>
				sprintf( /* translators: %s: Name. */ __( 'Hello %s' ), name );
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			'Hello %s': [ 'translators: %s: Name.' ],
		} );
	} );

	it( 'keeps a comment before the first argument of the gettext call', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export const label = __( /* translators: Inside the call. */ 'Inside' );
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Inside: [ 'translators: Inside the call.' ],
		} );
	} );

	it( 'keeps a comment before a conditional branch', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export const label = ( isDraft ) =>
				isDraft
					? /* translators: Draft label. */ __( 'Draft' )
					: /* translators: Published label. */ __( 'Published' );
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Draft: [ 'translators: Draft label.' ],
			Published: [ 'translators: Published label.' ],
		} );
	} );

	it( 'keeps a comment before an array element', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export const sizes = [
				/* translators: Small font size. */ __( 'S' ),
				// translators: Medium font size.
				__( 'M' ),
			];
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			S: [ 'translators: Small font size.' ],
			M: [ 'translators: Medium font size.' ],
		} );
	} );

	it( 'keeps a comment in an empty JSX expression container for the call that follows it', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export const Notice = () => (
				<p>
					{ /* translators: Notice text. */ }
					{ __( 'Saved' ) }
					<br />
				</p>
			);
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Saved: [ 'translators: Notice text.' ],
		} );
	} );

	it( 'keeps a comment before a JSX child expression', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export const Notice = () => (
				<p>
					{ /* translators: First line. */ __( 'One' ) }
					<br />
					{ /* translators: Second line. */ __( 'Two' ) }
				</p>
			);
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			One: [ 'translators: First line.' ],
			Two: [ 'translators: Second line.' ],
		} );
	} );

	it( 'keeps a comment before a JSX attribute value', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export const Field = () => (
				<input placeholder={ /* translators: Placeholder. */ __( 'Search' ) } />
			);
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Search: [ 'translators: Placeholder.' ],
		} );
	} );

	it( 'keeps a comment before a returned call', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export function getLabel() {
				return /* translators: Returned label. */ __( 'Label' );
			}
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Label: [ 'translators: Returned label.' ],
		} );
	} );

	it( 'keeps a comment before a logical operand', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			export const title = ( value ) =>
				value || /* translators: Fallback title. */ __( 'Untitled' );
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Untitled: [ 'translators: Fallback title.' ],
		} );
	} );

	it( 'keeps comments for every gettext function', async () => {
		const code = await bundle( `
			import { _x, _n, _nx } from '@wordpress/i18n';
			export const a = c ? /* translators: Context. */ _x( 'Post', 'noun' ) : 0;
			export const b = c ? /* translators: Plural. */ _n( 'One item', '%d items', n ) : 0;
			export const d = c ? /* translators: Both. */ _nx( 'One file', '%d files', n, 'ctx' ) : 0;
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Post: [ 'translators: Context.' ],
			'One item': [ 'translators: Plural.' ],
			'One file': [ 'translators: Both.' ],
		} );
	} );

	it( 'keeps comments in TypeScript modules', async () => {
		const code = await bundle(
			`
			import { __ } from '@wordpress/i18n';
			export const label = ( isOn: boolean ): string =>
				isOn ? /* translators: On state. */ __( 'On' ) : __( 'Off' );
		`,
			{ extension: 'tsx' }
		);

		expect( getExtractedComments( code ) ).toEqual( {
			On: [ 'translators: On state.' ],
			Off: [],
		} );
	} );

	it( 'keeps the comments when the output is bundled again', async () => {
		const transpiled = await bundle( `
			import { __ } from '@wordpress/i18n';
			// translators: Statement.
			export const a = __( 'A' );
			export const b = [ /* translators: Element. */ __( 'B' ) ];
		` );
		const bundled = await bundle( transpiled, {
			extension: 'js',
			plugins: [],
		} );

		expect( getExtractedComments( bundled ) ).toEqual( {
			A: [ 'translators: Statement.' ],
			B: [ 'translators: Element.' ],
		} );
	} );

	it( 'keeps a line comment that contains the end of a block comment', async () => {
		const code = await bundle( `
			import { __ } from '@wordpress/i18n';
			// translators: Use */ with care.
			export const label = __( 'Careful' );
		` );

		expect( getExtractedComments( code ) ).toEqual( {
			Careful: [ 'translators: Use * / with care.' ],
		} );
	} );

	it( 'leaves text that looks like a translator comment in strings, template literals and regular expressions unchanged', () => {
		const source = [
			"const a = '/* translators: In a string. */' + __( 'A' );",
			'const b = `// translators: In a template. ${ __( `B` ) }`;',
			'const c = /\\/\\* translators: In a regex \\*\\//.test( a ) && __( "C" );',
		].join( '\n' );

		expect( keepTranslatorComments( source, 'entry.js', 'js' ) ).toBe(
			null
		);
	} );

	it( 'leaves a translator comment with no gettext call on its line or the next unchanged', () => {
		const source = [
			'// translators: Too far away.',
			'',
			"const label = __( 'Label' );",
		].join( '\n' );

		expect( keepTranslatorComments( source, 'entry.js', 'js' ) ).toBe(
			null
		);
	} );

	it( 'keeps the line break of a moved multi-line comment', () => {
		const source = [
			'const label = isDraft ? /* translators:',
			'\tDraft label. */ __( "Draft" ) : "";',
		].join( '\n' );

		expect(
			keepTranslatorComments( source, 'entry.js', 'js' ).toString()
		).toBe(
			[
				'const label = isDraft ? ',
				' __( /** translators:',
				'\tDraft label. */ "Draft" ) : "";',
			].join( '\n' )
		);
	} );

	it( 'maps the code after a moved comment back to its source', () => {
		const source = "const a = c ? /* translators: A. */ __( 'A' ) : 0;";
		const magicString = keepTranslatorComments( source, 'entry.js', 'js' );
		const code = magicString.toString();
		const { mappings } = magicString.generateDecodedMap( { hires: true } );

		const segment = mappings[ 0 ].find(
			( [ generatedColumn ] ) => generatedColumn === code.indexOf( '__' )
		);
		expect( segment.slice( 2, 4 ) ).toEqual( [
			0,
			source.indexOf( '__' ),
		] );
	} );

	it( 'does not change the minified output', async () => {
		const source = `
			import { __ } from '@wordpress/i18n';
			// translators: Statement.
			export const a = __( 'A' );
			export const b = c ? /* translators: Branch. */ __( 'B' ) : [ /* translators: Element. */ __( 'C' ) ];
			export const D = () => <p>{ /* translators: JSX. */ }{ __( 'D' ) }<br /></p>;
		`;

		expect( await bundle( source, { minify: true } ) ).toBe(
			await bundle( source, { minify: true, plugins: [] } )
		);
	} );
} );
