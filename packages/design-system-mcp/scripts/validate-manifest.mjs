#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import assert from 'node:assert';
import {
	parseComponents,
	parseComponentDetail,
	parsePatterns,
} from '@wordpress/design-system-mcp';

const path = process.argv[ 2 ] ?? 'storybook/build/manifests/components.json';
const { components } = JSON.parse( await readFile( path, 'utf8' ) );
const names = parseComponents( components ).map( ( { name } ) => name );

assert(
	names.length > 0,
	`No components parsed from ${ path }. Manifest shape may have changed.`
);

assert(
	names.some(
		( name ) => parseComponentDetail( components, name )?.props.length > 0
	),
	`No components have parsed props. Manifest shape may have changed.`
);

const docsPath = join( dirname( path ), 'docs.json' );
const { docs } = JSON.parse( await readFile( docsPath, 'utf8' ) );
const patterns = parsePatterns( docs );

assert(
	patterns.length > 0,
	`No patterns parsed from ${ docsPath }. Manifest shape may have changed.`
);
