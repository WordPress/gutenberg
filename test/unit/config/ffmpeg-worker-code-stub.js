/**
 * Stub for the @wordpress/ffmpeg/worker module.
 *
 * The real worker entry pulls in inlined FFmpeg WASM via @ffmpeg/core, which
 * isn't runnable under jest. This stub supplies mock implementations so the
 * upload-media wrapper can be exercised in unit tests.
 *
 * Tests that need to customize the mock behavior can use jest.mock() in their
 * test files to override these defaults.
 */

const ffmpegConvertGifToVideo = jest.fn();
const ffmpegCancelOperations = jest.fn();
const terminateFFmpegWorker = jest.fn();

module.exports = {
	ffmpegConvertGifToVideo,
	ffmpegCancelOperations,
	terminateFFmpegWorker,
};
