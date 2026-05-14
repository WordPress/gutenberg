#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import {
	parseComponents,
	parseComponentDetail,
} from '@wordpress/design-system-mcp';

const path = process.argv[ 2 ] ?? 'storybook/build/manifests/components.json';
const manifest = JSON.parse( await readFile( path, 'utf8' ) );

const components = parseComponents( manifest.components );
if ( components.length === 0 ) {
	console.error(
		`No components parsed from ${ path }. Manifest shape may have changed.`
	);
	process.exit( 1 );
}

const component = parseComponentDetail( manifest.components, 'Badge' );
if ( ! component || component.props.length === 0 ) {
	console.error(
		`Sample component (Badge) has no props. Manifest shape may have changed.`
	);
	process.exit( 1 );
}

console.log(
	`Successfully validated manifest with ${ components.length } components.`
);
