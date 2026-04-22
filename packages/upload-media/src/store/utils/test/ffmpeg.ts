/**
 * External dependencies
 */

import * as ffmpegWorker from '@wordpress/ffmpeg/worker';

/**
 * Internal dependencies
 */
import {
	ffmpegCancelOperations,
	ffmpegConvertGifToVideo,
	terminateFFmpegWorker,
} from '../ffmpeg';

const mockedWorker = ffmpegWorker as unknown as {
	ffmpegConvertGifToVideo: jest.Mock;
	ffmpegCancelOperations: jest.Mock;
	terminateFFmpegWorker: jest.Mock;
};

describe( 'ffmpeg wrapper', () => {
	beforeEach( () => {
		mockedWorker.ffmpegConvertGifToVideo.mockReset();
		mockedWorker.ffmpegCancelOperations.mockReset();
		mockedWorker.terminateFFmpegWorker.mockReset();
	} );

	describe( 'ffmpegConvertGifToVideo', () => {
		it( 'produces an .mp4 File when the output mime type is video/mp4', async () => {
			const outputBuffer = new Uint8Array( [ 1, 2, 3, 4 ] ).buffer;
			mockedWorker.ffmpegConvertGifToVideo.mockResolvedValue(
				outputBuffer
			);

			const input = new File( [ new Uint8Array( [ 0, 1 ] ) ], 'cat.gif', {
				type: 'image/gif',
			} );

			const result = await ffmpegConvertGifToVideo(
				'queue-1',
				input,
				'video/mp4'
			);

			expect( result ).toBeInstanceOf( File );
			expect( result.name ).toBe( 'cat.mp4' );
			expect( result.type ).toBe( 'video/mp4' );
			expect( result.size ).toBe( 4 );
		} );

		it( 'produces a .webm File when the output mime type is video/webm', async () => {
			mockedWorker.ffmpegConvertGifToVideo.mockResolvedValue(
				new Uint8Array( [ 9 ] ).buffer
			);

			const input = new File( [], 'animation.gif', {
				type: 'image/gif',
			} );

			const result = await ffmpegConvertGifToVideo(
				'queue-2',
				input,
				'video/webm'
			);

			expect( result.name ).toBe( 'animation.webm' );
			expect( result.type ).toBe( 'video/webm' );
		} );

		it( 'forwards id, buffer, mime type, and max dimensions to the worker', async () => {
			mockedWorker.ffmpegConvertGifToVideo.mockResolvedValue(
				new ArrayBuffer( 0 )
			);

			const bytes = new Uint8Array( [ 1, 2, 3 ] );
			const input = new File( [ bytes ], 'source.gif', {
				type: 'image/gif',
			} );

			await ffmpegConvertGifToVideo(
				'queue-3',
				input,
				'video/mp4',
				1024
			);

			expect(
				mockedWorker.ffmpegConvertGifToVideo
			).toHaveBeenCalledTimes( 1 );
			const call = mockedWorker.ffmpegConvertGifToVideo.mock.calls[ 0 ];
			expect( call[ 0 ] ).toBe( 'queue-3' );
			expect( new Uint8Array( call[ 1 ] ) ).toEqual( bytes );
			expect( call[ 2 ] ).toBe( 'video/mp4' );
			expect( call[ 3 ] ).toBe( 1024 );
		} );

		it( 'omits maxDimensions when not provided', async () => {
			mockedWorker.ffmpegConvertGifToVideo.mockResolvedValue(
				new ArrayBuffer( 0 )
			);

			const input = new File( [], 'source.gif', {
				type: 'image/gif',
			} );
			await ffmpegConvertGifToVideo( 'queue-4', input, 'video/mp4' );

			const args = mockedWorker.ffmpegConvertGifToVideo.mock.calls[ 0 ];
			expect( args[ 3 ] ).toBeUndefined();
		} );

		it( 'handles files without an extension in the source name', async () => {
			mockedWorker.ffmpegConvertGifToVideo.mockResolvedValue(
				new ArrayBuffer( 0 )
			);

			const input = new File( [], 'no-extension', {
				type: 'image/gif',
			} );

			const result = await ffmpegConvertGifToVideo(
				'queue-5',
				input,
				'video/mp4'
			);

			expect( result.name ).toBe( 'no-extension.mp4' );
		} );
	} );

	describe( 'ffmpegCancelOperations', () => {
		it( 'returns false without touching the worker if the module was never loaded', async () => {
			let returned: boolean | undefined;
			await jest.isolateModulesAsync( async () => {
				const mod = require( '../ffmpeg' );
				returned = await mod.ffmpegCancelOperations( 'queue-unused' );
			} );

			expect( returned ).toBe( false );
			expect(
				mockedWorker.ffmpegCancelOperations
			).not.toHaveBeenCalled();
		} );

		it( 'delegates to the worker after the module has been loaded', async () => {
			// First load the module by running a conversion.
			mockedWorker.ffmpegConvertGifToVideo.mockResolvedValue(
				new ArrayBuffer( 0 )
			);
			await ffmpegConvertGifToVideo(
				'queue-6',
				new File( [], 'a.gif', { type: 'image/gif' } ),
				'video/mp4'
			);

			mockedWorker.ffmpegCancelOperations.mockResolvedValue( true );

			const cancelled = await ffmpegCancelOperations( 'queue-6' );

			expect( mockedWorker.ffmpegCancelOperations ).toHaveBeenCalledWith(
				'queue-6'
			);
			expect( cancelled ).toBe( true );
		} );
	} );

	describe( 'terminateFFmpegWorker', () => {
		it( 'is a no-op when the module was never loaded', async () => {
			await jest.isolateModulesAsync( async () => {
				const mod = require( '../ffmpeg' );
				mod.terminateFFmpegWorker();
			} );

			expect( mockedWorker.terminateFFmpegWorker ).not.toHaveBeenCalled();
		} );

		it( 'delegates to the worker once the module is loaded', async () => {
			mockedWorker.ffmpegConvertGifToVideo.mockResolvedValue(
				new ArrayBuffer( 0 )
			);
			await ffmpegConvertGifToVideo(
				'queue-7',
				new File( [], 'b.gif', { type: 'image/gif' } ),
				'video/mp4'
			);

			terminateFFmpegWorker();

			expect( mockedWorker.terminateFFmpegWorker ).toHaveBeenCalledTimes(
				1
			);
		} );
	} );
} );
