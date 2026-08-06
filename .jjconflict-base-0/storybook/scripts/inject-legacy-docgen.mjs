#!/usr/bin/env node
/**
 * Temporary backwards-compatibility shim for the components manifest.
 *
 * Storybook 10.3+ writes prop extraction output to engine-specific manifest
 * fields (`reactDocgen`, `reactDocgenTypescript`, `reactComponentMeta`)
 * instead of a single `reactDocgen` field as in 10.2. Deployed clients of
 * `@wordpress/design-system-mcp` were built against the 10.2 shape and read
 * only the legacy `reactDocgen` field. Without this shim, those clients
 * would see an empty manifest as soon as the new build is published, since
 * none of the components would carry a `reactDocgen` entry (we extract via
 * `react-component-meta`, which writes to `reactComponentMeta`).
 *
 * This script post-processes the built manifest to synthesize a
 * legacy-shaped `reactDocgen` field from `reactComponentMeta` data, so old
 * MCP clients keep returning sane results while new versions roll out to
 * users via the 2-week npm publish cadence.
 *
 * REMOVEME: This shim can be removed once `@wordpress/design-system-mcp` has
 * been published, since installation instructions for the MCP server point to
 * the latest version automatically.
 */
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert';

const manifestPath = process.argv[ 2 ];

assert( manifestPath, 'Manifest path is required' );

function addLegacyShape( component ) {
	if ( component.reactComponentMeta && ! component.reactDocgen ) {
		component.reactDocgen = {
			...component.reactComponentMeta,
			props: Object.fromEntries(
				Object.entries( component.reactComponentMeta.props ?? {} ).map(
					( [ name, { type, ...prop } ] ) => [
						name,
						{ ...prop, tsType: type },
					]
				)
			),
		};
	}

	if ( component.subcomponents ) {
		for ( const sub of Object.values( component.subcomponents ) ) {
			addLegacyShape( sub );
		}
	}
}

const raw = await readFile( manifestPath, 'utf8' );
const manifest = JSON.parse( raw );
for ( const component of Object.values( manifest.components ?? {} ) ) {
	addLegacyShape( component );
}
await writeFile( manifestPath, JSON.stringify( manifest, null, '\t' ) + '\n' );
