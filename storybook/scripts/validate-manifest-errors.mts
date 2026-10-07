#!/usr/bin/env node
/**
 * Fails when a component or story in the components manifest has an error.
 *
 * Storybook still builds when it cannot read a component or make a code
 * snippet for a story (for example, when a story reuses another story's
 * `render`), but the manifest that tools and documentation read then shows an
 * error in place of that information.
 *
 * Usage: node validate-manifest-errors.mts <manifestPath>
 */
import { readFile } from 'node:fs/promises';
import assert from 'node:assert';
import type { ComponentsManifest } from 'storybook/internal/types';

const manifestPath = process.argv[ 2 ];
assert( manifestPath, 'Usage: validate-manifest-errors.mts <manifestPath>' );

const { components }: ComponentsManifest = JSON.parse(
	await readFile( manifestPath, 'utf8' )
);

const errors: string[] = [];
for ( const component of Object.values( components ) ) {
	if ( component.error ) {
		errors.push( `${ component.name }\n${ component.error.message }` );
	}

	for ( const story of component.stories ) {
		if ( story.error ) {
			errors.push(
				`${ component.name } > ${ story.name }\n${ story.error.message }`
			);
		}
	}
}

if ( errors.length > 0 ) {
	console.error(
		`Found ${ errors.length } error(s) in the components manifest:\n\n` +
			errors.join( '\n\n' )
	);
	process.exitCode = 1;
}
