import {
	packageNameFromPath,
	parseComponents,
	parseComponentDetail,
} from './parse-components';
import type { Component, ComponentDetail, ManifestComponent } from './types';

const COMPONENTS_MANIFEST_URL =
	process.env.COMPONENTS_MANIFEST_URL ||
	'https://wordpress.github.io/gutenberg/manifests/components.json';

const DESIGN_TOKENS_URL =
	process.env.DESIGN_TOKENS_URL ||
	'https://raw.githubusercontent.com/WordPress/gutenberg/refs/heads/trunk/packages/theme/docs/tokens.md';

const HOUR_IN_MS = 60 * 60 * 1000;

type CachedFetcher< T > = ( () => Promise< T > ) & { reset: () => void };

/**
 * Wrap an async fetcher so that successful results are cached for `ttlMs`
 * milliseconds. Concurrent callers share a single in-flight promise, and
 * failed fetches are evicted immediately so the next call can retry.
 *
 * The returned function exposes a `reset()` method that clears its own
 * cache, allowing callers to compose a higher-level reset without the
 * wrapper needing to know about a shared registry.
 *
 * @param fetcher - The async function whose result should be cached.
 * @param ttlMs   - Cache lifetime in milliseconds. Defaults to one hour.
 * @return A function returning the cached (or freshly fetched) promise.
 */
function withTTL< T >(
	fetcher: () => Promise< T >,
	ttlMs: number = HOUR_IN_MS
): CachedFetcher< T > {
	let cached: Promise< T > | null = null;
	let expiresAt = 0;

	return Object.assign(
		() => {
			if ( ! cached || Date.now() > expiresAt ) {
				cached = ( async () => {
					try {
						return await fetcher();
					} catch ( error ) {
						cached = null;
						expiresAt = 0;
						throw error;
					}
				} )();

				expiresAt = Date.now() + ttlMs;
			}

			return cached;
		},
		{
			reset: () => {
				cached = null;
				expiresAt = 0;
			},
		}
	);
}

const fetchComponents = withTTL( async () => {
	const response = await fetch( COMPONENTS_MANIFEST_URL );
	if ( ! response.ok ) {
		throw new Error(
			`Failed to fetch components manifest: ${ response.status } ${ response.statusText }`
		);
	}

	const manifest: {
		v: number;
		components: Record< string, ManifestComponent >;
	} = await response.json();

	const filtered: Record< string, ManifestComponent > = {};
	for ( const [ key, component ] of Object.entries( manifest.components ) ) {
		if ( packageNameFromPath( component.path ) ) {
			filtered[ key ] = component;
		}
	}

	return filtered;
} );

const fetchTokens = withTTL( async () => {
	const response = await fetch( DESIGN_TOKENS_URL );
	if ( ! response.ok ) {
		throw new Error(
			`Failed to fetch design tokens: ${ response.status } ${ response.statusText }`
		);
	}

	return response.text();
} );

/**
 * Clear all cached data. Intended for testing.
 */
export function resetCache(): void {
	fetchComponents.reset();
	fetchTokens.reset();
}

/**
 * Get all components from allowed packages.
 *
 * @return Parsed component list.
 */
export async function getComponents(): Promise< Component[] > {
	const components = await fetchComponents();
	return parseComponents( components );
}

/**
 * Get detailed documentation for a single component by name.
 *
 * @param name - The component name (case-insensitive).
 * @return The component detail, or null if not found.
 */
export async function getComponentDetail(
	name: string
): Promise< ComponentDetail | null > {
	const components = await fetchComponents();
	return parseComponentDetail( components, name );
}

/**
 * Get the design tokens reference document as markdown.
 *
 * @return The tokens markdown content.
 */
export async function getDesignTokens(): Promise< { content: string } > {
	const content = await fetchTokens();
	return { content };
}
