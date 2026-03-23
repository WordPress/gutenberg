/**
 * Stub for the @wordpress/vips/worker module.
 *
 * The real vips-worker.ts imports from worker-code.ts, which is auto-generated
 * during the full build process and is gitignored. Since unit tests don't run
 * a full build, we provide this stub with mock implementations.
 *
 * Tests that need to customize the mock behavior can use jest.mock() in their
 * test files to override these defaults.
 */

const vipsConvertImageFormat = jest.fn();
const vipsCompressImage = jest.fn();
const vipsHasTransparency = jest.fn();
const vipsResizeImage = jest.fn();
const vipsRotateImage = jest.fn();
const vipsCancelOperations = jest.fn();
const terminateVipsWorker = jest.fn();

module.exports = {
	vipsConvertImageFormat,
	vipsCompressImage,
	vipsHasTransparency,
	vipsResizeImage,
	vipsRotateImage,
	vipsCancelOperations,
	terminateVipsWorker,
};
