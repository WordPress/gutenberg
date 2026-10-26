import { describe, expect, it } from 'vitest';
import { parsePatterns } from '../parse-patterns';
import type { ManifestComponent } from '../types';

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

	describe( 'examples', () => {
		const DOC_PATH = './stories/design-system/patterns/example.mdx';

		const COMPONENT: ManifestComponent = {
			id: 'design-system-patterns-example',
			name: 'Example',
			path: './stories/design-system/patterns/example.story.tsx',
			import: "import { Button } from '@wordpress/ui';",
			stories: [
				{
					id: 'design-system-patterns-example--default',
					name: 'Default',
					snippet: 'const Default = () => <Button>Save</Button>;',
				},
				{
					id: 'design-system-patterns-example--with-svg-icon',
					name: 'With SVG Icon',
					snippet:
						'const WithSVGIcon = () => <Button icon={ icon } />;',
				},
				{
					id: 'design-system-patterns-example--without-snippet',
					name: 'Without Snippet',
				},
			],
		};

		/**
		 * Parse a pattern document whose body is the given MDX, and return its
		 * content.
		 *
		 * @param body       - The MDX after the heading.
		 * @param components - The components manifest entries.
		 * @param imports    - The story file imports.
		 * @return The pattern content.
		 */
		function getContent(
			body: string,
			components: Record< string, ManifestComponent > = {
				[ COMPONENT.id ]: COMPONENT,
			},
			imports = "import * as Stories from './example.story';"
		) {
			const [ pattern ] = parsePatterns(
				{
					[ ID ]: {
						id: ID,
						path: DOC_PATH,
						content: `${ imports }\n\n# Example Pattern\n\nLead.\n\n${ body }`,
					},
				},
				components
			);

			return pattern.content;
		}

		it( 'should replace a canvas with the code of its story', () => {
			expect( getContent( '<Canvas of={ Stories.Default } />' ) ).toBe(
				`# Example Pattern

Lead.

\`\`\`tsx
import { Button } from '@wordpress/ui';

const Default = () => <Button>Save</Button>;
\`\`\``
			);
		} );

		it( 'should find stories whose export name has an acronym', () => {
			expect(
				getContent( '<Canvas of={ Stories.WithSVGIcon } />' )
			).toContain(
				'const WithSVGIcon = () => <Button icon={ icon } />;'
			);
		} );

		it( 'should find the story file of each import', () => {
			const other: ManifestComponent = {
				id: 'design-system-other',
				name: 'Other',
				path: './stories/design-system/other/other.story.tsx',
				stories: [
					{
						id: 'design-system-other--default',
						name: 'Default',
						snippet: 'const Default = () => <Other />;',
					},
				],
			};

			const content = getContent(
				'<Canvas of={ Stories.Default } />\n\n<Canvas of={ OtherStories.Default } />',
				{ [ COMPONENT.id ]: COMPONENT, [ other.id ]: other },
				[
					"import * as Stories from './example.story';",
					"import * as OtherStories from '../other/other.story';",
				].join( '\n' )
			);

			expect( content ).toContain( '<Button>Save</Button>' );
			expect( content ).toContain( 'const Default = () => <Other />;' );
			expect( content ).not.toContain( '<Canvas' );
		} );

		it( 'should omit the imports when the story file has none', () => {
			const { import: _, ...withoutImport } = COMPONENT;

			expect(
				getContent( '<Canvas of={ Stories.Default } />', {
					[ COMPONENT.id ]: withoutImport,
				} )
			).toContain(
				'```tsx\nconst Default = () => <Button>Save</Button>;\n```'
			);
		} );

		it.each( [
			[
				'there is no components manifest',
				'<Canvas of={ Stories.Default } />',
				{},
			],
			[
				'the story is not in the manifest',
				'<Canvas of={ Stories.Unknown } />',
				undefined,
			],
			[
				'the story has no snippet',
				'<Canvas of={ Stories.WithoutSnippet } />',
				undefined,
			],
			[
				'the story file is not imported',
				'<Canvas of={ Unknown.Default } />',
				undefined,
			],
		] )( 'should keep the canvas when %s', ( _, canvas, components ) => {
			expect( getContent( canvas, components ) ).toContain( canvas );
		} );
	} );
} );
