import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import pluginModeOverrides from '../index';

const cwd = new URL( 'file:///virtual/' );

async function buildModeOverrides( {
	modeTokens,
	resolvedModeTokens = modeTokens,
	sourceByToken,
	removeTokensBeforeBuild = false,
}: {
	modeTokens: Record< string, Record< string, unknown > >;
	resolvedModeTokens?: Record< string, Record< string, unknown > >;
	sourceByToken: Record< string, string >;
	removeTokensBeforeBuild?: boolean;
} ) {
	const tokens = Object.fromEntries(
		Object.entries( sourceByToken ).map( ( [ id, filename ] ) => [
			id,
			{ source: { filename: new URL( filename, cwd ).href } },
		] )
	);
	const modifierName = 'themeMode';
	const resolver = {
		listPermutations: () => [
			{ [ modifierName ]: '.' },
			{ [ modifierName ]: 'compact' },
		],
		apply: vi.fn(
			(
				input: Record< string, string >,
				options?: { resolveAliases?: boolean }
			) => {
				if ( input[ modifierName ] !== 'compact' ) {
					return {};
				}

				return options?.resolveAliases === false
					? modeTokens
					: resolvedModeTokens;
			}
		),
	};
	const outputFiles = new Map< string, string >();
	const plugin = pluginModeOverrides();

	await plugin.transform?.( { tokens } as never );
	if ( removeTokensBeforeBuild ) {
		for ( const id of Object.keys( tokens ) ) {
			delete tokens[ id ];
		}
	}

	await plugin.build?.( {
		tokens,
		resolver,
		outputFile: ( filename: string, contents: string | Buffer ) => {
			outputFiles.set( filename, contents.toString() );
		},
	} as never );

	return outputFiles;
}

describe( 'pluginModeOverrides', () => {
	it( 'generates a mode override file for each source', async () => {
		const outputFiles = await buildModeOverrides( {
			modeTokens: {
				'wpds-border.radius.sm': {
					$type: 'dimension',
					$value: { value: 1, unit: 'px' },
				},
				'wpds-dimension.gap': {
					$type: 'dimension',
					$value: { value: 4, unit: 'px' },
				},
			},
			sourceByToken: {
				'wpds-border.radius.sm': 'border.json',
				'wpds-dimension.gap': 'dimension.json',
			},
		} );

		expect( outputFiles ).toEqual(
			new Map( [
				[
					fileURLToPath(
						new URL( 'modes/border.compact.json', cwd )
					),
					JSON.stringify(
						{
							'wpds-border': {
								radius: {
									sm: {
										$type: 'dimension',
										$value: { value: 1, unit: 'px' },
									},
								},
							},
						},
						null,
						'\t'
					),
				],
				[
					fileURLToPath(
						new URL( 'modes/dimension.compact.json', cwd )
					),
					JSON.stringify(
						{
							'wpds-dimension': {
								gap: {
									$type: 'dimension',
									$value: { value: 4, unit: 'px' },
								},
							},
						},
						null,
						'\t'
					),
				],
			] )
		);
	} );

	it( 'preserves unresolved aliases in generated mode overrides', async () => {
		const outputFiles = await buildModeOverrides( {
			modeTokens: {
				'wpds-dimension.gap': {
					$type: 'dimension',
					$value: '{wpds-dimension.base}',
				},
			},
			resolvedModeTokens: {
				'wpds-dimension.gap': {
					$type: 'dimension',
					$value: { value: 8, unit: 'px' },
				},
			},
			sourceByToken: {
				'wpds-dimension.gap': 'dimension.json',
			},
		} );
		const output = outputFiles.get(
			fileURLToPath( new URL( 'modes/dimension.compact.json', cwd ) )
		);

		expect( output ).toContain( '"$value": "{wpds-dimension.base}"' );
	} );

	it( 'generates mode overrides after other transforms remove tokens', async () => {
		const outputFiles = await buildModeOverrides( {
			modeTokens: {
				'wpds-dimension.primitive': {
					$type: 'dimension',
					$value: { value: 4, unit: 'px' },
				},
			},
			sourceByToken: {
				'wpds-dimension.primitive': 'dimension.json',
			},
			removeTokensBeforeBuild: true,
		} );

		expect(
			outputFiles.get(
				fileURLToPath( new URL( 'modes/dimension.compact.json', cwd ) )
			)
		).toContain( '"value": 4' );
	} );
} );
