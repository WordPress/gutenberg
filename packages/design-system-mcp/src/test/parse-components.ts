import {
	packageNameFromPath,
	parseProps,
	parseComponents,
	parseComponentDetail,
} from '../parse-components';
import type { ManifestComponent } from '../types';

describe( 'packageNameFromPath', () => {
	it( 'should derive @wordpress/<package> from any packages path', () => {
		expect(
			packageNameFromPath(
				'../packages/ui/src/button/stories/index.story.tsx'
			)
		).toBe( '@wordpress/ui' );
		expect(
			packageNameFromPath(
				'../packages/components/src/button/stories/index.story.tsx'
			)
		).toBe( '@wordpress/components' );
	} );

	it( 'should return null for non-package paths', () => {
		expect(
			packageNameFromPath(
				'./stories/design-system/theme-example-application.story.tsx'
			)
		).toBeNull();
	} );

	it( 'should return null when path is missing', () => {
		expect( packageNameFromPath( undefined ) ).toBeNull();
	} );
} );

describe( 'parseProps', () => {
	it( 'should parse props with readable type expressions', () => {
		const result = parseProps( {
			disabled: {
				required: false,
				type: { name: 'boolean' },
				description: 'Whether the button is disabled.',
				defaultValue: { value: 'false' },
			},
			variant: {
				required: false,
				type: {
					name: 'union',
					raw: "'solid' | 'outline' | 'minimal' | 'unstyled'",
				},
				description: 'The button variant.',
			},
			style: {
				required: false,
				type: {
					name: 'ReactCSSProperties',
					raw: 'React.CSSProperties',
				},
				description: 'Inline styles.',
			},
		} );

		expect( result ).toEqual( [
			{
				name: 'disabled',
				type: 'boolean',
				required: false,
				description: 'Whether the button is disabled.',
				defaultValue: 'false',
			},
			{
				name: 'variant',
				type: "'solid' | 'outline' | 'minimal' | 'unstyled'",
				required: false,
				description: 'The button variant.',
				defaultValue: null,
			},
			{
				name: 'style',
				type: 'React.CSSProperties',
				required: false,
				description: 'Inline styles.',
				defaultValue: null,
			},
		] );
	} );

	it( 'should filter out deprecated props', () => {
		const result = parseProps( {
			variant: {
				required: false,
				type: { name: 'string' },
				description: 'The button variant.',
			},
			oldProp: {
				required: false,
				type: { name: 'string' },
				description: '@deprecated Use variant instead.',
			},
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'variant' );
	} );

	it( 'should filter out ignored props', () => {
		const result = parseProps( {
			visible: {
				required: true,
				type: { name: 'boolean' },
				description: 'Whether visible.',
			},
			internal: {
				required: false,
				type: { name: 'string' },
				description: '@ignore Internal use only.',
			},
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'visible' );
	} );

	it( 'should default missing type to unknown', () => {
		const result = parseProps( {
			something: {
				description: 'A prop without type info.',
			},
		} );

		expect( result[ 0 ].type ).toBe( 'unknown' );
	} );

	it( 'should default missing values', () => {
		const result = parseProps( {
			minimal: {},
		} );

		expect( result[ 0 ] ).toEqual( {
			name: 'minimal',
			type: 'unknown',
			required: false,
			description: '',
			defaultValue: null,
		} );
	} );
} );

function createComponents(
	entries: Record< string, Partial< ManifestComponent > >
): Record< string, ManifestComponent > {
	const result: Record< string, ManifestComponent > = {};
	for ( const [ key, value ] of Object.entries( entries ) ) {
		result[ key ] = {
			id: key,
			name: value.name ?? key,
			path:
				value.path ??
				`../packages/ui/src/${ key }/stories/index.story.tsx`,
			stories: [],
			...value,
		};
	}
	return result;
}

describe( 'parseComponents', () => {
	it( 'should return name and description for each component', () => {
		const components = createComponents( {
			'ui-badge': {
				name: 'Badge',
				description: 'A badge.',
				path: '../packages/ui/src/badge/stories/index.story.tsx',
			},
			'components-button': {
				name: 'Button',
				description: 'A button.',
				path: '../packages/components/src/button/stories/index.story.tsx',
			},
		} );

		expect( parseComponents( components ) ).toEqual( [
			{ name: 'Badge', description: 'A badge.' },
			{ name: 'Button', description: 'A button.' },
		] );
	} );

	it( 'should include components without a path (ref-index entries)', () => {
		const components = {
			example: {
				id: 'example',
				name: 'ThemeProvider',
				description: 'A playground example.',
			},
		};

		expect( parseComponents( components ) ).toEqual( [
			{ name: 'ThemeProvider', description: 'A playground example.' },
		] );
	} );

	it( 'should use the root identifier as the canonical name for compound components', () => {
		const components = createComponents( {
			'alert-dialog': {
				name: 'AlertDialog.Root',
				description: 'An alert dialog.',
			},
		} );

		expect( parseComponents( components ) ).toEqual( [
			{ name: 'AlertDialog', description: 'An alert dialog.' },
		] );
	} );

	it( 'should return components sorted alphabetically by name', () => {
		const components = createComponents( {
			a: { name: 'Tabs' },
			b: { name: 'Badge' },
			c: { name: 'Notice' },
		} );

		expect( parseComponents( components ).map( ( c ) => c.name ) ).toEqual(
			[ 'Badge', 'Notice', 'Tabs' ]
		);
	} );

	it( 'should list a component only once when multiple story files contribute entries', () => {
		const components = createComponents( {
			'badge-index': {
				name: 'Badge',
				description: 'A badge component.',
			},
			'badge-intent': {
				name: 'Badge',
				description: 'A badge component.',
			},
		} );

		expect( parseComponents( components ) ).toEqual( [
			{ name: 'Badge', description: 'A badge component.' },
		] );
	} );

	it( 'should prefer a non-empty description when merging entries', () => {
		const components = createComponents( {
			'badge-index': {
				name: 'Badge',
			},
			'badge-intent': {
				name: 'Badge',
				description: 'A badge component.',
			},
		} );

		expect( parseComponents( components ) ).toEqual( [
			{ name: 'Badge', description: 'A badge component.' },
		] );
	} );
} );

describe( 'parseComponentDetail', () => {
	it( 'should find a component by exact name', () => {
		const components = createComponents( {
			button: {
				name: 'Button',
				description: 'A button component.',
				path: '../packages/ui/src/button/stories/index.story.tsx',
				reactComponentMeta: {
					props: {
						variant: {
							required: false,
							type: { name: 'string' },
							description: 'The button variant.',
						},
					},
				},
				stories: [ { name: 'Default', snippet: '<Button />' } ],
			},
		} );

		const result = parseComponentDetail( components, 'Button' );
		expect( result ).toEqual( {
			name: 'Button',
			description: 'A button component.',
			packageName: '@wordpress/ui',
			importStatement: "import { Button } from '@wordpress/ui';",
			props: [
				{
					name: 'variant',
					type: 'string',
					required: false,
					description: 'The button variant.',
					defaultValue: null,
				},
			],
			stories: [ { name: 'Default', snippet: '<Button />' } ],
		} );
	} );

	it( 'should match case-insensitively', () => {
		const components = createComponents( {
			button: {
				name: 'Button',
				path: '../packages/ui/src/button/stories/index.story.tsx',
			},
		} );

		expect( parseComponentDetail( components, 'button' ) ).not.toBeNull();
		expect( parseComponentDetail( components, 'BUTTON' ) ).not.toBeNull();
	} );

	it( 'should return null for unknown components', () => {
		expect( parseComponentDetail( {}, 'NonExistent' ) ).toBeNull();
	} );

	it( 'should return detail for a component from @wordpress/components', () => {
		const components = createComponents( {
			button: {
				name: 'Button',
				description: 'A button component.',
				path: '../packages/components/src/button/stories/index.story.tsx',
			},
		} );

		const result = parseComponentDetail( components, 'Button' );
		expect( result ).toEqual(
			expect.objectContaining( {
				name: 'Button',
				packageName: '@wordpress/components',
				importStatement:
					"import { Button } from '@wordpress/components';",
			} )
		);
	} );

	it( 'should emit an aliased import for a component exported with an __experimental prefix', () => {
		const components = createComponents( {
			truncate: {
				name: 'Truncate',
				path: '../packages/components/src/truncate/stories/index.story.tsx',
			},
		} );

		const result = parseComponentDetail( components, 'Truncate' );
		expect( result?.importStatement ).toBe(
			"import { __experimentalTruncate as Truncate } from '@wordpress/components';"
		);
	} );

	it( 'should filter deprecated props from detail', () => {
		const components = createComponents( {
			button: {
				name: 'Button',
				path: '../packages/ui/src/button/stories/index.story.tsx',
				reactComponentMeta: {
					props: {
						variant: {
							type: { name: 'string' },
							description: 'Current prop.',
						},
						legacy: {
							type: { name: 'string' },
							description: '@deprecated Use variant.',
						},
					},
				},
			},
		} );

		const result = parseComponentDetail( components, 'Button' );
		expect( result?.props ).toHaveLength( 1 );
		expect( result?.props[ 0 ].name ).toBe( 'variant' );
	} );

	it( 'should still return detail without package when path is non-package', () => {
		const components = createComponents( {
			example: {
				name: 'ThemeProvider',
				description: 'Playground theme provider.',
				path: './stories/design-system/theme-example-application.story.tsx',
			},
		} );

		expect( parseComponentDetail( components, 'ThemeProvider' ) ).toEqual( {
			name: 'ThemeProvider',
			description: 'Playground theme provider.',
			packageName: null,
			importStatement: null,
			props: [],
			stories: [],
		} );
	} );

	it( 'should include stories from every story file contributing to a component', () => {
		const components = createComponents( {
			'badge-index': {
				name: 'Badge',
				path: '../packages/ui/src/badge/stories/index.story.tsx',
				stories: [
					{ name: 'Default', snippet: '<Badge />' },
					{ name: 'High', snippet: '<Badge intent="high" />' },
				],
			},
			'badge-intent': {
				name: 'Badge',
				path: '../packages/ui/src/badge/stories/usage-guidelines.story.tsx',
				stories: [
					{
						name: 'High',
						snippet: '<Badge intent="high">Contextual</Badge>',
					},
					{ name: 'All Intents', snippet: '<Badge />' },
				],
			},
		} );

		const result = parseComponentDetail( components, 'Badge' );
		expect( result?.stories ).toEqual( [
			{ name: 'Default', snippet: '<Badge />' },
			{ name: 'High', snippet: '<Badge intent="high" />' },
			{
				name: 'High',
				snippet: '<Badge intent="high">Contextual</Badge>',
			},
			{ name: 'All Intents', snippet: '<Badge />' },
		] );
	} );

	it( 'should prefer a non-empty description when merging story files', () => {
		const components = createComponents( {
			'badge-index': {
				name: 'Badge',
				path: '../packages/ui/src/badge/stories/index.story.tsx',
			},
			'badge-intent': {
				name: 'Badge',
				description: 'A badge component.',
				path: '../packages/ui/src/badge/stories/usage-guidelines.story.tsx',
			},
		} );

		const result = parseComponentDetail( components, 'Badge' );
		expect( result?.description ).toBe( 'A badge component.' );
	} );

	it( 'should prefer non-empty props when merging story files', () => {
		const components = createComponents( {
			'badge-index': {
				name: 'Badge',
				path: '../packages/ui/src/badge/stories/index.story.tsx',
			},
			'badge-intent': {
				name: 'Badge',
				path: '../packages/ui/src/badge/stories/usage-guidelines.story.tsx',
				reactComponentMeta: {
					props: {
						intent: {
							type: { name: 'string' },
							description: 'The badge intent.',
						},
					},
				},
			},
		} );

		const result = parseComponentDetail( components, 'Badge' );
		expect( result?.props ).toHaveLength( 1 );
		expect( result?.props[ 0 ].name ).toBe( 'intent' );
	} );

	it( 'should return detail for a compound component by its root identifier', () => {
		const components = createComponents( {
			'alert-dialog': {
				name: 'AlertDialog.Root',
				description: 'An alert dialog.',
				path: '../packages/ui/src/alert-dialog/stories/index.story.tsx',
			},
		} );

		const result = parseComponentDetail( components, 'AlertDialog' );
		expect( result ).toEqual(
			expect.objectContaining( {
				name: 'AlertDialog',
				importStatement: "import { AlertDialog } from '@wordpress/ui';",
			} )
		);
	} );

	it( 'should normalize story maps from docgen-server payloads', () => {
		const components = createComponents( {
			button: {
				name: 'Button',
				path: '../packages/ui/src/button/stories/index.story.tsx',
				stories: {
					'button--default': {
						name: 'Default',
						snippet: '<Button />',
					},
				},
			},
		} );

		expect( parseComponentDetail( components, 'Button' )?.stories ).toEqual(
			[ { name: 'Default', snippet: '<Button />' } ]
		);
	} );
} );
