import { readFile } from 'node:fs/promises';
import { build, defineConfig, parse, type Resolver } from '@terrazzo/parser';
import postcss from 'postcss';
import { beforeAll, describe, expect, it } from 'vitest';
import config from '../../terrazzo.config';

const cornerRadiusValues = {
	none: [ 0, 0, 0, 0, 0 ],
	subtle: [ 1, 2, 4, 8, 12 ],
	moderate: [ 6, 8, 12, 16, 20 ],
	pronounced: [ 18, 20, 22, 24, 26 ],
};

let resolver: Resolver;

async function parseWpdsResolver() {
	const [ resolverUrl ] = config.tokens;

	return parse(
		[
			{
				filename: resolverUrl,
				src: await readFile( resolverUrl, 'utf8' ),
			},
		],
		{ config }
	);
}

beforeAll( async () => {
	const result = await parseWpdsResolver();

	resolver = result.resolver;
} );

function getCornerRadiusValues( input: Record< string, string > ) {
	const tokens = resolver.apply( input );

	return [ 'xs', 'sm', 'md', 'lg', 'xl' ].map(
		( size ) =>
			(
				tokens[ `wpds-border.radius.${ size }` ].$value as {
					value: number;
				}
			 ).value
	);
}

function getCustomPropertyValue(
	css: string,
	{
		selector,
		property,
		media,
	}: { selector: string; property: string; media?: string }
) {
	let value: string | undefined;

	postcss.parse( css ).walkDecls( property, ( declaration ) => {
		const rule = declaration.parent;
		if ( rule?.type !== 'rule' || ! rule.selectors.includes( selector ) ) {
			return;
		}

		const parent = rule.parent;
		const mediaQuery =
			parent?.type === 'atrule' && parent.name === 'media'
				? parent.params
				: undefined;
		if (
			mediaQuery?.replaceAll( /\s/g, '' ) ===
			media?.replaceAll( /\s/g, '' )
		) {
			value = declaration.value;
		}
	} );

	return value;
}

describe( 'WordPress Design System token resolver', () => {
	it( 'keeps modifier application order-independent', () => {
		expect( resolver.orthogonal ).toBe( true );
	} );

	it( 'resolves the default border values', () => {
		const tokens = resolver.apply( {} );

		expect( getCornerRadiusValues( {} ) ).toEqual(
			cornerRadiusValues.subtle
		);
		expect( tokens[ 'wpds-border.width.focus' ].$value ).toEqual( {
			value: 2,
			unit: 'px',
		} );
	} );

	it.each( Object.entries( cornerRadiusValues ) )(
		'resolves the %s corner-radius context',
		( context, expectedValues ) => {
			expect(
				getCornerRadiusValues( { 'corner-radius': context } )
			).toEqual( expectedValues );
		}
	);

	it( 'resolves the high-DPI context without changing corner-radius values', () => {
		const tokens = resolver.apply( { 'pixel-density': 'high-dpi' } );

		expect( tokens[ 'wpds-border.width.focus' ].$value ).toEqual( {
			value: 1.5,
			unit: 'px',
		} );
		expect(
			getCornerRadiusValues( { 'pixel-density': 'high-dpi' } )
		).toEqual( cornerRadiusValues.subtle );
	} );

	it( 'emits the existing selectors and custom properties for contextual values', async () => {
		const result = await parseWpdsResolver();
		const { outputFiles } = await build( result.tokens, {
			sources: result.sources,
			config,
			resolver: result.resolver,
		} );
		const css = outputFiles.find(
			( file ) => file.filename === 'prebuilt/css/design-tokens.css'
		)?.contents;

		expect( css ).toBeDefined();
		expect(
			getCustomPropertyValue( css!, {
				selector: ':root',
				property: '--wpds-border-radius-xs',
			} )
		).toBe( '1px' );
		expect(
			getCustomPropertyValue( css!, {
				selector: ':root',
				property: '--wpds-border-width-focus',
				media: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
			} )
		).toBe( '1.5px' );
		expect(
			getCustomPropertyValue( css!, {
				selector: '[data-wpds-corner-radius="subtle"]',
				property: '--wpds-border-radius-xl',
			} )
		).toBe( '12px' );
		expect(
			getCustomPropertyValue( css!, {
				selector: '[data-wpds-corner-radius="moderate"]',
				property: '--wpds-border-radius-xl',
			} )
		).toBe( '20px' );
	} );

	it( 'retains contextual aliases while resolving generated values', async () => {
		const cwd = new URL( 'file:///virtual/' );
		const aliasConfig = defineConfig( {}, { cwd } );
		const aliasSource = {
			name: 'Alias fixture',
			version: '2025.10',
			sets: {
				base: {
					sources: [
						{
							spacing: {
								$root: {
									$type: 'dimension',
									$value: { value: 8, unit: 'px' },
								},
							},
						},
					],
				},
			},
			modifiers: {
				density: {
					default: 'comfortable',
					contexts: {
						comfortable: [],
						compact: [
							{
								gap: {
									$type: 'dimension',
									$value: '{spacing}',
								},
							},
						],
					},
				},
			},
			resolutionOrder: [
				{ $ref: '#/sets/base' },
				{ $ref: '#/modifiers/density' },
			],
		};
		const { resolver: aliasResolver } = await parse(
			[
				{
					filename: new URL( 'tokens.resolver.json', cwd ),
					src: JSON.stringify( aliasSource ),
				},
			],
			{ config: aliasConfig }
		);

		const unresolvedTokens = aliasResolver.apply(
			{ density: 'compact' },
			{
				sets: [],
				modifiers: [ 'density' ],
				resolveAliases: false,
			}
		);
		const resolvedTokens = aliasResolver.apply( { density: 'compact' } );

		expect( unresolvedTokens.gap.$value ).toBe( '{spacing}' );
		expect( resolvedTokens.gap.$value ).toEqual( {
			value: 8,
			unit: 'px',
		} );
	} );
} );
