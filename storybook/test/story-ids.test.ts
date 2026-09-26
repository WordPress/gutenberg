import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseSync, traverse } from '@babel/core';
import type { Node, ObjectExpression } from '@babel/types';
import { storyGlobs } from '../story-globs';

const CONFIG_DIR = path.join( __dirname, '..' );

/**
 * Turns one of Storybook's `stories` globs into an equivalent regular
 * expression. Only the syntax those globs use is supported: `**`, `*` and
 * `@(a|b)`.
 *
 * @param glob A glob relative to the Storybook config directory.
 * @return A pattern matching the paths the glob covers.
 */
function globToRegExp( glob: string ) {
	const escape = ( value: string ) =>
		value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const tokens = glob.match( /@\([^)]+\)|\*\*\/|\*|[^*@]+|./g ) ?? [];

	const pattern = tokens
		.map( ( token ) => {
			if ( token.startsWith( '@(' ) ) {
				const alternatives = token.slice( 2, -1 ).split( '|' );
				return `(?:${ alternatives.map( escape ).join( '|' ) })`;
			}
			if ( token === '**/' ) {
				return '(?:[^/]+/)*';
			}
			if ( token === '*' ) {
				return '[^/]*';
			}
			return escape( token );
		} )
		.join( '' );

	return new RegExp( `^${ pattern }$` );
}

/**
 * Lists every story and doc Storybook indexes, by walking the directories the
 * `stories` globs point at and keeping the paths those globs match.
 *
 * @return Paths relative to the Storybook config directory, written the same
 *         way the globs are so they can be matched against them.
 */
function findStoryFiles() {
	const files = new Set< string >();

	for ( const glob of storyGlobs ) {
		const prefix = glob.slice( 0, glob.indexOf( '*' ) );
		const walked = readdirSync( path.join( CONFIG_DIR, prefix ), {
			recursive: true,
		} );
		const matches = globToRegExp( glob );

		for ( const entry of walked ) {
			const file =
				prefix + entry.toString().split( path.sep ).join( '/' );
			if ( matches.test( file ) ) {
				files.add( file );
			}
		}
	}

	return [ ...files ].sort();
}

/**
 * Unwraps the `as`/`satisfies` assertions Storybook metas are often written
 * with, returning the object expression underneath.
 *
 * @param node The default export, or a variable's initializer.
 * @return The object expression, or `undefined` for anything else.
 */
function toObjectExpression(
	node: Node | null | undefined
): ObjectExpression | undefined {
	let current = node;
	while (
		current?.type === 'TSAsExpression' ||
		current?.type === 'TSSatisfiesExpression'
	) {
		current = current.expression;
	}
	return current?.type === 'ObjectExpression' ? current : undefined;
}

/**
 * Finds the meta object a CSF file exports by default, whether it is written
 * inline (`export default { ... }`) or through a variable
 * (`const meta = { ... }`).
 *
 * @param source The file's contents.
 * @return The meta object, or `undefined` when there is no object to find.
 */
function findMeta( source: string ): ObjectExpression | undefined {
	const ast = parseSync( source, {
		babelrc: false,
		configFile: false,
		filename: 'story.tsx',
		parserOpts: { plugins: [ 'typescript', 'jsx' ] },
	} );
	if ( ! ast ) {
		return undefined;
	}

	let meta: ObjectExpression | undefined;
	let metaName: string | undefined;

	traverse( ast, {
		ExportDefaultDeclaration( { node } ) {
			meta = toObjectExpression( node.declaration );
			if ( ! meta && node.declaration.type === 'Identifier' ) {
				metaName = node.declaration.name;
			}
		},
	} );

	if ( ! meta && metaName ) {
		traverse( ast, {
			VariableDeclarator( { node } ) {
				if (
					node.id.type === 'Identifier' &&
					node.id.name === metaName
				) {
					meta = toObjectExpression( node.init );
				}
			},
		} );
	}

	return meta;
}

/**
 * Whether a story or doc pins its own URL with an `id`.
 *
 * An MDX doc attached to a CSF file with `of={ ... }` inherits that file's ID,
 * so it has nothing of its own to declare.
 *
 * @param file Path to the story or doc, relative to the Storybook config.
 * @return `true` when the file's URL cannot move with its title.
 */
function hasStableId( file: string ) {
	const source = readFileSync( path.join( CONFIG_DIR, file ), 'utf8' );

	if ( file.endsWith( '.mdx' ) ) {
		const tag = source.match( /<Meta\b[\s\S]*?\/>/ )?.[ 0 ] ?? '';
		return /\bid=/.test( tag ) || /\bof=/.test( tag );
	}

	return Boolean(
		findMeta( source )?.properties.some(
			( property ) =>
				property.type === 'ObjectProperty' &&
				property.key.type === 'Identifier' &&
				property.key.name === 'id'
		)
	);
}

describe( 'story IDs', () => {
	const files = findStoryFiles();

	it( 'covers every story and doc', () => {
		// Guards against the walk silently matching nothing, which would let
		// the check below pass without reading a single file.
		expect( files.length ).toBeGreaterThan( 250 );
	} );

	// A story's URL is built from its `id`, falling back to its `title`. Only a
	// declared `id` keeps the URL from moving when the story does.
	it.each( files )( '%s declares an id', ( file ) => {
		expect( hasStableId( file ) ).toBe( true );
	} );
} );
