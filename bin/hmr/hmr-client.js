// @ts-nocheck
/* global EventSource */
/**
 * Browser-side HMR client.
 *
 * Connects to the live-reload SSE server and handles hot updates:
 * - JS changes: reloads bundles via new <script> tags, then calls
 *   performReactRefresh(). Falls back to full reload if no React
 *   components were updated.
 * - CSS changes: swaps <link> stylesheets with cache-busted URLs.
 */
( function () {
	'use strict';

	// 35729 is the LiveReload protocol's traditional port (livereload.com),
	// kept for muscle-memory and tooling compatibility. Must match the port
	// used by bin/live-reload.mjs and lib/dev-hmr.php.
	const PORT = 35729;
	const BATCH_MS = 50;
	const MODULE_RELOAD_DELAY_MS = 5000;
	const RECENT_LOAD_MS = 3000;
	const runtime = window.__hmr_runtime;

	if ( ! runtime ) {
		console.warn(
			'[HMR] react-refresh runtime not found at window.__hmr_runtime — full reload will be used. ' +
				'Check that <script src="http://localhost:35729/hmr/react-refresh-runtime.js"> loads BEFORE React.'
		);
	}

	// SCRIPT_DEBUG check: if WordPress is loading the minified bundle
	// variants (index.min.js), our HMR transforms — which only ship in
	// the non-minified index.js — don't apply, and every save will
	// silently full-reload. Loud warning at startup so the user knows
	// to flip SCRIPT_DEBUG on in wp-config.php.
	( function () {
		const scripts = document.querySelectorAll(
			'script[src*="build/scripts/"]'
		);
		if ( scripts.length === 0 ) {
			return;
		}
		let hasNonMin = false;
		let hasMin = false;
		for ( let i = 0; i < scripts.length; i++ ) {
			const src = scripts[ i ].getAttribute( 'src' ) || '';
			if ( /\.min\.js(\?|$)/.test( src ) ) {
				hasMin = true;
			} else if ( /\.js(\?|$)/.test( src ) ) {
				hasNonMin = true;
			}
		}
		if ( hasMin && ! hasNonMin ) {
			console.warn(
				'[HMR] WordPress is loading minified bundles (index.min.js). ' +
					'Fast-refresh transforms are only present in the non-minified bundles, ' +
					'so every save will fall back to a full page reload. ' +
					"Set `define( 'SCRIPT_DEBUG', true );` in wp-config.php to fix this."
			);
		}
	} )();

	// Runtime-collision canary. Our runtime sets window.__reactRefreshInjected=true
	// to suppress WordPress core's @pmmmwh react-refresh-webpack-plugin entry
	// from re-injecting and overwriting our DevTools hook handlers. If WP core
	// ever changes that flag name, our suppression silently breaks: __hmr_runtime
	// is still set, but it's disconnected from React's reconciler — every update
	// will then `performReactRefresh()` against an empty root list and full-reload.
	// Catch it early by sanity-checking _mountedRoots after the page has had a
	// fair chance to render.
	if ( runtime ) {
		setTimeout( function () {
			try {
				const roots = runtime._getMountedRootCount();
				if ( roots === 0 ) {
					console.warn(
						'[HMR] runtime is loaded but tracking 0 React roots — fast refresh will not work. ' +
							'Most likely cause: WordPress core re-injected its own react-refresh runtime after ours, ' +
							'overwriting our hook handlers. Check that build/hmr/react-refresh-runtime.js sets ' +
							'window.__reactRefreshInjected=true and that it still suppresses ' +
							'wp-includes/js/dist/development/react-refresh-entry.js.'
					);
				}
			} catch {
				// Older runtime versions may not have _getMountedRootCount.
			}
		}, 5000 );
	}

	const source = new EventSource( 'http://localhost:' + PORT + '/events' );
	let pendingFiles = [];
	let batchTimer = null;
	let moduleReloadTimer = null;
	let pendingModuleReloadFiles = [];
	const recentScriptLoads = new Map();

	// SSE disconnect indicator: small fixed-position badge that appears
	// after the connection has been down for a few seconds. Without it,
	// users only get one warning in the console and don't realise file
	// saves are being silently dropped.
	let disconnectTimer = null;
	function showDisconnected() {
		const id = '__hmr_disconnect_indicator';
		if ( document.getElementById( id ) ) {
			return;
		}
		const el = document.createElement( 'div' );
		el.id = id;
		el.textContent = '⚠ HMR disconnected';
		el.title =
			'Live-reload SSE server (port ' +
			PORT +
			') is not reachable. Saves will not be picked up. Check `npm run dev`.';
		el.style.cssText = [
			'position:fixed',
			'bottom:8px',
			'right:8px',
			'z-index:2147483646',
			'background:#7a1f1f',
			'color:#fff',
			'padding:6px 10px',
			'border-radius:4px',
			'font:12px ui-sans-serif,system-ui,sans-serif',
			'box-shadow:0 1px 4px rgba(0,0,0,0.4)',
			'pointer-events:auto',
			'cursor:help',
		].join( ';' );
		( document.body || document.documentElement ).appendChild( el );
	}
	function hideDisconnected() {
		const el = document.getElementById( '__hmr_disconnect_indicator' );
		if ( el ) {
			el.remove();
		}
	}

	source.onopen = function () {
		console.log( '[HMR] Connected to SSE server on :' + PORT );
		clearTimeout( disconnectTimer );
		disconnectTimer = null;
		hideDisconnected();
	};

	source.onerror = function () {
		console.warn( '[HMR] Connection lost, will retry...' );
		// Show the badge only if we stay disconnected for more than a few
		// seconds — brief blips during dev restart shouldn't flash UI.
		if ( ! disconnectTimer ) {
			disconnectTimer = setTimeout( showDisconnected, 3000 );
		}
	};

	source.onmessage = function ( event ) {
		let data;
		try {
			data = JSON.parse( event.data );
		} catch {
			return;
		}

		// Build error / cleared events.
		if ( '__error' in data ) {
			renderErrorOverlay( data.__error );
			return;
		}

		if ( ! data.files || ! data.files.length ) {
			return;
		}

		for ( let i = 0; i < data.files.length; i++ ) {
			pendingFiles.push( data.files[ i ] );
		}

		clearTimeout( batchTimer );
		batchTimer = setTimeout( processBatch, BATCH_MS );
	};

	function processBatch() {
		const files = pendingFiles.slice();
		pendingFiles = [];

		const jsFiles = [];
		const cssFiles = [];
		const seenFiles = {};

		for ( let i = 0; i < files.length; i++ ) {
			const file = files[ i ];
			if ( seenFiles[ file ] ) {
				continue;
			}
			seenFiles[ file ] = true;
			// Skip minified and RTL variants — the dev page loads the
			// non-minified LTR variants, and reporting these as misses
			// would force a full reload.
			if (
				/\.min\.(js|css)$/.test( file ) ||
				/-rtl\.(css|min\.css)$/.test( file )
			) {
				continue;
			}
			if ( /\.css$/.test( file ) ) {
				cssFiles.push( file );
			} else if ( /\.js$/.test( file ) ) {
				jsFiles.push( file );
			}
		}

		// Handle CSS hot swap
		for ( let c = 0; c < cssFiles.length; c++ ) {
			swapCSS( cssFiles[ c ] );
		}

		// Handle JS hot update
		if ( jsFiles.length > 0 ) {
			if ( ! runtime ) {
				console.log( '[HMR] No runtime, full reload' );
				reloadPage( 'missing runtime' );
				return;
			}
			hotUpdateJS( jsFiles );
		}
	}

	/**
	 * Swap a CSS stylesheet by finding its <link> and updating the href.
	 *
	 * @param {string} filePath Relative path under build/ (e.g. "styles/components/style.css")
	 */
	function swapCSS( filePath ) {
		const links = document.querySelectorAll( 'link[rel="stylesheet"]' );
		for ( let i = 0; i < links.length; i++ ) {
			const href = links[ i ].getAttribute( 'href' );
			if ( ! href ) {
				continue;
			}

			// Suffix match against the path portion (no query string).
			// filePath is something like "styles/edit-site/style.css"; the
			// link's href ends with that exact substring at a path boundary.
			if ( pathEndsWith( href.split( '?' )[ 0 ], filePath ) ) {
				const newHref = href.split( '?' )[ 0 ] + '?hmr=' + Date.now();
				links[ i ].setAttribute( 'href', newHref );
				console.log( '[HMR] CSS updated: ' + filePath );
				return;
			}
		}
		// Not loaded on this page (e.g. a different stylesheet variant);
		// nothing to swap. Don't reload — other matching files in this
		// batch may still apply cleanly.
		console.log( '[HMR] CSS not on this page, skipping: ' + filePath );
	}

	/**
	 * Return true if `urlPath` ends with `filePath` and the character before
	 * the match is a path separator (or the start of the string). This
	 * prevents `scripts/edit-site/index.js` from matching e.g.
	 * `scripts/super-edit-site/index.js`.
	 *
	 * @param {string} urlPath  The script src or link href, query stripped.
	 * @param {string} filePath The relative path reported by the watcher.
	 * @return {boolean} True if the file path matches at a path boundary.
	 */
	function pathEndsWith( urlPath, filePath ) {
		if ( urlPath.length < filePath.length ) {
			return false;
		}
		if ( urlPath.slice( -filePath.length ) !== filePath ) {
			return false;
		}
		const charBefore = urlPath.charAt(
			urlPath.length - filePath.length - 1
		);
		return charBefore === '' || charBefore === '/';
	}

	/**
	 * Hot-update JS bundles by loading them via new <script> tags,
	 * then calling performReactRefresh().
	 *
	 * @param {string[]} filePaths Array of relative paths under build/
	 */
	function hotUpdateJS( filePaths ) {
		// Pre-filter: drop bundles whose <script> tag isn't on this page.
		// Editing a file in @wordpress/block-library cascades to every
		// affected output, including block view scripts (modules/.../view.js)
		// that are only loaded on the front-end, not in the admin. Without
		// this filter, every cascade rebuild would trigger N "Script tag
		// not found → full reload" misses for those view scripts.
		const onPage = [];
		const moduleScripts = [];
		const skipped = [];
		for ( let i = 0; i < filePaths.length; i++ ) {
			const filePath = filePaths[ i ];
			if ( wasRecentlyLoaded( filePath ) ) {
				skipped.push( filePath );
				continue;
			}
			const script = findScriptTagFor( filePath );
			if ( script ) {
				if ( script.type === 'module' ) {
					moduleScripts.push( filePath );
					continue;
				}
				onPage.push( filePath );
			} else {
				skipped.push( filePath );
			}
		}
		if ( skipped.length > 0 ) {
			console.log(
				'[HMR] Not on this page, skipping: ' + skipped.join( ', ' )
			);
		}
		if ( moduleScripts.length > 0 && onPage.length === 0 ) {
			scheduleModuleReload( moduleScripts );
			return;
		}
		cancelModuleReload();
		if ( moduleScripts.length > 0 ) {
			console.log(
				'[HMR] Module script changed in a Fast Refresh batch, skipping: ' +
					moduleScripts.join( ', ' )
			);
		}
		if ( onPage.length === 0 ) {
			return; // Nothing on this page to refresh.
		}

		let loaded = 0;
		const total = onPage.length;
		let hasError = false;

		function onAllLoaded() {
			if ( hasError ) {
				return; // Error handler already triggered reload
			}

			try {
				const result = runtime.performReactRefresh();
				if ( result === null || result === undefined ) {
					console.log(
						'[HMR] performReactRefresh() returned null — registry has no pending updates. Falling back to full reload.'
					);
					reloadPage( 'no pending React refresh updates' );
				} else {
					console.log( '[HMR] React components refreshed' );
				}
			} catch ( e ) {
				console.error( '[HMR] React refresh failed:', e );
				reloadPage( 'React refresh failed' );
			}
		}

		for ( let i = 0; i < onPage.length; i++ ) {
			loadScript(
				onPage[ i ],
				function () {
					loaded++;
					if ( loaded === total ) {
						onAllLoaded();
					}
				},
				function ( failedPath ) {
					if ( ! hasError ) {
						hasError = true;
						console.error(
							'[HMR] Script load error: ' +
								failedPath +
								', full reload'
						);
						reloadPage( 'script load error: ' + failedPath );
					}
				}
			);
		}
	}

	function wasRecentlyLoaded( filePath ) {
		const loadedAt = recentScriptLoads.get( filePath );
		return !! loadedAt && Date.now() - loadedAt < RECENT_LOAD_MS;
	}

	function scheduleModuleReload( filePaths ) {
		for ( let i = 0; i < filePaths.length; i++ ) {
			pendingModuleReloadFiles.push( filePaths[ i ] );
		}
		clearTimeout( moduleReloadTimer );
		moduleReloadTimer = setTimeout( function () {
			const files = pendingModuleReloadFiles.slice();
			pendingModuleReloadFiles = [];
			moduleReloadTimer = null;
			console.log(
				'[HMR] Module script changed, full reload: ' +
					files.join( ', ' )
			);
			reloadPage( 'module script changed: ' + files.join( ', ' ) );
		}, MODULE_RELOAD_DELAY_MS );
		console.log(
			'[HMR] Module script changed, waiting for Fast Refresh batch: ' +
				filePaths.join( ', ' )
		);
	}

	function cancelModuleReload() {
		if ( ! moduleReloadTimer ) {
			return;
		}
		clearTimeout( moduleReloadTimer );
		moduleReloadTimer = null;
		pendingModuleReloadFiles = [];
	}

	/**
	 * Find the `<script src>` tag on this page that matches `filePath` at
	 * a path boundary, or null if none does.
	 *
	 * @param {string} filePath Relative path under build/.
	 * @return {?HTMLScriptElement} The matching script tag, or null.
	 */
	function findScriptTagFor( filePath ) {
		const scripts = document.querySelectorAll( 'script[src]' );
		for ( let i = 0; i < scripts.length; i++ ) {
			const src = scripts[ i ].getAttribute( 'src' );
			if ( ! src ) {
				continue;
			}
			const srcBase = src.split( '?' )[ 0 ];
			if ( pathEndsWith( srcBase, filePath ) ) {
				return scripts[ i ];
			}
		}
		return null;
	}

	/**
	 * Load a JS bundle by finding the original <script> tag and creating
	 * a new one with a cache-busted URL.
	 *
	 * @param {string}   filePath Relative path under build/ (e.g. "scripts/edit-site/index.js")
	 * @param {Function} onLoad   Called on successful load.
	 * @param {Function} onError  Called with filePath on error.
	 */
	function loadScript( filePath, onLoad, onError ) {
		const originalScript = findScriptTagFor( filePath );

		if ( ! originalScript ) {
			console.log(
				'[HMR] Script tag not found for: ' + filePath + ', full reload'
			);
			reloadPage( 'script tag not found: ' + filePath );
			return;
		}

		const originalSrc = originalScript
			.getAttribute( 'src' )
			.split( '?' )[ 0 ];
		const script = document.createElement( 'script' );
		script.src = originalSrc + '?hmr=' + Date.now();
		if ( originalScript.noModule ) {
			script.noModule = true;
		}
		if ( originalScript.crossOrigin ) {
			script.crossOrigin = originalScript.crossOrigin;
		}
		if ( originalScript.referrerPolicy ) {
			script.referrerPolicy = originalScript.referrerPolicy;
		}
		script.onload = onLoad;
		script.onerror = function () {
			onError( filePath );
		};
		recentScriptLoads.set( filePath, Date.now() );
		document.head.appendChild( script );
		console.log( '[HMR] Loading: ' + filePath );
	}

	function reloadPage( reason ) {
		console.log( '[HMR] Full reload: ' + reason );
		window.location.reload();
	}

	/**
	 * Render or hide a fixed-position overlay describing the latest build
	 * error. Pass null/undefined to hide.
	 *
	 * @param {Object|null} error Error payload from the SSE server.
	 */
	function renderErrorOverlay( error ) {
		const id = '__hmr_build_error_overlay';
		const existing = document.getElementById( id );
		if ( ! error ) {
			if ( existing ) {
				existing.remove();
			}
			return;
		}

		const overlay = existing || document.createElement( 'div' );
		overlay.id = id;
		overlay.style.cssText = [
			'position:fixed',
			'inset:0',
			'z-index:2147483647',
			'background:rgba(0,0,0,0.85)',
			'color:#ff6b6b',
			'font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace',
			'padding:24px',
			'overflow:auto',
			'white-space:pre-wrap',
			'pointer-events:auto',
		].join( ';' );

		const title = '[HMR build error] ' + ( error.packageName || '' );
		let loc = '';
		if ( error.locations && error.locations.length ) {
			const l = error.locations[ 0 ];
			loc =
				'\n\n' +
				( l.file || '' ) +
				':' +
				( l.line || 0 ) +
				':' +
				( l.column || 0 );
		}

		overlay.textContent = title + '\n\n' + ( error.message || '' ) + loc;

		if ( ! existing ) {
			( document.body || document.documentElement ).appendChild(
				overlay
			);
		}
	}
} )();
