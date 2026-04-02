/**
 * WordPress dependencies
 */
import { dispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Vips JXL WASM configuration provided by the wp-vips-jxl plugin.
 */
export interface VipsJxlConfig {
	/** URL to the vips-jxl.wasm binary. */
	wasmUrl: string;
}

/**
 * The plugin slug on WordPress.org.
 */
const JXL_PLUGIN_SLUG = 'wp-vips-jxl';

/**
 * Cached JXL config.
 * - undefined: not yet checked
 * - VipsJxlConfig: available
 * - null: permanently unavailable this session
 */
let cachedConfig: VipsJxlConfig | null | undefined;

/**
 * Returns vips JXL WASM config if the plugin is active.
 *
 * Checks window.__vipsJxlConfig which is set by the plugin
 * via wp_add_inline_script on editor page load.
 */
function getVipsJxlConfig(): VipsJxlConfig | null {
	const config = ( window as unknown as Record< string, unknown > )
		.__vipsJxlConfig as VipsJxlConfig | undefined;
	return config ?? null;
}

/**
 * Fetches JXL config from the plugin's REST endpoint.
 *
 * Used after mid-session plugin installation, since the inline script
 * that normally sets window.__vipsJxlConfig wasn't rendered.
 */
async function fetchVipsJxlConfig(): Promise< VipsJxlConfig | null > {
	try {
		const response = await window.fetch(
			// Use wpApiSettings.root if available for proper REST URL prefix.
			( (
				window as unknown as Record<
					string,
					{ root?: string } | undefined
				>
			 ).wpApiSettings?.root ?? '/wp-json/' ) + 'wp-vips-jxl/v1/config',
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
		const config = ( await response.json() ) as VipsJxlConfig;
		// Cache on the global for subsequent calls.
		( window as unknown as Record< string, unknown > ).__vipsJxlConfig =
			config;
		return config;
	} catch {
		return null;
	}
}

/**
 * Installs and activates the wp-vips-jxl plugin via the REST API.
 *
 * Uses the same saveEntityRecord pattern as the Connectors system.
 */
async function installVipsJxlPlugin(): Promise< boolean > {
	try {
		await dispatch( coreStore ).saveEntityRecord(
			'root',
			'plugin',
			{ slug: JXL_PLUGIN_SLUG, status: 'active' },
			{ throwOnError: true }
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Ensures vips JXL WASM is available, installing the plugin if needed.
 *
 * Returns the WASM config if available, or null if unavailable.
 * The result is cached for the browser session.
 *
 * Degradation chain:
 * 1. Plugin already active -> return config from window global
 * 2. Plugin not active, user can install -> install + fetch config via REST
 * 3. Plugin not active, user cannot install -> return null (upload as-is)
 */
export async function ensureVipsJxlAvailable(): Promise< VipsJxlConfig | null > {
	if ( cachedConfig !== undefined ) {
		return cachedConfig;
	}

	// Check if plugin is already active (config set on page load).
	const config = getVipsJxlConfig();
	if ( config ) {
		cachedConfig = config;
		return config;
	}

	// Plugin not active — can we install it?
	// Use resolveSelect to wait for permission data to load.
	const canInstall = await resolveSelect( coreStore ).canUser( 'create', {
		kind: 'root',
		name: 'plugin',
	} );
	if ( ! canInstall ) {
		cachedConfig = null;
		return null;
	}

	// Install + activate the plugin.
	const installed = await installVipsJxlPlugin();
	if ( ! installed ) {
		cachedConfig = null;
		return null;
	}

	// Fetch config from the now-active plugin's REST endpoint.
	const freshConfig = await fetchVipsJxlConfig();
	cachedConfig = freshConfig;
	return freshConfig;
}
