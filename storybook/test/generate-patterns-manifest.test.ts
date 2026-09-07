import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	PATTERNS_DIR,
	generatePatternsManifest,
	parsePatternDocument,
	stripMdx,
} from '../scripts/generate-patterns-manifest.mjs';

const MDX = `import { Canvas, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './example.story';

<Meta of={ Stories } />

# Example Pattern

The introductory paragraph,
wrapped over two lines.

## A section

<Canvas of={ Stories.Default } />

Body copy.
`;

describe( 'generatePatternsManifest', () => {
	it( 'includes every pattern document in the stories directory', async () => {
		const manifest = await generatePatternsManifest();
		const files = readdirSync( PATTERNS_DIR )
			.filter( ( file: string ) => file.endsWith( '.mdx' ) )
			.map( ( file: string ) => file.replace( /\.mdx$/, '' ) )
			.sort();

		expect( Object.keys( manifest.patterns ).sort() ).toEqual( files );
	} );

	it( 'describes each pattern with its own heading and introduction', async () => {
		const manifest = await generatePatternsManifest();

		for ( const pattern of Object.values( manifest.patterns ) ) {
			expect( pattern.content ).toContain( `# ${ pattern.title }` );
			expect( pattern.description ).not.toBe( '' );
			expect( pattern.content ).not.toContain( '@storybook/addon-docs' );
		}
	} );
} );

describe( 'parsePatternDocument', () => {
	it( 'takes the title and description from the document itself', () => {
		expect( parsePatternDocument( 'example', MDX ) ).toMatchObject( {
			slug: 'example',
			title: 'Example Pattern',
			description: 'The introductory paragraph, wrapped over two lines.',
		} );
	} );

	it( 'throws when a document has no heading to name it', () => {
		expect( () => parsePatternDocument( 'example', 'Body copy.' ) ).toThrow(
			'no top-level markdown heading'
		);
	} );

	it( 'throws when a document has no introduction to describe it', () => {
		expect( () =>
			parsePatternDocument( 'example', '# Example Pattern\n' )
		).toThrow( 'no introductory paragraph' );
	} );
} );

describe( 'stripMdx', () => {
	it( 'removes the Storybook framing and leaves markdown', () => {
		expect( stripMdx( MDX ) ).toBe(
			`# Example Pattern

The introductory paragraph,
wrapped over two lines.

## A section

Body copy.`
		);
	} );
} );
