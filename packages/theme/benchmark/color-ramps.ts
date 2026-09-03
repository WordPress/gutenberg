/* eslint-disable no-console -- This command writes benchmark output. */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

type RampModule = typeof import('../src/color-ramps/index.ts');
type RampOutput = ReturnType< RampModule[ 'buildAccentRamp' ] >;

type BenchmarkResult = {
	name: string;
	iterationsPerSample: number;
	medianMs: number;
	p95Ms: number;
	checksum: number;
};

type BenchmarkReport = {
	label: string;
	environment: {
		node: string;
		platform: NodeJS.Platform;
		arch: string;
	};
	warmupSamples: number;
	measuredSamples: number;
	fixtures: typeof FIXTURES;
	results: BenchmarkResult[];
};

type BenchmarkCase = {
	name: string;
	iterationsPerSample: number;
	run: () => RampOutput | RampOutput[];
};

const WARMUP_SAMPLES = 8;
const MEASURED_SAMPLES = 30;
const SCRIPT_PATH = fileURLToPath( import.meta.url );
const DEFAULT_SOURCE_ROOT = resolve( dirname( SCRIPT_PATH ), '../../..' );
const FIXTURES = [
	{
		name: 'default-light',
		background: '#fcfcfc',
		primary: '#3858e9',
	},
	{
		name: 'default-dark',
		background: '#1e1e1e',
		primary: '#3858e9',
	},
	{
		name: 'ectoplasm',
		background: '#413256',
		primary: '#a3b745',
	},
] as const;

const HELP = `Theme color ramp benchmark

Usage:
  npm run benchmark:color-ramps --workspace @wordpress/theme -- [options]

Options:
  --source-root <path>     Checkout to benchmark (default: current checkout)
  --label <text>           Label for the candidate result
  --baseline-root <path>   Checkout to benchmark as the baseline
  --baseline-label <text>  Label for the baseline result
  --json                   Print machine-readable output
  --help, -h               Show this help

When --baseline-root is set, each checkout runs in a separate Node.js process
before the script reports the percentage difference.`;

async function loadRampModule( sourceRoot: string ): Promise< RampModule > {
	// Historical revisions relied on the full Color.js entry point to register
	// these spaces. Register them here so the same benchmark can execute both
	// sides without changing the measured ramp calls.
	const { ColorSpace, OKLab, OKLCH, sRGB } = await import( 'colorjs.io/fn' );
	ColorSpace.register( sRGB );
	ColorSpace.register( OKLab );
	ColorSpace.register( OKLCH );

	const modulePath = resolve(
		sourceRoot,
		'packages/theme/src/color-ramps/index.ts'
	);
	return import( pathToFileURL( modulePath ).href ) as Promise< RampModule >;
}

function createCases( rampModule: RampModule ): BenchmarkCase[] {
	const { buildAccentRamp, buildBgRamp, DEFAULT_SEED_COLORS } = rampModule;
	const accentBackgroundRamps = FIXTURES.map( ( fixture ) =>
		buildBgRamp( fixture.background )
	);
	let backgroundIndex = 0;
	let accentIndex = 0;
	let themeIndex = 0;

	return [
		{
			name: 'background-ramp',
			iterationsPerSample: 20,
			run: () => {
				const fixture = FIXTURES[ backgroundIndex++ % FIXTURES.length ];
				return buildBgRamp( fixture.background );
			},
		},
		{
			name: 'accent-ramp',
			iterationsPerSample: 20,
			run: () => {
				const fixtureIndex = accentIndex++ % FIXTURES.length;
				return buildAccentRamp(
					FIXTURES[ fixtureIndex ].primary,
					accentBackgroundRamps[ fixtureIndex ],
					'interactive'
				);
			},
		},
		{
			name: 'theme-color-ramps',
			iterationsPerSample: 5,
			run: () => {
				const fixture = FIXTURES[ themeIndex++ % FIXTURES.length ];
				const backgroundRamp = buildBgRamp( fixture.background );
				const accentSeeds = {
					primary: fixture.primary,
					info: DEFAULT_SEED_COLORS.info,
					success: DEFAULT_SEED_COLORS.success,
					caution: DEFAULT_SEED_COLORS.caution,
					warning: DEFAULT_SEED_COLORS.warning,
					error: DEFAULT_SEED_COLORS.error,
				};
				const result: RampOutput[] = [ backgroundRamp ];

				for ( const [ role, seed ] of Object.entries( accentSeeds ) ) {
					result.push(
						buildAccentRamp(
							seed,
							backgroundRamp,
							role === 'primary' || role === 'error'
								? 'interactive'
								: 'status'
						)
					);
				}
				return result;
			},
		},
	];
}

function updateChecksum( checksum: number, output: RampOutput | RampOutput[] ) {
	const ramps = Array.isArray( output ) ? output : [ output ];
	for ( const { ramp } of ramps ) {
		for ( const color of Object.values( ramp ) ) {
			for ( const character of color ) {
				checksum =
					( checksum * 31 + ( character.codePointAt( 0 ) ?? 0 ) ) %
					2_147_483_647;
			}
		}
	}
	return checksum;
}

function measure( benchmarkCase: BenchmarkCase ): BenchmarkResult {
	let checksum = 0;
	const runSample = () => {
		let result: RampOutput | RampOutput[] | undefined;
		const start = performance.now();
		for (
			let iteration = 0;
			iteration < benchmarkCase.iterationsPerSample;
			iteration++
		) {
			result = benchmarkCase.run();
		}
		const duration = performance.now() - start;

		if ( result ) {
			checksum = updateChecksum( checksum, result );
		}
		return duration / benchmarkCase.iterationsPerSample;
	};

	for ( let sample = 0; sample < WARMUP_SAMPLES; sample++ ) {
		runSample();
	}

	const samples = Array.from( { length: MEASURED_SAMPLES }, runSample ).sort(
		( a, b ) => a - b
	);
	const middle = Math.floor( samples.length / 2 );
	const medianMs =
		samples.length % 2 === 0
			? ( samples[ middle - 1 ] + samples[ middle ] ) / 2
			: samples[ middle ];

	return {
		name: benchmarkCase.name,
		iterationsPerSample: benchmarkCase.iterationsPerSample,
		medianMs,
		p95Ms: samples[ Math.ceil( samples.length * 0.95 ) - 1 ],
		checksum,
	};
}

async function runBenchmark(
	sourceRoot: string,
	label: string
): Promise< BenchmarkReport > {
	const rampModule = await loadRampModule( sourceRoot );
	return {
		label,
		environment: {
			node: process.version,
			platform: process.platform,
			arch: process.arch,
		},
		warmupSamples: WARMUP_SAMPLES,
		measuredSamples: MEASURED_SAMPLES,
		fixtures: FIXTURES,
		results: createCases( rampModule ).map( measure ),
	};
}

function runIsolated( sourceRoot: string, label: string ) {
	const result = spawnSync(
		process.execPath,
		[
			...process.execArgv,
			SCRIPT_PATH,
			'--source-root',
			sourceRoot,
			'--label',
			label,
			'--json',
		],
		{ encoding: 'utf8' }
	);

	if ( result.error ) {
		throw result.error;
	}
	if ( result.status !== 0 ) {
		throw new Error(
			`Benchmark failed for ${ label }:\n${ result.stderr }`
		);
	}
	return JSON.parse( result.stdout ) as BenchmarkReport;
}

function compare( baseline: BenchmarkReport, candidate: BenchmarkReport ) {
	return candidate.results.map( ( candidateResult ) => {
		const baselineResult = baseline.results.find(
			( result ) => result.name === candidateResult.name
		);
		if ( ! baselineResult ) {
			throw new Error(
				`Baseline result is missing ${ candidateResult.name }.`
			);
		}
		return {
			name: candidateResult.name,
			baselineMedianMs: baselineResult.medianMs,
			candidateMedianMs: candidateResult.medianMs,
			medianDeltaPercent:
				( candidateResult.medianMs / baselineResult.medianMs - 1 ) *
				100,
			baselineP95Ms: baselineResult.p95Ms,
			candidateP95Ms: candidateResult.p95Ms,
		};
	} );
}

function printContext( report: BenchmarkReport ) {
	console.log(
		`${ report.environment.node } ${ report.environment.platform }/${ report.environment.arch }; ${ report.measuredSamples } samples after ${ report.warmupSamples } warmups`
	);
	console.log(
		`fixtures: ${ report.fixtures
			.map( ( { name } ) => name )
			.join( ', ' ) }`
	);
}

function printReport( report: BenchmarkReport ) {
	console.log( `Theme color ramp benchmark: ${ report.label }` );
	printContext( report );
	console.table(
		report.results.map( ( result ) => ( {
			case: result.name,
			'median ms/op': result.medianMs.toFixed( 3 ),
			'p95 ms/op': result.p95Ms.toFixed( 3 ),
		} ) )
	);
}

function printComparison(
	baseline: BenchmarkReport,
	candidate: BenchmarkReport,
	comparison: ReturnType< typeof compare >
) {
	console.log(
		`Theme color ramp benchmark: ${ baseline.label } vs ${ candidate.label }`
	);
	printContext( candidate );
	console.table(
		comparison.map( ( result ) => ( {
			case: result.name,
			[ `${ baseline.label } median` ]:
				result.baselineMedianMs.toFixed( 3 ),
			[ `${ candidate.label } median` ]:
				result.candidateMedianMs.toFixed( 3 ),
			delta: `${
				result.medianDeltaPercent >= 0 ? '+' : ''
			}${ result.medianDeltaPercent.toFixed( 1 ) }%`,
			[ `${ baseline.label } p95` ]: result.baselineP95Ms.toFixed( 3 ),
			[ `${ candidate.label } p95` ]: result.candidateP95Ms.toFixed( 3 ),
		} ) )
	);
}

async function main() {
	const { values } = parseArgs( {
		options: {
			'source-root': { type: 'string' },
			label: { type: 'string' },
			'baseline-root': { type: 'string' },
			'baseline-label': { type: 'string' },
			json: { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
		},
	} );

	if ( values.help ) {
		console.log( HELP );
		return;
	}

	const sourceRoot = resolve(
		values[ 'source-root' ] ?? DEFAULT_SOURCE_ROOT
	);
	const label = values.label ?? 'candidate';
	if ( values[ 'baseline-root' ] ) {
		const baseline = runIsolated(
			resolve( values[ 'baseline-root' ] ),
			values[ 'baseline-label' ] ?? 'baseline'
		);
		const candidate = runIsolated( sourceRoot, label );
		const comparison = compare( baseline, candidate );
		if ( values.json ) {
			console.log(
				JSON.stringify( { baseline, candidate, comparison }, null, 2 )
			);
		} else {
			printComparison( baseline, candidate, comparison );
		}
		return;
	}

	const report = await runBenchmark( sourceRoot, label );
	if ( values.json ) {
		console.log( JSON.stringify( report, null, 2 ) );
	} else {
		printReport( report );
	}
}

main().catch( ( error ) => {
	console.error( error instanceof Error ? error.message : error );
	process.exitCode = 1;
} );
/* eslint-enable no-console */
