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

// In-flight or resolved promises are cached so that concurrent callers
// share a single fetch, rather than each kicking off their own request.
let cachedComponents: Promise< Record< string, ManifestComponent > > | null =
	null;
let cachedTokens: Promise< string > | null = null;

/**
 * Clear cached data. Intended for testing.
 */
export function resetCache(): void {
	cachedComponents = null;
	cachedTokens = null;
}

/**
 * Fetch and cache the components from the Storybook manifest, filtered to only
 * components from allowed packages.
 *
 * @return The filtered components record.
 */
function fetchComponents(): Promise< Record< string, ManifestComponent > > {
	if ( ! cachedComponents ) {
		cachedComponents = ( async () => {
			let manifest: {
				v: number;
				components: Record< string, ManifestComponent >;
			};
			try {
				const response = await fetch( COMPONENTS_MANIFEST_URL );
				if ( ! response.ok ) {
					throw new Error(
						`Failed to fetch components manifest: ${ response.status } ${ response.statusText }`
					);
				}
				manifest = await response.json();
			} catch ( error ) {
				cachedComponents = null;
				throw error;
			}

			const filtered: Record< string, ManifestComponent > = {};
			for ( const [ key, component ] of Object.entries(
				manifest.components
			) ) {
				if ( packageNameFromPath( component.path ) ) {
					filtered[ key ] = component;
				}
			}

			return filtered;
		} )();
	}

	return cachedComponents;
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
	if ( ! cachedTokens ) {
		cachedTokens = ( async () => {
			try {
				const response = await fetch( DESIGN_TOKENS_URL );
				if ( ! response.ok ) {
					throw new Error(
						`Failed to fetch design tokens: ${ response.status } ${ response.statusText }`
					);
				}

				return await response.text();
			} catch ( error ) {
				cachedTokens = null;
				throw error;
			}
		} )();
	}

	const content = await cachedTokens;
	return { content };
}
