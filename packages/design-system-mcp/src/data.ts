import {
	packageNameFromPath,
	parseComponents,
	parseComponentDetail,
} from './parse-components.ts';
import { parseGuidanceDocs, parseGuidanceList } from './parse-guidance.ts';
import type {
	Component,
	ComponentDetail,
	GuidanceDoc,
	GuidanceSummary,
	ManifestComponent,
	ManifestDoc,
} from './types.ts';

const COMPONENTS_MANIFEST_URL =
	process.env.COMPONENTS_MANIFEST_URL ||
	'https://wordpress.github.io/gutenberg/manifests/components.json';

const DOCS_MANIFEST_URL =
	process.env.DOCS_MANIFEST_URL ||
	'https://wordpress.github.io/gutenberg/manifests/docs.json';

const DESIGN_TOKENS_URL =
	process.env.DESIGN_TOKENS_URL ||
	'https://raw.githubusercontent.com/WordPress/gutenberg/refs/heads/trunk/packages/theme/docs/tokens.md';

let cachedComponents: Record< string, ManifestComponent > | null = null;
let cachedTokens: string | null = null;
let cachedDocs: Record< string, ManifestDoc > | null = null;

/**
 * Clear cached data. Intended for testing.
 */
export function resetCache(): void {
	cachedComponents = null;
	cachedTokens = null;
	cachedDocs = null;
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
 * Fetch and cache the standalone docs manifest. It is optional (older
 * Storybook builds don't publish it), and its content is only a supplement to
 * the docs attached to components, so a failure yields an empty record.
 *
 * @return The standalone docs record.
 */
async function fetchStandaloneDocs(): Promise< Record< string, ManifestDoc > > {
	if ( cachedDocs ) {
		return cachedDocs;
	}

	try {
		const response = await fetch( DOCS_MANIFEST_URL );
		if ( response.ok ) {
			const manifest: { docs?: Record< string, ManifestDoc > } =
				await response.json();
			cachedDocs = manifest.docs ?? {};
			return cachedDocs;
		}
	} catch {
		// Fall through to attached docs only.
	}
	return {};
}

/**
 * List guidance pages: usage guidelines, best practices, migration guides.
 *
 * @return Guidance summaries.
 */
export async function getGuidanceList(): Promise< GuidanceSummary[] > {
	const [ components, docs ] = await Promise.all( [
		fetchComponents(),
		fetchStandaloneDocs(),
	] );
	return parseGuidanceList( components, docs );
}

/**
 * Get guidance pages matching a page id, title, or component name.
 *
 * @param topic - A page id or title, or a component name.
 * @return Matching pages; empty when none match.
 */
export async function getGuidance( topic: string ): Promise< GuidanceDoc[] > {
	const [ components, docs ] = await Promise.all( [
		fetchComponents(),
		fetchStandaloneDocs(),
	] );
	return parseGuidanceDocs( components, docs, topic );
}
