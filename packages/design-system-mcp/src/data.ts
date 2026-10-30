import {
	packageNameFromPath,
	parseComponents,
	parseComponentDetail,
} from './parse-components.ts';
import { parsePatterns } from './parse-patterns.ts';
import type {
	Component,
	ComponentDetail,
	ManifestComponent,
	ManifestDoc,
	Pattern,
} from './types.ts';

const COMPONENTS_MANIFEST_URL =
	process.env.COMPONENTS_MANIFEST_URL ||
	'https://wordpress.github.io/gutenberg/manifests/components.json';

const DESIGN_TOKENS_URL =
	process.env.DESIGN_TOKENS_URL ||
	'https://raw.githubusercontent.com/WordPress/gutenberg/refs/heads/trunk/packages/theme/docs/tokens.md';

const DOCS_MANIFEST_URL =
	process.env.DOCS_MANIFEST_URL ||
	'https://wordpress.github.io/gutenberg/manifests/docs.json';

let cachedComponents: Record< string, ManifestComponent > | null = null;
let cachedTokens: string | null = null;
let cachedPatterns: Pattern[] | null = null;

/**
 * Clear cached data. Intended for testing.
 */
export function resetCache(): void {
	cachedComponents = null;
	cachedTokens = null;
	cachedPatterns = null;
}

/**
 * Fetch and cache the components from the Storybook manifest, filtered to only
 * components from allowed packages.
 *
 * @return The filtered components record.
 */
async function fetchComponents(): Promise<
	Record< string, ManifestComponent >
> {
	if ( cachedComponents ) {
		return cachedComponents;
	}

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

	cachedComponents = filtered;
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

/**
 * Get the design system patterns from the Storybook docs manifest.
 *
 * @return The patterns.
 */
export async function getPatterns(): Promise< Pattern[] > {
	if ( cachedPatterns ) {
		return cachedPatterns;
	}

	const response = await fetch( DOCS_MANIFEST_URL );
	if ( ! response.ok ) {
		throw new Error(
			`Failed to fetch docs manifest: ${ response.status } ${ response.statusText }`
		);
	}

	const manifest: {
		v: number;
		docs: Record< string, ManifestDoc >;
	} = await response.json();

	cachedPatterns = parsePatterns( manifest.docs );
	return cachedPatterns;
}

/**
 * Get a single pattern document by slug, including its markdown content.
 *
 * @param slug - The pattern slug (case-insensitive).
 * @return The pattern detail, or null if there is no such pattern.
 */
export async function getPatternDetail(
	slug: string
): Promise< Pattern | null > {
	const patterns = await getPatterns();
	const normalizedSlug = slug.trim().toLowerCase();
	return (
		patterns.find( ( pattern ) => pattern.slug === normalizedSlug ) ?? null
	);
}
