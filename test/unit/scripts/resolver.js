// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module.exports = ( path, options ) => {
	// Call the defaultResolver, so we leverage its cache, error handling, etc.
	return options.defaultResolver( path, {
		...options,
		// Use packageFilter to process parsed `package.json` before the resolution (see https://www.npmjs.com/package/resolve#resolveid-opts-cb)
		packageFilter: ( pkg ) => {
			/*
			 * jest-environment-jsdom 28+ tries to use browser exports instead
			 * of default exports for these packages. Stripping the exports
			 * map forces Jest to fall back to the CommonJS `main` entry.
			 *
			 * `uuid` is matched here to handle nested v8 copies (e.g.
			 * `@actions/core`'s) that still ship a CJS `main`. uuid v14 is
			 * ESM-only with no `main`, so the `pkg.main` guard below skips it
			 * and lets Babel transform the ESM build via
			 * `transformIgnorePatterns`.
			 */
			if (
				pkg.name === 'uuid' ||
				pkg.name === 'react-colorful' ||
				pkg.name === 'expect' ||
				pkg.name === 'nanoid' ||
				pkg.name?.startsWith( '@wordpress/' )
			) {
				if ( pkg.main ) {
					delete pkg.exports;
					delete pkg.module;
				}
			}
			return pkg;
		},
	} );
};
