import { fileURLToPath } from 'node:url';
import pluginModeOverrides from '../index';

const cwd = new URL( 'file:///virtual/' );

async function buildModeOverrides( {
	sourceDocuments,
	modeTokens,
	sourceByToken,
	removeTokensBeforeBuild = false,
}: {
	sourceDocuments: Record< string, Record< string, unknown > >;
	modeTokens: Record< string, Record< string, unknown > >;
	sourceByToken: Record< string, string >;
	removeTokensBeforeBuild?: boolean;
} ) {
	const sources = Object.entries( sourceDocuments ).map(
		( [ filename, document ] ) => ( {
			filename: new URL( filename, cwd ),
			src: JSON.stringify( document ),
		} )
	);
	const tokens = Object.fromEntries(
		Object.entries( sourceByToken ).map( ( [ id, filename ] ) => [
			id,
			{ source: { filename: new URL( filename, cwd ).href } },
		] )
	);
	const resolver = {
		listPermutations: () => [ { tzMode: '.' }, { tzMode: 'compact' } ],
		apply: jest.fn( ( input: { tzMode: string } ) =>
			input.tzMode === 'compact' ? modeTokens : {}
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
		sources,
		resolver,
		outputFile: ( filename, contents ) => {
			outputFiles.set( filename, contents.toString() );
		},
	} as never );

	return outputFiles;
}

describe( 'pluginModeOverrides', () => {
	it( 'generates a mode override file for each source', async () => {
		const outputFiles = await buildModeOverrides( {
			sourceDocuments: {
				'border.json': {
					'wpds-border': {
						$type: 'dimension',
						radius: {
							sm: {
								$value: { value: 2, unit: 'px' },
								$extensions: {
									mode: {
										compact: {
											value: 1,
											unit: 'px',
										},
									},
								},
							},
						},
					},
				},
				'dimension.json': {
					'wpds-dimension': {
						$type: 'dimension',
						gap: {
							$value: { value: 8, unit: 'px' },
							$extensions: {
								mode: {
									compact: { value: 4, unit: 'px' },
								},
							},
						},
					},
				},
			},
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
			sourceDocuments: {
				'dimension.json': {
					'wpds-dimension': {
						$type: 'dimension',
						base: {
							$value: { value: 8, unit: 'px' },
						},
						gap: {
							$value: '{wpds-dimension.base}',
							$extensions: {
								mode: {
									compact: '{wpds-dimension.base}',
								},
							},
						},
					},
				},
			},
			modeTokens: {
				'wpds-dimension.gap': {
					$type: 'dimension',
					$value: '{wpds-dimension.base}',
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
			sourceDocuments: {
				'dimension.json': {
					'wpds-dimension': {
						$type: 'dimension',
						primitive: {
							$value: { value: 8, unit: 'px' },
							$extensions: {
								mode: {
									compact: { value: 4, unit: 'px' },
								},
							},
						},
					},
				},
			},
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
