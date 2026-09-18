/**
 * Stub for the generated `worker-code.ts` modules.
 *
 * `@wordpress/vips` and `@wordpress/video-conversion` each inline their whole
 * worker bundle into `src/worker-code.ts` during a full build. That file is
 * gitignored, so it does not exist in a unit test run, and a test that reaches
 * one of the `*-worker.ts` modules fails to resolve it. No unit test starts a
 * real worker, so an empty source is enough.
 */

export const workerCode = '';
