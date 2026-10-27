#!/usr/bin/env node
/**
 * Removes props that are intentionally hidden from the components manifest.
 *
 * `react-component-meta` removes JSDoc tags from prop descriptions before it
 * writes the manifest, so post-processors cannot detect `@ignore` for these
 * props. Keep this map scoped to the components that own each hidden prop.
 */
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert';

/**
 * A manifest component with engine-specific prop data and recursive
 * subcomponents, which Storybook's `ComponentManifest` does not type.
 *
 * @typedef {Omit<import('storybook/internal/types').ComponentManifest, 'subcomponents'> & {
 *   reactComponentMeta?: { props?: Record<string,unknown> },
 *   reactDocgen?: { props?: Record<string,unknown> },
 *   reactDocgenTypescript?: { props?: Record<string,unknown> },
 *   subcomponents?: Record<string,WPManifestNode>,
 * }} WPManifestNode
 */

const manifestPath = process.argv[ 2 ];

assert( manifestPath, 'Manifest path is required' );

const ignoredPropsByComponent = new Map( [
	[ 'CircularOptionPicker', new Set( [ 'asButtons' ] ) ],
	[ 'ColorPalette', new Set( [ 'asButtons' ] ) ],
	[ 'DuotonePicker', new Set( [ 'asButtons' ] ) ],
	[ 'GradientPicker', new Set( [ 'asButtons' ] ) ],
] );

/**
 * @param {WPManifestNode} component A component or subcomponent to sanitize.
 */
function sanitizeComponent( component ) {
	const ignoredProps = ignoredPropsByComponent.get( component.name );

	for ( const propName of ignoredProps ?? [] ) {
		delete component.reactComponentMeta?.props?.[ propName ];
		delete component.reactDocgen?.props?.[ propName ];
		delete component.reactDocgenTypescript?.props?.[ propName ];
	}

	if ( component.subcomponents ) {
		for ( const sub of Object.values( component.subcomponents ) ) {
			sanitizeComponent( sub );
		}
	}
}

const raw = await readFile( manifestPath, 'utf8' );
/** @type {{ components?: Record<string,WPManifestNode> }} */
const manifest = JSON.parse( raw );
for ( const component of Object.values( manifest.components ?? {} ) ) {
	sanitizeComponent( component );
}
await writeFile( manifestPath, JSON.stringify( manifest, null, '\t' ) + '\n' );
