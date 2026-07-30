#!/usr/bin/env node
/**
 * Generates a small snapshot of the Storybook components manifest.
 *
 * The snapshot keeps only the parts of the manifest that matter for
 * documentation: Each component and the names of its visible (non-ignored)
 * props, and whether a component or prop has a description.
 *
 * Components and props that are already missing a description are listed in an
 * allowlist that should shrink over time.
 *
 * The snapshot is regenerated in CI, which fails if the committed file is out
 * of date.
 *
 * Usage: node generate-manifest-snapshot.mjs <manifestPath>
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert';
import jsYaml from 'js-yaml';

/** @typedef {import('storybook/internal/types').ComponentManifest} StorybookComponentManifest */

const MANIFEST_PATH = process.argv[ 2 ];
assert( MANIFEST_PATH, 'Usage: generate-manifest-snapshot.mjs <manifestPath>' );

const SNAPSHOT_PATH = path.join(
	import.meta.dirname,
	'..',
	'components-manifest.yml'
);
const ALLOWLIST_PATH = path.join(
	import.meta.dirname,
	'..',
	'prop-description-allowlist.json'
);

/**
 * A prop as it appears in the manifest.
 *
 * @typedef WPPropInfo
 *
 * @property {string} [description] The prop's description.
 */

/**
 * A component or subcomponent in the manifest. Based on Storybook's
 * `ComponentManifest`, adding the `reactComponentMeta` docgen output that
 * Storybook writes but does not type, and typing `subcomponents` recursively
 * (Storybook types them as a narrower shape without props).
 *
 * @typedef {Omit<StorybookComponentManifest, 'subcomponents'> & {
 *   reactComponentMeta?: { props?: Record<string,WPPropInfo> },
 *   subcomponents?: Record<string,WPManifestNode>,
 * }} WPManifestNode
 */

/**
 * A component built up from one or more manifest entries that share a name.
 *
 * @typedef WPCombinedComponent
 *
 * @property {string}                          name          The component name.
 * @property {Set<string>}                     props         Visible prop names.
 * @property {Map<string,WPCombinedComponent>} subcomponents Subcomponents by name.
 */

/**
 * A component as written to the snapshot file.
 *
 * @typedef WPSnapshotEntry
 *
 * @property {string}            name            The component name.
 * @property {string[]}          props           Sorted visible prop names.
 * @property {WPSnapshotEntry[]} [subcomponents] Sorted subcomponents.
 */

/**
 * Returns the props that show up in a component's documentation, leaving out
 * any hidden with `@ignore` or `@deprecated` (the same way Storybook and other
 * tools hide them).
 *
 * @param {WPManifestNode} node A component or subcomponent from the manifest.
 * @return {Array<[string,WPPropInfo]>} Pairs of prop name and its info.
 */
function visibleProps( node ) {
	/** @type {Record<string,WPPropInfo>} */
	const props = node.reactComponentMeta?.props ?? {};
	return Object.entries( props ).filter( ( [ , info ] ) => {
		const description = ( info.description || '' ).toLowerCase();
		return (
			! description.includes( '@ignore' ) &&
			! description.includes( '@deprecated' )
		);
	} );
}

/**
 * Adds a component (and its subcomponents) to `target`, a map keyed by
 * component name. A component documented across several story files shows up as
 * more than one manifest entry with the same name, so their props are combined
 * into a single entry. Any component or prop with no description is added to
 * `missing`.
 *
 * Subcomponents are prefixed with their parent's name (`Parent>Child`) so a
 * subcomponent can't clash with a same-named top-level component (for example,
 * `Navigator`'s `Button` vs. the top-level `Button`).
 *
 * @param {WPManifestNode}                  node          Component or subcomponent.
 * @param {Map<string,WPCombinedComponent>} target        Map of name to combined entry.
 * @param {Set<string>}                     missing       Collects undocumented names.
 * @param {string}                          qualifiedName The node's parent-qualified name.
 */
function mergeNode( node, target, missing, qualifiedName = node.name ) {
	let combined = target.get( node.name );
	if ( ! combined ) {
		combined = {
			name: node.name,
			props: new Set(),
			subcomponents: new Map(),
		};
		target.set( node.name, combined );
	}

	if ( ! node.description?.trim() ) {
		missing.add( qualifiedName );
	}

	for ( const [ propName, info ] of visibleProps( node ) ) {
		combined.props.add( propName );
		if ( ! info.description?.trim() ) {
			missing.add( `${ qualifiedName }:${ propName }` );
		}
	}

	if ( node.subcomponents ) {
		for ( const sub of Object.values( node.subcomponents ) ) {
			mergeNode(
				sub,
				combined.subcomponents,
				missing,
				`${ qualifiedName }>${ sub.name }`
			);
		}
	}
}

/**
 * Turns a combined component from `mergeNode` into the plain object written to
 * the snapshot file, sorting its props and subcomponents by name so the file
 * stays stable and easy to diff.
 *
 * @param {WPCombinedComponent} combined A combined component from `mergeNode`.
 * @return {WPSnapshotEntry} The component as it appears in the snapshot.
 */
function toEntry( combined ) {
	/** @type {WPSnapshotEntry} */
	const entry = {
		name: combined.name,
		props: [ ...combined.props ].sort( ( a, b ) => a.localeCompare( b ) ),
	};

	if ( combined.subcomponents.size > 0 ) {
		entry.subcomponents = [ ...combined.subcomponents.values() ]
			.map( toEntry )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) );
	}

	return entry;
}

const raw = await readFile( MANIFEST_PATH, 'utf8' );
/** @type {Record<string,WPManifestNode>} */
const components = JSON.parse( raw ).components;

assert(
	components && Object.keys( components ).length > 0,
	`No components found in ${ MANIFEST_PATH }. Manifest shape may have changed.`
);

const componentsByName = new Map();
const missingDescriptions = new Set();

for ( const component of Object.values( components ) ) {
	mergeNode( component, componentsByName, missingDescriptions );
}

const entries = [ ...componentsByName.values() ]
	.map( toEntry )
	.sort( ( a, b ) => a.name.localeCompare( b.name ) );

/** @type {string[]} */
let allowlist = [];
try {
	allowlist = JSON.parse( await readFile( ALLOWLIST_PATH, 'utf8' ) );
} catch ( error ) {
	if ( /** @type {NodeJS.ErrnoException} */ ( error ).code !== 'ENOENT' ) {
		throw error;
	}
}
const allowed = new Set( allowlist );

// Components or props newly missing a description that aren't in the allowlist.
// These fail the check.
const violations = [ ...missingDescriptions ]
	.filter( ( key ) => ! allowed.has( key ) )
	.sort();

// Drop allowlist entries that are no longer needed (now documented or removed).
const prunedAllowlist = [ ...allowed ]
	.filter( ( key ) => missingDescriptions.has( key ) )
	.sort();

const header =
	'# Auto-generated snapshot of the Storybook components manifest.\n' +
	'# Do not edit by hand. Regenerate with `npm run storybook:manifest-snapshot`\n' +
	'# and commit the result. See `storybook/README.md` for details.\n';
const snapshotYaml = header + jsYaml.dump( entries, { lineWidth: -1 } );

await Promise.all( [
	writeFile( SNAPSHOT_PATH, snapshotYaml ),
	writeFile(
		ALLOWLIST_PATH,
		JSON.stringify( prunedAllowlist, null, '\t' ) + '\n'
	),
] );

if ( violations.length > 0 ) {
	console.error(
		`Found ${ violations.length } component(s) or prop(s) missing a description:\n\n` +
			violations.map( ( key ) => `  - ${ key }` ).join( '\n' ) +
			`\n\nEvery component and prop should be documented. For each item above, either:\n` +
			`  - Add a JSDoc description in the source (preferred), or\n` +
			`  - Add its key to storybook/prop-description-allowlist.json if the gap is known and intentional for now.\n`
	);
	process.exitCode = 1;
}
