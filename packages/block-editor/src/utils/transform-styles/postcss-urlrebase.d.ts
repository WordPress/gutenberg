/**
 * `postcss-urlrebase` ships an `index.d.ts` that incorrectly declares the module as `rebaseUrl` instead of `postcss-urlrebase`.
 * Until that's fixed upstream, redeclare the module here so its types resolve correctly.
 */
declare module 'postcss-urlrebase' {
	import type { PluginCreator } from 'postcss';

	interface RebaseUrlOptions {
		skipHostRelativeUrls?: boolean;
		rootUrl: string | URL;
	}

	const rebaseUrl: PluginCreator< RebaseUrlOptions >;
	export default rebaseUrl;
}
