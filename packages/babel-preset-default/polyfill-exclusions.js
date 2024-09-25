module.exports = [
	// Ignore excessively strict polyfilling of `Array.prototype.push` to work
	// around an obscure bug involving non-writable arrays.
	// See https://issues.chromium.org/issues/42202623 for the details of the
	// bug that leads to the polyfilling, and which we are choosing to ignore.
	'es.array.push',
	// This is an IE-only feature which we don't use, and don't want to polyfill.
	// @see https://github.com/WordPress/gutenberg/pull/49234
	'web.immediate',
];
