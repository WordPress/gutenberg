/* eslint-disable no-console -- This command writes benchmark output. */
import { performance } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import {
	EXPERIMENTAL_RAMP_METHODS,
	buildExperimentalThemeRamps,
	type ExperimentalRampMethod,
} from '../src/color-ramps/stories/perceptual-ramp-experiment';

type BenchmarkResult = {
	method: ExperimentalRampMethod;
	medianMs: number;
	p95Ms: number;
	checksum: number;
};

const WARMUP_SAMPLES = 8;
const MEASURED_SAMPLES = 30;
const FIXTURES = [
	{
		background: '#fcfcfc',
		primary: '#3858e9',
	},
	{
		background: '#1e1e1e',
		primary: '#3858e9',
	},
	{
		background: '#4f386e',
		primary: '#608010',
	},
	{
		background: '#777777',
		primary: '#d63638',
	},
	{
		background: '#fcfcfc',
		primary: '#ffd700',
	},
	{
		background: '#1e1e1e',
		primary: '#00ffff',
	},
] as const;

const { values } = parseArgs( {
	options: {
		json: { type: 'boolean', default: false },
	},
	strict: true,
} );

function updateChecksum( checksum: number, value: string ) {
	for ( const character of value ) {
		checksum =
			( checksum * 31 + ( character.codePointAt( 0 ) ?? 0 ) ) %
			2_147_483_647;
	}
	return checksum;
}

function runMethod( method: ExperimentalRampMethod ) {
	let checksum = 0;
	const runSample = () => {
		const start = performance.now();
		for ( const fixture of FIXTURES ) {
			const ramps = buildExperimentalThemeRamps( { method, ...fixture } );
			checksum = updateChecksum(
				checksum,
				`${ ramps.background.ramp.fgSurface5 }${ ramps.primary.ramp.bgFill2 }${ ramps.error.ramp.stroke3 }`
			);
		}
		return ( performance.now() - start ) / FIXTURES.length;
	};

	for ( let sample = 0; sample < WARMUP_SAMPLES; sample++ ) {
		runSample();
	}

	const samples = Array.from( { length: MEASURED_SAMPLES }, runSample ).sort(
		( first, second ) => first - second
	);
	const middle = Math.floor( samples.length / 2 );
	const medianMs =
		samples.length % 2 === 0
			? ( samples[ middle - 1 ] + samples[ middle ] ) / 2
			: samples[ middle ];

	return {
		method,
		medianMs,
		p95Ms: samples[ Math.ceil( samples.length * 0.95 ) - 1 ],
		checksum,
	} satisfies BenchmarkResult;
}

const results = EXPERIMENTAL_RAMP_METHODS.map( runMethod );
const report = {
	environment: {
		node: process.version,
		platform: process.platform,
		arch: process.arch,
	},
	warmupSamples: WARMUP_SAMPLES,
	measuredSamples: MEASURED_SAMPLES,
	fixtures: FIXTURES,
	results,
};

if ( values.json ) {
	console.log( JSON.stringify( report, null, 2 ) );
} else {
	console.log( 'Perceptual ramp experiment benchmark' );
	console.log(
		`${ report.environment.node } ${ report.environment.platform }/${ report.environment.arch }; ${ MEASURED_SAMPLES } samples after ${ WARMUP_SAMPLES } warmups`
	);
	console.log( `${ FIXTURES.length } ramp triplets per sample` );
	console.table(
		results.map( ( result ) => ( {
			method: result.method,
			'median ms/ramp triplet': result.medianMs.toFixed( 3 ),
			'p95 ms/ramp triplet': result.p95Ms.toFixed( 3 ),
		} ) )
	);
}
/* eslint-enable no-console */
