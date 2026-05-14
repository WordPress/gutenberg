#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import assert from 'node:assert';
import {
	parseComponents,
	parseComponentDetail,
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
