/**
 * Stub for the @wordpress/video-conversion/worker module.
 *
 * The real video-conversion-worker.ts imports from worker-code.ts, which is
 * auto-generated during the full build process and is gitignored. Since unit
 * tests don't run a full build, we provide this stub with mock implementations.
 *
 * Tests that need to customize the mock behavior can use jest.mock() in their
 * test files to override these defaults.
 */

const convertGifToVideo = jest.fn();
const cancelGifToVideoOperations = jest.fn();
const terminateVideoConversionWorker = jest.fn();

module.exports = {
	convertGifToVideo,
	cancelGifToVideoOperations,
	terminateVideoConversionWorker,
};
