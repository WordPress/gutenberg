module.exports = [
	// Ignore excessively strict polyfilling of `Array.prototype.push` to work
	// around an obscure bug involving non-writable arrays.
	// See https://issues.chromium.org/issues/42202623 for the details of the
	// bug that leads to the polyfilling, and which we are choosing to ignore.
	'es.array.push',
	// This is an IE-only feature which we don't use, and don't want to polyfill.
	// @see https://github.com/WordPress/gutenberg/pull/49234
	'web.immediate',
	// Remove Set feature polyfills.
	//
	// The Babel/core-js integration has a severe limitation, in that any Set
	// objects (e.g. `new Set()`) are assumed to need all instance methods, and
	// get them all polyfilled. There is no validation as to whether those
	// methods are actually in use.
	//
	// This limitation causes a number of packages to unnecessarily get a
	// dependency on `wp-polyfill`, which in most cases gets loaded as part of
	// the critical path and can thus have an impact on performance.
	//
	// There is no good solution to this, and the one we've opted for here is
	// to disable polyfilling these features entirely. Developers will need to
	// take care not to use them in scenarios where the code may be running in
	// older browsers without native support for them.
	//
	// These need to be specified as both `es.` and `esnext.` due to the way
	// internal dependencies are set up in Babel / core-js.
	//
	// @see https://github.com/WordPress/gutenberg/pull/67230
	/^es(next)?\.set\./,
	// Remove Iterator feature polyfills.
	// For the same reasoning as for Set exlusion above, we're excluding all iterator helper polyfills.
	//
	// @see https://github.com/WordPress/wordpress-develop/pull/8224#issuecomment-2636390007.
	/^es(next)?\.iterator\./,
];
