/**
 * WordPress dependencies
 */
import { dispatch, resolveSelect } from '@wordpress/data';

// The core-data store name. Using the string directly avoids adding
// core-data as a dependency, which would create a circular tsconfig
// reference: upload-media → core-data → block-editor → upload-media.
const CORE_STORE = 'core';

/**
 * FFmpeg WASM configuration provided by the wp-ffmpeg-wasm plugin.
 */
export interface FFmpegConfig {
	/** URL to the Emscripten JS glue file. */
	coreUrl: string;
	/** URL to the FFmpeg WASM binary. */
	wasmUrl: string;
}

/**
 * The plugin slug on WordPress.org.
 */
const FFMPEG_PLUGIN_SLUG = 'wp-ffmpeg-wasm';

/**
 * Cached FFmpeg config.
 * - undefined: not yet checked
 * - FFmpegConfig: available
 * - null: permanently unavailable this session
 */
let cachedConfig: FFmpegConfig | null | undefined;

/**
 * Returns FFmpeg WASM config if the plugin is active.
 *
 * Checks window.__ffmpegWasmConfig which is set by the plugin
 * via wp_add_inline_script on editor page load.
 */
function getFFmpegConfig(): FFmpegConfig | null {
	const config = ( window as unknown as Record< string, unknown > )
		.__ffmpegWasmConfig as FFmpegConfig | undefined;
	return config ?? null;
}

/**
 * Fetches FFmpeg config from the plugin's REST endpoint.
 *
 * Used after mid-session plugin installation, since the inline script
 * that normally sets window.__ffmpegWasmConfig wasn't rendered.
 */
async function fetchFFmpegConfig(): Promise< FFmpegConfig | null > {
	try {
		const response = await window.fetch(
			// Use wpApiSettings.root if available for proper REST URL prefix.
			( (
				window as unknown as Record<
					string,
					{ root?: string } | undefined
				>
			 ).wpApiSettings?.root ?? '/wp-json/' ) +
				'wp-ffmpeg-wasm/v1/config',
			{
				credentials: 'same-origin',
				headers: {
					// Include the nonce for authentication.
					'X-WP-Nonce':
						( (
							window as unknown as Record<
								string,
								{ nonce?: string } | undefined
							>
						 ).wpApiSettings?.nonce as string ) ?? '',
				},
			}
		);
		if ( ! response.ok ) {
			return null;
		}
		const config = ( await response.json() ) as FFmpegConfig;
		// Cache on the global for subsequent calls.
		( window as unknown as Record< string, unknown > ).__ffmpegWasmConfig =
			config;
		return config;
	} catch {
		return null;
	}
}

/**
 * Installs and activates the wp-ffmpeg-wasm plugin via the REST API.
 *
 * Uses the same saveEntityRecord pattern as the Connectors system.
 */
async function installFFmpegPlugin(): Promise< boolean > {
	try {
		await (
			dispatch( CORE_STORE ) as {
				saveEntityRecord: (
					kind: string,
					name: string,
					record: Record< string, unknown >,
					options?: Record< string, unknown >
				) => Promise< unknown >;
			}
		 ).saveEntityRecord(
			'root',
			'plugin',
			{ slug: FFMPEG_PLUGIN_SLUG, status: 'active' },
			{ throwOnError: true }
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * In-flight promise to prevent concurrent installation attempts.
 */
let pendingEnsurePromise: Promise< FFmpegConfig | null > | undefined;

/**
 * Ensures FFmpeg WASM is available, installing the plugin if needed.
 *
 * Returns the WASM config if available, or null if unavailable.
 * The result is cached for the browser session. Concurrent calls
 * are deduplicated to avoid parallel plugin installations.
 *
 * Degradation chain:
 * 1. Plugin already active → return config from window global
 * 2. Plugin not active, user can install → install + fetch config via REST
 * 3. Plugin not active, user cannot install → return null (upload GIF as-is)
 */
export async function ensureFFmpegAvailable(): Promise< FFmpegConfig | null > {
	if ( cachedConfig !== undefined ) {
		return cachedConfig;
	}

	// Check if plugin is already active (config set on page load).
	const config = getFFmpegConfig();
	if ( config ) {
		cachedConfig = config;
		return config;
	}

	// Return existing in-flight promise to prevent concurrent attempts.
	if ( pendingEnsurePromise ) {
		return pendingEnsurePromise;
	}

	pendingEnsurePromise = ( async () => {
		// Plugin not active — can we install it?
		// Use resolveSelect to wait for permission data to load.
		const canInstall = await (
			resolveSelect( CORE_STORE ) as {
				canUser: (
					action: string,
					resource: Record< string, string >
				) => Promise< boolean >;
			}
		 ).canUser( 'create', {
			kind: 'root',
			name: 'plugin',
		} );
		if ( ! canInstall ) {
			cachedConfig = null;
			return null;
		}

		// Install + activate the plugin.
		const installed = await installFFmpegPlugin();
		if ( ! installed ) {
			cachedConfig = null;
			return null;
		}

		// Fetch config from the now-active plugin's REST endpoint.
		const freshConfig = await fetchFFmpegConfig();
		cachedConfig = freshConfig;
		return freshConfig;
	} )();

	try {
		return await pendingEnsurePromise;
	} finally {
		pendingEnsurePromise = undefined;
	}
}
