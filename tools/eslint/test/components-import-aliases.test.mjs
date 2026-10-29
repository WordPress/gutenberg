import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import aliases from '../components-import-aliases.mjs';

const rootDir = resolve( import.meta.dirname, '../../..' );
const uiIndex = resolve( rootDir, 'packages/ui/src/index.ts' );
const componentsIndex = resolve( rootDir, 'packages/components/src/index.ts' );
const componentsPrivateApis = resolve(
	rootDir,
	'packages/components/src/private-apis.ts'
);

// Collisions that still lack an alias. Remove an entry when its rename lands.
const PENDING_ALIASES = new Set( [
	// Renaming the existing imports touches about 287 files, so it is done in
	// a separate PR.
	'Button',
] );

const ALIAS_FILE = 'tools/eslint/components-import-aliases.mjs';

function getModuleExports( files ) {
	const program = ts.createProgram( files, {
		allowJs: true,
		jsx: ts.JsxEmit.Preserve,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		noEmit: true,
		skipLibCheck: true,
	} );
	const checker = program.getTypeChecker();

	return files.map( ( file ) => {
		const moduleSymbol = checker.getSymbolAtLocation(
			program.getSourceFile( file )
		);
		return checker
			.getExportsOfModule( moduleSymbol )
			.map( ( symbol ) => symbol.name );
	} );
}

function getPrivateApiNames( file ) {
	const sourceFile = ts.createSourceFile(
		file,
		ts.sys.readFile( file ),
		ts.ScriptTarget.Latest
	);
	let names;

	function visit( node ) {
		if (
			ts.isCallExpression( node ) &&
			ts.isIdentifier( node.expression ) &&
			node.expression.text === 'lock' &&
			ts.isObjectLiteralExpression( node.arguments[ 1 ] )
		) {
			names = node.arguments[ 1 ].properties.map( ( property ) => {
				if ( ! property.name || ! ts.isIdentifier( property.name ) ) {
					throw new Error(
						`Unexpected private API property: ${ property.getText(
							sourceFile
						) }`
					);
				}
				return property.name.text;
			} );
			return;
		}
		ts.forEachChild( node, visit );
	}
	visit( sourceFile );

	if ( ! names ) {
		throw new Error( `No \`lock()\` call found in ${ file }` );
	}
	return names;
}

const [ uiExports, componentsExports ] = getModuleExports( [
	uiIndex,
	componentsIndex,
] );
const uiNames = new Set( uiExports );

// `__experimentalText` and `__experimentalInputControl` are already aliased to
// `WCText` and `WCInputControl`, so a `@wordpress/components` name collides
// when it matches a `@wordpress/ui` name after removing the prefix.
const collisions = [
	...componentsExports,
	...getPrivateApiNames( componentsPrivateApis ),
].filter( ( name ) => uiNames.has( name.replace( /^__experimental/, '' ) ) );

describe( '@wordpress/use-import-as aliases for @wordpress/components', () => {
	it( 'aliases every name that collides with a @wordpress/ui export', () => {
		const missing = collisions.filter(
			( name ) => ! aliases[ name ] && ! PENDING_ALIASES.has( name )
		);

		expect(
			missing,
			`These @wordpress/components exports have the same name as a @wordpress/ui export. Add a \`WC*\` alias for each to ${ ALIAS_FILE }, then run \`npm run lint:js:fix\` to rename the existing imports`
		).toEqual( [] );
	} );

	it( 'only aliases names that collide with a @wordpress/ui export', () => {
		const stale = Object.keys( aliases ).filter(
			( name ) => ! collisions.includes( name )
		);

		expect(
			stale,
			`These aliases in ${ ALIAS_FILE } no longer match a colliding export. Remove them, or update them if the export was renamed`
		).toEqual( [] );
	} );
} );
