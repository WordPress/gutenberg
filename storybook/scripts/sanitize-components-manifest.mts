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
import type { ComponentManifest } from 'storybook/internal/types';

/**
 * A manifest component with engine-specific prop data and recursive
 * subcomponents, which Storybook's `ComponentManifest` does not type.
 */
type WPManifestNode = Omit< ComponentManifest, 'subcomponents' > & {
	reactComponentMeta?: { props?: Record< string, unknown > };
	reactDocgen?: { props?: Record< string, unknown > };
	reactDocgenTypescript?: { props?: Record< string, unknown > };
	subcomponents?: Record< string, WPManifestNode >;
};

const manifestPath = process.argv[ 2 ];

assert( manifestPath, 'Manifest path is required' );

const ignoredPropsByComponent = new Map( [
	[ 'CircularOptionPicker', new Set( [ 'asButtons' ] ) ],
	[ 'ColorPalette', new Set( [ 'asButtons' ] ) ],
	[ 'DuotonePicker', new Set( [ 'asButtons' ] ) ],
	[ 'GradientPicker', new Set( [ 'asButtons' ] ) ],
] );

/**
 * @param component A component or subcomponent to sanitize.
 */
function sanitizeComponent( component: WPManifestNode ) {
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
const manifest: { components?: Record< string, WPManifestNode > } =
	JSON.parse( raw );
for ( const component of Object.values( manifest.components ?? {} ) ) {
	sanitizeComponent( component );
}
await writeFile( manifestPath, JSON.stringify( manifest, null, '\t' ) + '\n' );
