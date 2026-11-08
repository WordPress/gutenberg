import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PATTERNS_DIR = new URL(
	'../stories/design-system/patterns/',
	import.meta.url
);

describe( 'design system patterns', () => {
	const files = readdirSync( PATTERNS_DIR ).filter( ( file ) =>
		file.endsWith( '.mdx' )
	);

	// See the "Manifests" section of `storybook/README.md`.
	it.each( files )( '%s is included in the docs manifest', ( file ) => {
		const source = readFileSync( new URL( file, PATTERNS_DIR ), 'utf8' );

		expect( source ).toMatch( /<Meta\s[^>]*tags=\{[^}]*'manifest'/ );
		expect( source ).not.toMatch( /<Meta\s[^>]*\sof=/ );
	} );

	it.each( files )( '%s starts with a lead paragraph', ( file ) => {
		const source = readFileSync( new URL( file, PATTERNS_DIR ), 'utf8' );

		expect( source ).toMatch( /^# .+\n\n[^#<\-*\s]/m );
	} );
} );
