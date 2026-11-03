import { describe, expect, it } from 'vitest';
import { parsePatterns } from '../parse-patterns';

const MDX = `import { Canvas, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './example.story';

<Meta title="Design System/Patterns/Example Pattern" tags={ [ 'manifest' ] } />

# Example Pattern

The introductory paragraph,
wrapped over two lines.

## A section

<Canvas of={ Stories.Default } />

Body copy.
`;

const ID = 'design-system-patterns-example-pattern--docs';

describe( 'parsePatterns', () => {
	it( 'should parse a pattern from its manifest entry', () => {
		expect(
			parsePatterns( {
				[ ID ]: {
					id: ID,
					title: 'Design System/Patterns/Example Pattern',
					content: MDX,
				},
			} )
		).toEqual( [
			{
				slug: 'example-pattern',
				title: 'Example Pattern',
				description:
					'The introductory paragraph, wrapped over two lines.',
				content: `# Example Pattern

The introductory paragraph,
wrapped over two lines.

## A section

<Canvas of={ Stories.Default } />

Body copy.`,
			},
		] );
	} );

	it( 'should describe a pattern with the paragraph after its heading', () => {
		expect(
			parsePatterns( {
				[ ID ]: {
					id: ID,
					content: '{/* Note. */}\n\n# Example Pattern\n\nLead.',
				},
			} )
		).toMatchObject( [ { description: 'Lead.' } ] );
	} );

	it( 'should skip entries without content or outside the patterns', () => {
		expect(
			parsePatterns( {
				[ ID ]: { id: ID },
				'design-system-introduction--docs': {
					id: 'design-system-introduction--docs',
					content: MDX,
				},
			} )
		).toEqual( [] );
	} );
} );
