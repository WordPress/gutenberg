#!/usr/bin/env node
/**
 * Smart crop review harness.
 *
 * Pulls a fresh mix of public images, crops each one twice with the same
 * libvips build the browser upload path uses -- from the centre, which is what
 * WordPress does today, and with the `attention` strategy -- and writes a
 * self-contained HTML report where a reviewer grades whether smart crop is an
 * improvement.
 *
 * Usage:
 *
 *     node tools/smart-crop-corpus/index.mjs
 *     node tools/smart-crop-corpus/index.mjs --count 40 --sizes thumbnail,square,wide
 *     node tools/smart-crop-corpus/index.mjs --seed my-run   # reproducible
 *
 * See tools/smart-crop-corpus/README.md.
 * See https://github.com/WordPress/gutenberg/issues/81706.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
	aspectStability,
	createVips,
	cropPair,
	probeSubject,
} from './crop.mjs';
import {
	buildCorpus,
	download,
	hasUsableShape,
	SHAPE,
	SOURCES,
} from './sources.mjs';
import { renderReport } from './report.mjs';

/**
 * Target sizes.
 *
 * `thumbnail` is the one size WordPress core registers with `'crop' => true`,
 * so it is the size this proposal actually changes. At 150px it is hard to
 * grade by eye, so `focus` is the default: the same square shape at 250px,
 * large enough to see and small enough that a 1024px source is being reduced to
 * a quarter of its width. The larger shapes are opt-in via `--sizes`.
 */
const SIZES = {
	thumbnail: { name: 'thumbnail', width: 150, height: 150 },
	focus: { name: 'focus', width: 250, height: 250 },
	square: { name: 'square', width: 400, height: 400 },
	wide: { name: 'wide', width: 640, height: 360 },
	tall: { name: 'tall', width: 480, height: 640 },
};

/**
 * How many extra images to collect per image actually wanted.
 *
 * Theme screenshots and dataset entries do not publish dimensions, so whether
 * they clear the shape gate is only knowable after downloading them. Selecting
 * for an off-centre subject needs a surplus on top of that: a run can only pick
 * the most off-centre hundred out of a pool bigger than a hundred.
 */
const OVER_COLLECT = 2.5;

/**
 * Sources a run draws from unless told otherwise.
 *
 * `themes` is left out. Theme screenshots are 1200x900 by convention, so the
 * default shape gate rejects effectively all of them, and including them would
 * spend a run's downloads on images that never get graded. Ask for them
 * explicitly alongside a lower `--min-aspect`.
 */
const DEFAULT_SOURCES = [ 'photos', 'plugins', 'cropping' ];

/**
 * Picks the candidates whose subject sits furthest from the centre.
 *
 * The two measures are in different units, so they are combined by rank rather
 * than by arithmetic: an image's score is its position in the focal-offset
 * order plus its position in the entropy-shift order. What comes out on top is
 * what scores well on both, rather than what scores spectacularly on one.
 *
 * `detailSpread` is deliberately not part of this. It answers whether there is
 * a subject at all, which is a floor applied earlier; ranking on it as well
 * pulls in images with a strong but perfectly central subject, which is the
 * case this selection exists to avoid.
 *
 * @param {Array}  candidates Probed candidates.
 * @param {number} count      How many to keep.
 * @return {Array} The best `count`, in rank order.
 */
function selectOffCentre( candidates, count ) {
	const rank = ( key ) => {
		const order = [ ...candidates ].sort(
			( a, b ) => b.probe[ key ] - a.probe[ key ]
		);

		return new Map( order.map( ( item, index ) => [ item, index ] ) );
	};

	const orders = [ 'focalOffset', 'entropyShift' ].map( rank );
	const score = ( item ) =>
		orders.reduce( ( sum, order ) => sum + order.get( item ), 0 );

	return [ ...candidates ]
		.sort( ( a, b ) => score( a ) - score( b ) )
		.slice( 0, count );
}

/**
 * Mean share of the source that survives the crop, across every comparison.
 *
 * @param {Array} rows Comparison rows.
 * @return {number} 0..1.
 */
function meanCoverage( rows ) {
	return (
		rows.reduce( ( total, row ) => total + row.result.coverage, 0 ) /
		rows.length
	);
}

/**
 * Formats a 0..1 share as a percentage.
 *
 * @param {number} value Share.
 * @return {string} Formatted percentage.
 */
function percent( value ) {
	return `${ Math.round( value * 100 ) }%`;
}

const DEFAULTS = {
	count: 20,
	sizes: 'focus',
	sources: DEFAULT_SOURCES.join( ',' ),
	out: 'artifacts/smart-crop',
	quality: 82,
	concurrency: 6,
	'min-long-edge': SHAPE.minLongEdge,
	'min-short-edge': SHAPE.minShortEdge,
	'min-aspect': SHAPE.minAspect,
	select: 'off-centre',
	'min-detail-spread': 0.2,
};

/**
 * Parses `--flag value` arguments.
 *
 * @param {string[]} argv Raw arguments.
 * @return {Object} Options merged over the defaults.
 */
function parseArgs( argv ) {
	const options = { ...DEFAULTS };

	for ( let index = 0; index < argv.length; index += 1 ) {
		const arg = argv[ index ];

		if ( ! arg.startsWith( '--' ) ) {
			continue;
		}

		const key = arg.slice( 2 );
		const value = argv[ index + 1 ];

		if ( key === 'help' ) {
			options.help = true;
		} else if ( key in options && value !== undefined ) {
			options[ key ] =
				typeof options[ key ] === 'number' ? Number( value ) : value;
			index += 1;
		} else if ( key === 'seed' && value !== undefined ) {
			options.seed = value;
			index += 1;
		} else {
			throw new Error( `Unknown option: ${ arg }` );
		}
	}

	return options;
}

/**
 * A small seeded generator, so a run can be reproduced from its seed.
 *
 * @param {string} seed Seed string.
 * @return {Function} Generator returning 0..1.
 */
/* eslint-disable no-bitwise -- xmur3/mulberry32 is defined in terms of 32-bit integer operations. */
function createRng( seed ) {
	let hash = 1779033703 ^ seed.length;

	for ( let index = 0; index < seed.length; index += 1 ) {
		hash = Math.imul( hash ^ seed.charCodeAt( index ), 3432918353 );
		hash = ( hash << 13 ) | ( hash >>> 19 );
	}

	return function rng() {
		hash = ( hash + 0x6d2b79f5 ) | 0;
		let t = Math.imul( hash ^ ( hash >>> 15 ), 1 | hash );
		t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
		return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
	};
}
/* eslint-enable no-bitwise */

/**
 * Runs an async worker over a list with a concurrency cap, so the harness is a
 * polite client of wordpress.org.
 *
 * @param {Array}    items  Items to process.
 * @param {number}   limit  Maximum in flight.
 * @param {Function} worker Async worker receiving `( item, index )`.
 * @return {Promise<Array>} Settled results, in input order.
 */
async function mapLimit( items, limit, worker ) {
	const results = new Array( items.length );
	let cursor = 0;

	async function drain() {
		while ( cursor < items.length ) {
			const index = cursor++;
			try {
				results[ index ] = await worker( items[ index ], index );
			} catch ( error ) {
				results[ index ] = { error };
			}
		}
	}

	await Promise.all(
		Array.from( { length: Math.min( limit, items.length ) }, drain )
	);

	return results;
}

const log = ( message ) => process.stdout.write( `${ message }\n` );

/**
 * Entry point.
 */
async function main() {
	const options = parseArgs( process.argv.slice( 2 ) );

	if ( options.help ) {
		log(
			[
				'Smart crop review harness',
				'',
				'  --count N        images to collect (default 20)',
				`  --sizes LIST     any of ${ Object.keys( SIZES ).join(
					', '
				) } (default ${ DEFAULTS.sizes })`,
				`  --sources LIST   any of ${ Object.keys( SOURCES ).join(
					', '
				) } (default ${ DEFAULT_SOURCES.join( ',' ) })`,
				'  --seed STRING    reproduce a previous run (default: random)',
				'  --out DIR        output directory (default artifacts/smart-crop)',
				'  --quality N      JPEG quality for review renditions (default 82)',
				'',
				'Only images large enough and far enough from square are graded:',
				`  --min-long-edge N   long edge floor (default ${ SHAPE.minLongEdge })`,
				`  --min-short-edge N  short edge floor (default ${ SHAPE.minShortEdge })`,
				`  --min-aspect N      long/short ratio floor (default ${ SHAPE.minAspect })`,
				'',
				'  --select MODE    off-centre (default) keeps the images where the',
				'                   subject is furthest from the middle; random keeps',
				'                   whatever the sources happened to return',
				'  --min-detail-spread N  how unevenly detail has to be spread before',
				'                   an image counts as having a subject (default 0.2)',
			].join( '\n' )
		);
		return;
	}

	// A random seed by default, so every run grades a different set of images.
	const seed = options.seed || Math.random().toString( 36 ).slice( 2, 10 );
	const rng = createRng( seed );

	const sizes = String( options.sizes )
		.split( ',' )
		.map( ( key ) => SIZES[ key.trim() ] )
		.filter( Boolean );

	if ( ! sizes.length ) {
		throw new Error(
			`No valid sizes. Choose from: ${ Object.keys( SIZES ).join(
				', '
			) }`
		);
	}

	const runId = `${ new Date().toISOString().slice( 0, 10 ) }-${ seed }`;
	const outDir = path.resolve( options.out, runId );
	const imageDir = path.join( outDir, 'images' );
	await mkdir( imageDir, { recursive: true } );

	log( `Smart crop review run ${ runId }` );
	log( `Seed ${ seed } — pass --seed ${ seed } to reproduce this set.\n` );

	const shape = {
		minLongEdge: Number( options[ 'min-long-edge' ] ),
		minShortEdge: Number( options[ 'min-short-edge' ] ),
		minAspect: Number( options[ 'min-aspect' ] ),
	};

	const minDetailSpread = Number( options[ 'min-detail-spread' ] );

	log(
		`Grading images at least ${ shape.minLongEdge }x${ shape.minShortEdge } ` +
			`and at least ${ shape.minAspect }:1.\n`
	);

	// Most sources do not publish dimensions, so their entries can only be
	// measured once decoded. Over-collecting covers the ones that get rejected;
	// the run stops as soon as it has `count` usable images.
	const corpus = await buildCorpus( {
		count: Math.ceil( options.count * OVER_COLLECT ),
		sources: String( options.sources )
			.split( ',' )
			.map( ( key ) => key.trim() ),
		shape,
		rng,
		onLog: log,
	} );

	if ( ! corpus.length ) {
		throw new Error( 'Collected no images. Is the network reachable?' );
	}

	log( `\nDownloading ${ corpus.length } images…` );

	const downloaded = await mapLimit(
		corpus,
		options.concurrency,
		async ( entry ) => ( {
			entry,
			buffer: await download( entry.url, entry.fallbackUrl ),
		} )
	);

	const vips = await createVips();
	const vipsVersion = [ 0, 1, 2 ]
		.map( ( part ) => vips.version( part ) )
		.join( '.' );

	log( `Cropping with libvips ${ vipsVersion }…\n` );

	const rows = [];
	const stats = {
		bySource: {},
		unchanged: 0,
		imageCount: 0,
		skipped: 0,
		wrongShape: 0,
		noSubject: 0,
		candidates: 0,
	};

	// First pass: measure every candidate and throw away the pixels. Nothing is
	// cropped yet, because which images are worth cropping depends on how the
	// whole pool scored.
	const candidates = [];

	for ( const item of downloaded ) {
		if ( item.error || ! item.buffer ) {
			log( `  ! download failed: ${ item.error?.message || 'no data' }` );
			stats.skipped += 1;
			continue;
		}

		const { entry, buffer } = item;
		let source;

		try {
			// The decoded image is freed straight away; only the sRGB copy is
			// kept, and the wasm heap does not reclaim anything on its own.
			const decoded = vips.Image.newFromBuffer( buffer );
			source = decoded.colourspace( 'srgb' );
			decoded.delete();
		} catch {
			log( `  ! could not decode ${ entry.id }` );
			stats.skipped += 1;
			continue;
		}

		try {
			// Dimensions the source published can be wrong or absent, so the
			// gate is applied again to what actually decoded.
			if ( ! hasUsableShape( source.width, source.height, shape ) ) {
				stats.wrongShape += 1;
				continue;
			}

			const probe = probeSubject( {
				vips,
				source,
				buffer,
				size: sizes[ 0 ],
			} );

			if ( ! probe ) {
				continue;
			}

			// Evenly detailed all over: a texture, not a photograph of
			// something. Attention will still name a focal point and it will
			// still be off centre, but there is nothing there for a crop to
			// cut off, so grading it teaches nothing.
			if ( probe.detailSpread < minDetailSpread ) {
				stats.noSubject += 1;
				continue;
			}

			candidates.push( { entry, buffer, probe } );
		} finally {
			source.delete();
		}
	}

	stats.candidates = candidates.length;

	const chosen =
		options.select === 'off-centre'
			? selectOffCentre( candidates, options.count )
			: candidates.slice( 0, options.count );

	log(
		`Probed ${ candidates.length } candidates; ${ stats.wrongShape } rejected ` +
			`for size or shape, ${ stats.noSubject } for having no subject.`
	);
	log(
		options.select === 'off-centre'
			? `Grading the ${ chosen.length } with the most off-centre subject.\n`
			: `Grading ${ chosen.length } of them.\n`
	);

	// Second pass: crop the ones that made the cut.
	for ( const candidate of chosen ) {
		const { entry, buffer, probe } = candidate;
		let source;

		try {
			const decoded = vips.Image.newFromBuffer( buffer );
			source = decoded.colourspace( 'srgb' );
			decoded.delete();
		} catch {
			stats.skipped += 1;
			continue;
		}

		try {
			const results = sizes
				.map( ( size ) =>
					cropPair( {
						vips,
						source,
						buffer,
						size,
						quality: options.quality,
					} )
				)
				.filter( Boolean );

			if ( ! results.length ) {
				log( `  - ${ entry.id } is smaller than every target size` );
				stats.skipped += 1;
				continue;
			}

			// A small preview of the uncropped original, so a reviewer can see
			// what the crops were taken from.
			const previewImage = vips.Image.thumbnailBuffer( buffer, 220, {
				size: 'down',
			} );
			const preview = Buffer.from(
				previewImage.writeToBuffer( '.jpg', { Q: 70 } )
			);
			previewImage.delete();

			const image = {
				...entry,
				preview,
				width: entry.width || source.width,
				height: entry.height || source.height,
			};
			const stability = aspectStability( results );

			await writeFile(
				path.join( imageDir, `${ entry.id }-source.jpg` ),
				preview
			);

			for ( const result of results ) {
				const rowId = `${ entry.id }-${ result.size }`;
				const files = {
					centre: `images/${ rowId }-centre.jpg`,
					attention: `images/${ rowId }-attention.jpg`,
					source: `images/${ entry.id }-source.jpg`,
				};

				await writeFile(
					path.join( outDir, files.centre ),
					result.renditions.centre
				);
				await writeFile(
					path.join( outDir, files.attention ),
					result.renditions.attention
				);

				rows.push( {
					id: rowId,
					image,
					result,
					files,
					aspectStability: stability,
					probe,
				} );

				if ( result.unchanged ) {
					stats.unchanged += 1;
				}
			}

			stats.imageCount += 1;
			stats.bySource[ entry.source ] =
				( stats.bySource[ entry.source ] || 0 ) + 1;
		} finally {
			source.delete();
		}
	}

	if ( ! rows.length ) {
		throw new Error( 'No comparisons were produced.' );
	}

	const run = {
		id: runId,
		seed,
		createdAt: new Date().toISOString(),
		vipsVersion,
		shape,
		sizes: sizes.map( ( size ) => size.name ),
		rows,
		stats,
	};

	const reportPath = path.join( outDir, 'report.html' );
	await writeFile( reportPath, renderReport( run ) );
	await writeFile(
		path.join( outDir, 'manifest.json' ),
		JSON.stringify(
			{
				...run,
				rows: rows.map( ( row ) => ( {
					id: row.id,
					image: { ...row.image, preview: undefined },
					size: row.result.size,
					coverage: row.result.coverage,
					signals: row.result.signals,
					aspectStability: row.aspectStability,
					probe: row.probe,
					unchanged: row.result.unchanged,
					files: row.files,
				} ) ),
			},
			null,
			2
		)
	);

	log( `${ rows.length } comparisons from ${ stats.imageCount } images` );
	log(
		`${ stats.unchanged } produced no visible change; ${ stats.skipped } images skipped`
	);
	log(
		`Chosen from ${ stats.candidates } candidates; crops keep ${ percent(
			meanCoverage( rows )
		) } of the source on average`
	);
	log( `\nReport:   ${ reportPath }` );
	log( `Manifest: ${ path.join( outDir, 'manifest.json' ) }` );
}

main().catch( ( error ) => {
	process.stderr.write( `\n${ error.stack || error.message }\n` );
	process.exitCode = 1;
} );
