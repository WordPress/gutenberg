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

const manifestPath = process.argv[ 2 ];

assert( manifestPath, 'Manifest path is required' );

const ignoredPropsByComponent = new Map( [
	[ 'CircularOptionPicker', new Set( [ 'asButtons' ] ) ],
	[ 'ColorPalette', new Set( [ 'asButtons' ] ) ],
	[ 'DuotonePicker', new Set( [ 'asButtons' ] ) ],
	[ 'GradientPicker', new Set( [ 'asButtons' ] ) ],
] );

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
const manifest = JSON.parse( raw );
for ( const component of Object.values( manifest.components ?? {} ) ) {
	sanitizeComponent( component );
}
await writeFile( manifestPath, JSON.stringify( manifest, null, '\t' ) + '\n' );
