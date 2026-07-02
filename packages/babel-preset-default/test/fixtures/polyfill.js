// Note: this fixture may need to be updated when the browserslist or the
// core-js dependencies are updated.
// It should always test a feature that is supported, but requires
// a polyfill to work across all supported browsers.
const { promise } = Promise.withResolvers();
window.promise = promise;
