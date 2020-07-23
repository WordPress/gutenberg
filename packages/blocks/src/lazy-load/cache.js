/**
 * A singleton class to cache and maintain a cache of
 * already loaded script dependencies. Used to prevent
 * the `LazyLoad` component from double-loading scripts.
 */
export class LazyLoadCache {
	constructor() {
		this._scripts = new Set();

		const preLoadedScriptElements = document.querySelectorAll(
			'script[id$="-js"]'
		);

		preLoadedScriptElements.forEach( ( element ) => {
			const scriptHandle = element.id.replace( '-js', '' );
			this.scripts.add( scriptHandle );
		} );
	}

	/**
	 * @return {Set<string>} Set of handles for already loaded scripts
	 */
	get scripts() {
		return this._scripts;
	}
}

export default new LazyLoadCache();
