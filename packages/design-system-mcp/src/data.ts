import {
	hydrateManifestEntry,
	isRefManifest,
	type ComponentsManifest,
} from './manifest';
import {
	canonicalComponentName,
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

let cachedManifest: ComponentsManifest | null = null;
let cachedManifestUrl: string | null = null;
let cachedTokens: string | null = null;

/**
 * Clear cached data. Intended for testing.
 */
export function resetCache(): void {
	cachedManifest = null;
	cachedManifestUrl = null;
	cachedTokens = null;
}

/**
 * Fetch and cache the components manifest index (inline or ref-shaped).
 */
async function fetchManifest(): Promise< {
	manifest: ComponentsManifest;
	manifestUrl: string;
} > {
	if ( cachedManifest && cachedManifestUrl ) {
		return { manifest: cachedManifest, manifestUrl: cachedManifestUrl };
	}

	const response = await fetch( COMPONENTS_MANIFEST_URL );
	if ( ! response.ok ) {
		throw new Error(
			`Failed to fetch components manifest: ${ response.status } ${ response.statusText }`
		);
	}

	const manifest = ( await response.json() ) as ComponentsManifest;
	cachedManifest = manifest;
	cachedManifestUrl = COMPONENTS_MANIFEST_URL;
	return { manifest, manifestUrl: COMPONENTS_MANIFEST_URL };
}

/**
 * Get all components from the manifest index (name + description).
 *
 * Works for both inline and ref manifests without resolving `$ref`s.
 */
export async function getComponents(): Promise< Component[] > {
	const { manifest } = await fetchManifest();
	return parseComponents(
		manifest.components as Record< string, ManifestComponent >
	);
}

/**
 * Entries whose canonical name matches `name` (case-insensitive).
 *
 * @param components - Manifest components keyed by id.
 * @param name       - Component name to match.
 */
function matchingEntries(
	components: Record< string, ManifestComponent >,
	name: string
): ManifestComponent[] {
	const needle = name.toLowerCase();
	return Object.values( components ).filter(
		( component ) =>
			canonicalComponentName( component.name ).toLowerCase() === needle
	);
}

/**
 * Get detailed documentation for a single component by name.
 *
 * For ref manifests, resolves only the matching components' docgen and
 * story-docs payloads. For inline manifests, uses the payload already on the
 * index entry.
 *
 * @param name - The component name (case-insensitive).
 */
export async function getComponentDetail(
	name: string
): Promise< ComponentDetail | null > {
	const { manifest, manifestUrl } = await fetchManifest();
	const components = manifest.components as Record<
		string,
		ManifestComponent
	>;
	const matches = matchingEntries( components, name );
	if ( matches.length === 0 ) {
		return null;
	}

	let hydrated: Record< string, ManifestComponent >;
	if ( isRefManifest( manifest ) ) {
		const entries = await Promise.all(
			matches.map( async ( entry ) => {
				const full = await hydrateManifestEntry( manifestUrl, entry );
				return [ full.id, full as ManifestComponent ] as const;
			} )
		);
		hydrated = Object.fromEntries( entries );
	} else {
		hydrated = Object.fromEntries(
			matches.map( ( entry ) => [ entry.id, entry ] )
		);
	}

	return parseComponentDetail( hydrated, name );
}

/**
 * Get the design tokens reference document as markdown.
 *
 * @return The tokens markdown content.
 */
export async function getDesignTokens(): Promise< { content: string } > {
	if ( ! cachedTokens ) {
		const response = await fetch( DESIGN_TOKENS_URL );
		if ( ! response.ok ) {
			throw new Error(
				`Failed to fetch design tokens: ${ response.status } ${ response.statusText }`
			);
		}

		cachedTokens = await response.text();
	}

	return { content: cachedTokens };
}
