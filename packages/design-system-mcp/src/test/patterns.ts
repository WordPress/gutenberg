import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PATTERNS, findPattern } from '../patterns';
import { stripMdx } from '../format';

const PATTERNS_DIR = fileURLToPath(
	new URL(
		'../../../../storybook/stories/design-system/patterns/',
		import.meta.url
	)
);

function sourceSlugs(): string[] {
	return readdirSync( PATTERNS_DIR )
		.filter( ( file ) => file.endsWith( '.mdx' ) )
		.map( ( file ) => file.replace( /\.mdx$/, '' ) )
		.sort();
}

describe( 'PATTERNS', () => {
	it( 'covers every pattern document in the Storybook stories directory', () => {
		expect( PATTERNS.map( ( { slug } ) => slug ).sort() ).toEqual(
			sourceSlugs()
		);
	} );

	it( 'gives every pattern a title and a description', () => {
		for ( const pattern of PATTERNS ) {
			expect( pattern.title ).not.toBe( '' );
			expect( pattern.description ).not.toBe( '' );
		}
	} );
} );

describe( 'findPattern', () => {
	it( 'finds a pattern regardless of casing and surrounding space', () => {
		expect( findPattern( '  Destructive-Actions ' ) ).toEqual(
			PATTERNS[ 0 ]
		);
	} );

	it( 'returns null for an unknown slug', () => {
		expect( findPattern( 'nope' ) ).toBeNull();
	} );
} );

describe( 'stripMdx', () => {
	it( 'leaves each pattern document starting at its markdown heading', () => {
		for ( const { slug, title } of PATTERNS ) {
			const source = readFileSync(
				`${ PATTERNS_DIR }${ slug }.mdx`,
				'utf8'
			);
			const stripped = stripMdx( source );

			expect( stripped.startsWith( `# ${ title }` ) ).toBe( true );
			expect( stripped ).not.toContain( '@storybook/addon-docs' );
			expect( stripped ).not.toContain( '<Meta' );
			expect( stripped ).not.toContain( '<Canvas' );
		}
	} );
} );
