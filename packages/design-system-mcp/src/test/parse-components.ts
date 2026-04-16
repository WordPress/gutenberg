import {
	packageNameFromPath,
	parseProps,
	parseComponents,
	parseComponentDetail,
} from '../parse-components';
import type { ManifestComponent } from '../types';

describe( 'packageNameFromPath', () => {
	it( 'should return @wordpress/ui for packages/ui paths', () => {
		expect(
			packageNameFromPath(
				'../packages/ui/src/button/stories/index.story.tsx'
			)
		).toBe( '@wordpress/ui' );
	} );

	it( 'should return null for non-allowed packages', () => {
		expect(
			packageNameFromPath(
				'../packages/components/src/button/stories/index.story.tsx'
			)
		).toBeNull();
	} );

	it( 'should return null for non-package paths', () => {
		expect(
			packageNameFromPath(
				'./stories/design-system/theme-example-application.story.tsx'
			)
		).toBeNull();
	} );
} );

describe( 'parseProps', () => {
	it( 'should parse props with readable type expressions', () => {
		const result = parseProps( {
			disabled: {
				required: false,
				tsType: { name: 'boolean' },
				description: 'Whether the button is disabled.',
				defaultValue: { value: 'false' },
			},
			variant: {
				required: false,
				tsType: {
					name: 'union',
					raw: "'solid' | 'outline' | 'minimal' | 'unstyled'",
				},
				description: 'The button variant.',
			},
			style: {
				required: false,
				tsType: {
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
				tsType: { name: 'string' },
				description: 'The button variant.',
			},
			oldProp: {
				required: false,
				tsType: { name: 'string' },
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
				tsType: { name: 'boolean' },
				description: 'Whether visible.',
			},
			internal: {
				required: false,
				tsType: { name: 'string' },
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
			...value,
		};
	}
	return result;
}

describe( 'parseComponents', () => {
	it( 'should return only components from allowed packages', () => {
		const components = createComponents( {
			'ui-button': {
				name: 'Button',
				path: '../packages/ui/src/button/stories/index.story.tsx',
			},
			'components-button': {
				name: 'Button',
				path: '../packages/components/src/button/stories/index.story.tsx',
			},
		} );

		const result = parseComponents( components );
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].packageName ).toBe( '@wordpress/ui' );
	} );

	it( 'should exclude components with non-package paths', () => {
		const components = createComponents( {
			example: {
				name: 'ThemeProvider',
				path: './stories/design-system/theme-example-application.story.tsx',
			},
		} );

		expect( parseComponents( components ) ).toHaveLength( 0 );
	} );

	it( 'should not be confused by stories that import from allowed packages', () => {
		const components = createComponents( {
			example: {
				name: 'ThemeProvider',
				// Story lives in the theme package, not ui
				path: '../packages/theme/src/stories/index.story.tsx',
				// But the import mentions @wordpress/ui
				import: 'import { Badge, Button } from "@wordpress/ui";',
			},
		} );

		// Path-based detection correctly excludes this
		expect( parseComponents( components ) ).toHaveLength( 0 );
	} );

	it( 'should include description from manifest', () => {
		const components = createComponents( {
			badge: {
				name: 'Badge',
				description: 'A badge component.',
				path: '../packages/ui/src/badge/stories/index.story.tsx',
			},
		} );

		const result = parseComponents( components );
		expect( result[ 0 ].description ).toBe( 'A badge component.' );
	} );
} );

describe( 'parseComponentDetail', () => {
	it( 'should find a component by exact name', () => {
		const components = createComponents( {
			button: {
				name: 'Button',
				description: 'A button component.',
				path: '../packages/ui/src/button/stories/index.story.tsx',
				import: 'import { Button } from "@wordpress/ui";',
				reactDocgen: {
					props: {
						variant: {
							required: false,
							tsType: { name: 'string' },
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
			importStatement: 'import { Button } from "@wordpress/ui";',
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

	it( 'should prefer @wordpress/ui over other packages', () => {
		const components = createComponents( {
			'components-button': {
				name: 'Button',
				path: '../packages/components/src/button/stories/index.story.tsx',
				description: 'Old button.',
			},
			'ui-button': {
				name: 'Button',
				path: '../packages/ui/src/button/stories/index.story.tsx',
				description: 'New button.',
			},
		} );

		const result = parseComponentDetail( components, 'Button' );
		expect( result?.packageName ).toBe( '@wordpress/ui' );
		expect( result?.description ).toBe( 'New button.' );
	} );

	it( 'should return null for components only in non-allowed packages', () => {
		const components = createComponents( {
			oldButton: {
				name: 'Button',
				path: '../packages/components/src/button/stories/index.story.tsx',
			},
		} );

		expect( parseComponentDetail( components, 'Button' ) ).toBeNull();
	} );

	it( 'should filter deprecated props from detail', () => {
		const components = createComponents( {
			button: {
				name: 'Button',
				path: '../packages/ui/src/button/stories/index.story.tsx',
				reactDocgen: {
					props: {
						variant: {
							tsType: { name: 'string' },
							description: 'Current prop.',
						},
						legacy: {
							tsType: { name: 'string' },
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

	it( 'should not match non-package story paths', () => {
		const components = createComponents( {
			example: {
				name: 'ThemeProvider',
				path: './stories/design-system/theme-example-application.story.tsx',
				import: 'import { Badge } from "@wordpress/ui";',
			},
		} );

		expect(
			parseComponentDetail( components, 'ThemeProvider' )
		).toBeNull();
	} );
} );
