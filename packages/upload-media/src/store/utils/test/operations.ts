import { describe, expect, it, vi } from 'vitest';
import {
	applyOperationPlacement,
	getConcurrencyPool,
	getDeclaredConcurrencyLimit,
	getOperationArgs,
	getOperationName,
	planOperations,
} from '../operations';
import {
	OperationType,
	type Operation,
	type OperationDefinition,
	type QueueItem,
	type Settings,
} from '../../types';

const settings = {
	mediaUpload: vi.fn(),
	maxConcurrentUploads: 5,
	maxConcurrentImageProcessing: 2,
} as Settings;

const item = {
	id: 'item-1',
	file: new File( [ 'foo' ], 'video.mp4', { type: 'video/mp4' } ),
} as QueueItem;

function operation(
	name: string,
	overrides: Partial< OperationDefinition > = {}
): OperationDefinition {
	return {
		name,
		label: name,
		handler: () => {},
		...overrides,
	};
}

describe( 'getOperationName', () => {
	it( 'returns the name of a bare operation and of one carrying args', () => {
		expect( getOperationName( OperationType.Upload ) ).toBe(
			OperationType.Upload
		);
		expect(
			getOperationName( [ OperationType.Rotate, { orientation: 6 } ] )
		).toBe( OperationType.Rotate );
	} );
} );

describe( 'getOperationArgs', () => {
	it( 'returns the args of an operation carrying them and undefined otherwise', () => {
		expect( getOperationArgs( OperationType.Upload ) ).toBeUndefined();
		expect(
			getOperationArgs( [ OperationType.Rotate, { orientation: 6 } ] )
		).toEqual( { orientation: 6 } );
	} );
} );

describe( 'getConcurrencyPool', () => {
	it( 'reads the pool from both concurrency forms', () => {
		expect( getConcurrencyPool( undefined ) ).toBeUndefined();
		expect( getConcurrencyPool( operation( 'a/b' ) ) ).toBeUndefined();
		expect(
			getConcurrencyPool( operation( 'a/b', { concurrency: 'image' } ) )
		).toBe( 'image' );
		expect(
			getConcurrencyPool(
				operation( 'a/b', { concurrency: { pool: 'ocr', limit: 2 } } )
			)
		).toBe( 'ocr' );
	} );
} );

describe( 'getDeclaredConcurrencyLimit', () => {
	it( 'returns undefined for operations that only join a pool', () => {
		expect(
			getDeclaredConcurrencyLimit(
				operation( 'a/b', { concurrency: 'image' } ),
				settings
			)
		).toBeUndefined();
	} );

	it( 'returns a fixed limit as is and resolves one derived from settings', () => {
		expect(
			getDeclaredConcurrencyLimit(
				operation( 'a/b', { concurrency: { pool: 'ocr', limit: 2 } } ),
				settings
			)
		).toBe( 2 );
		expect(
			getDeclaredConcurrencyLimit(
				operation( 'a/b', {
					concurrency: {
						pool: 'upload',
						limit: ( s ) => s.maxConcurrentUploads,
					},
				} ),
				settings
			)
		).toBe( 5 );
	} );
} );

describe( 'applyOperationPlacement', () => {
	const pipeline = [
		OperationType.Upload,
		OperationType.ThumbnailGeneration,
		OperationType.Finalize,
	];

	it( 'inserts before an anchor', () => {
		expect(
			applyOperationPlacement( pipeline, 'a/check', {
				before: OperationType.Upload,
			} )
		).toEqual( [ 'a/check', ...pipeline ] );
	} );

	it( 'inserts after an anchor', () => {
		expect(
			applyOperationPlacement( pipeline, 'a/subtitles', {
				after: OperationType.Upload,
			} )
		).toEqual( [
			OperationType.Upload,
			'a/subtitles',
			OperationType.ThumbnailGeneration,
			OperationType.Finalize,
		] );
	} );

	it( 'inserts at the start and at the end', () => {
		expect(
			applyOperationPlacement( pipeline, 'a/first', { at: 'start' } )
		).toEqual( [ 'a/first', ...pipeline ] );
		expect(
			applyOperationPlacement( pipeline, 'a/last', { at: 'end' } )
		).toEqual( [ ...pipeline, 'a/last' ] );
	} );

	it( 'appends when no position is given', () => {
		expect( applyOperationPlacement( pipeline, 'a/last', {} ) ).toEqual( [
			...pipeline,
			'a/last',
		] );
	} );

	it( 'carries the args as a tuple', () => {
		expect(
			applyOperationPlacement( pipeline, 'a/subtitles', {
				after: OperationType.Upload,
				args: { language: 'en' },
			} )[ 1 ]
		).toEqual( [ 'a/subtitles', { language: 'en' } ] );
	} );

	it( 'leaves the pipeline alone when the anchor is missing', () => {
		expect(
			applyOperationPlacement( pipeline, 'a/subtitles', {
				after: OperationType.TranscodeGif,
			} )
		).toBe( pipeline );
	} );

	it( 'matches an anchor that carries args', () => {
		const rotate: Operation = [ OperationType.Rotate, { orientation: 6 } ];
		expect(
			applyOperationPlacement(
				[ rotate, OperationType.Upload ],
				'a/after-rotate',
				{ after: OperationType.Rotate }
			)
		).toEqual( [ rotate, 'a/after-rotate', OperationType.Upload ] );
	} );
} );

describe( 'planOperations', () => {
	const base = [ OperationType.Upload, OperationType.Finalize ];

	it( 'returns the pipeline unchanged when no operation plans', async () => {
		const planned = await planOperations(
			item,
			base,
			[ operation( 'a/b' ) ],
			settings
		);
		expect( planned ).toEqual( base );
	} );

	it( 'skips operations whose plan returns nothing or false', async () => {
		const planned = await planOperations(
			item,
			base,
			[
				operation( 'a/nothing', { plan: () => undefined } ),
				operation( 'a/false', { plan: () => false } ),
			],
			settings
		);
		expect( planned ).toEqual( base );
	} );

	it( 'applies a placement returned by a plan', async () => {
		const planned = await planOperations(
			item,
			base,
			[
				operation( 'a/subtitles', {
					plan: () => ( { after: OperationType.Upload } ),
				} ),
			],
			settings
		);
		expect( planned ).toEqual( [
			OperationType.Upload,
			'a/subtitles',
			OperationType.Finalize,
		] );
	} );

	it( 'replaces the pipeline with an array returned by a plan', async () => {
		const planned = await planOperations(
			item,
			base,
			[
				operation( 'a/only', {
					plan: () => [ 'a/only', OperationType.Upload ],
				} ),
			],
			settings
		);
		expect( planned ).toEqual( [ 'a/only', OperationType.Upload ] );
	} );

	it( 'runs plans by priority, then registration order', async () => {
		const order: string[] = [];
		const track = ( name: string ) => () => {
			order.push( name );
			return { at: 'end' } as const;
		};
		const planned = await planOperations(
			item,
			base,
			[
				operation( 'a/late', {
					priority: 20,
					plan: track( 'a/late' ),
				} ),
				operation( 'a/default', { plan: track( 'a/default' ) } ),
				operation( 'a/early', {
					priority: 5,
					plan: track( 'a/early' ),
				} ),
				operation( 'a/also-default', {
					plan: track( 'a/also-default' ),
				} ),
			],
			settings
		);
		expect( order ).toEqual( [
			'a/early',
			'a/default',
			'a/also-default',
			'a/late',
		] );
		expect( planned ).toEqual( [ ...base, ...order ] );
	} );

	it( 'gives each plan the pipeline as left by the plans before it', async () => {
		const seen: unknown[] = [];
		await planOperations(
			item,
			base,
			[
				operation( 'a/first', {
					priority: 1,
					plan: () => ( { at: 'start' } ),
				} ),
				operation( 'a/second', {
					plan: ( _item, { operations } ) => {
						seen.push( operations );
					},
				} ),
			],
			settings
		);
		expect( seen ).toEqual( [ [ 'a/first', ...base ] ] );
	} );

	it( 'passes the item and settings to plans and awaits async ones', async () => {
		const plan = vi.fn( async () => ( { at: 'end' } ) as const );
		await planOperations(
			item,
			base,
			[ operation( 'a/async', { plan } ) ],
			settings
		);
		expect( plan ).toHaveBeenCalledWith( item, {
			operations: base,
			settings,
		} );
	} );
} );
