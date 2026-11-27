import {
	packageNameFromPath,
	parseComponents,
	parseComponentDetail,
} from './parse-components.ts';
import { parsePatterns } from './parse-patterns.ts';
import { parseFrontmatter } from './skills.ts';
import type {
	Component,
	ComponentDetail,
	ManifestComponent,
	ManifestDoc,
	Pattern,
	Skill,
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

const SKILLS_TREE_URL =
	process.env.SKILLS_TREE_URL ||
	'https://api.github.com/repos/WordPress/gutenberg/git/trees/trunk?recursive=1';

const SKILLS_RAW_BASE_URL =
	process.env.SKILLS_RAW_BASE_URL ||
	'https://raw.githubusercontent.com/WordPress/gutenberg/refs/heads/trunk/';

let cachedSkills: Skill[] | null = null;
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
	cachedSkills = null;
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

/**
 * Get the agent skills that the design system packages ship, such as the
 * `wp-ui` and `wp-theme` skills, with every file of each skill.
 *
 * The skills live in `packages/<package>/skills/<name>/`, so they are read
 * from the same trunk branch as the design tokens.
 *
 * @return The skills.
 */
export async function getSkills(): Promise< Skill[] > {
	if ( cachedSkills ) {
		return cachedSkills;
	}

	const treeResponse = await fetch( SKILLS_TREE_URL );
	if ( ! treeResponse.ok ) {
		throw new Error(
			`Failed to fetch skills tree: ${ treeResponse.status } ${ treeResponse.statusText }`
		);
	}

	const tree: { tree: { path: string; type: string }[] } =
		await treeResponse.json();

	const paths = new Map< string, { path: string; repoPath: string }[] >();
	for ( const entry of tree.tree ) {
		const match = entry.path.match(
			/^packages\/[^/]+\/skills\/([^/]+)\/(.+)$/
		);
		if ( entry.type !== 'blob' || ! match ) {
			continue;
		}
		const files = paths.get( match[ 1 ] ) ?? [];
		files.push( { path: match[ 2 ], repoPath: entry.path } );
		paths.set( match[ 1 ], files );
	}

	const skills: Skill[] = [];
	for ( const [ name, entries ] of paths ) {
		if ( ! entries.some( ( { path } ) => path === 'SKILL.md' ) ) {
			continue;
		}
		const files = await Promise.all(
			entries.map( async ( { path, repoPath } ) => {
				const response = await fetch( SKILLS_RAW_BASE_URL + repoPath );
				if ( ! response.ok ) {
					throw new Error(
						`Failed to fetch skill file ${ repoPath }: ${ response.status } ${ response.statusText }`
					);
				}
				return { path, content: await response.text() };
			} )
		);
		const frontmatter = parseFrontmatter(
			files.find( ( { path } ) => path === 'SKILL.md' )!.content
		);
		if ( frontmatter?.name !== name || ! frontmatter.description ) {
			continue;
		}
		skills.push( { name, frontmatter, files } );
	}

	cachedSkills = skills.sort( ( a, b ) => a.name.localeCompare( b.name ) );
	return cachedSkills;
}
