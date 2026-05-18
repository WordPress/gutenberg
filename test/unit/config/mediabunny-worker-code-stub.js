/**
 * Stub for the @wordpress/mediabunny/worker module.
 *
 * The real mediabunny-worker.ts imports from worker-code.ts, which is
 * auto-generated during the full build process and is gitignored. Since unit
 * tests don't run a full build, we provide this stub with mock implementations.
 *
 * Tests that need to customize the mock behavior can use jest.mock() in their
 * test files to override these defaults.
 */

const mediabunnyConvertGifToVideo = jest.fn();
const mediabunnyCancelOperations = jest.fn();
const terminateMediabunnyWorker = jest.fn();

module.exports = {
	mediabunnyConvertGifToVideo,
	mediabunnyCancelOperations,
	terminateMediabunnyWorker,
};
