import { formatComponents, formatComponentDetail } from '../format';

describe( 'formatComponents', () => {
	it( 'should format components as markdown sections', () => {
		const result = formatComponents( [
			{
				name: 'Button',
				description: 'A button.',
				packageName: '@wordpress/ui',
			},
			{
				name: 'Badge',
				description: 'A badge.',
				packageName: '@wordpress/ui',
			},
		] );

		expect( result ).toBe(
			`# WordPress Design System Components

## Button

A button.

## Badge

A badge.`
		);
	} );

	it( 'should handle empty list', () => {
		expect( formatComponents( [] ) ).toBe(
			'# WordPress Design System Components'
		);
	} );

	it( 'should omit description when empty', () => {
		const result = formatComponents( [
			{
				name: 'Button',
				description: '',
				packageName: '@wordpress/ui',
			},
		] );

		expect( result ).toBe(
			`# WordPress Design System Components

## Button`
		);
	} );
} );

describe( 'formatComponentDetail', () => {
	it( 'should format name, package, and description', () => {
		const result = formatComponentDetail( {
			name: 'Button',
			description: 'A button component.',
			packageName: '@wordpress/ui',
			importStatement: null,
			props: [],
			stories: [],
		} );

		expect( result ).toBe(
			`# Button

A button component.

**Package:** \`@wordpress/ui\``
		);
	} );

	it( 'should format import statement', () => {
		const result = formatComponentDetail( {
			name: 'Button',
			description: '',
			packageName: '@wordpress/ui',
			importStatement: "import { Button } from '@wordpress/ui';",
			props: [],
			stories: [],
		} );

		expect( result ).toBe(
			`# Button

**Package:** \`@wordpress/ui\`

## Import

\`\`\`ts
import { Button } from '@wordpress/ui';
\`\`\``
		);
	} );

	it( 'should format props with types and defaults', () => {
		const result = formatComponentDetail( {
			name: 'Button',
			description: '',
			packageName: '@wordpress/ui',
			importStatement: null,
			props: [
				{
					name: 'variant',
					type: 'string',
					required: false,
					description: 'The button variant.',
					defaultValue: "'solid'",
				},
				{
					name: 'children',
					type: 'ReactNode',
					required: true,
					description: 'Button content.',
					defaultValue: null,
				},
			],
			stories: [],
		} );

		expect( result ).toBe(
			`# Button

**Package:** \`@wordpress/ui\`

## Props

### \`variant\`: \`string\` (default: \`'solid'\`)

The button variant.

### \`children\`: \`ReactNode\` **(required)**

Button content.
`
		);
	} );

	it( 'should format stories as code examples', () => {
		const result = formatComponentDetail( {
			name: 'Button',
			description: '',
			packageName: '@wordpress/ui',
			importStatement: null,
			props: [],
			stories: [
				{ name: 'Default', snippet: '<Button>Click</Button>' },
				{ name: 'No Snippet' },
			],
		} );

		expect( result ).toBe(
			`# Button

**Package:** \`@wordpress/ui\`

## Examples

### Default

\`\`\`tsx
<Button>Click</Button>
\`\`\`

### No Snippet
`
		);
	} );

	it( 'should omit sections when data is empty', () => {
		const result = formatComponentDetail( {
			name: 'Button',
			description: '',
			packageName: '@wordpress/ui',
			importStatement: null,
			props: [],
			stories: [],
		} );

		expect( result ).toBe(
			`# Button

**Package:** \`@wordpress/ui\``
		);
	} );
} );
