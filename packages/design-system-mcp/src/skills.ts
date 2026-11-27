import { load } from 'js-yaml';
import type { Skill, SkillFile } from './types.ts';

/**
 * Build the `skill://` URI of a file in a skill.
 *
 * @param name - The skill name.
 * @param path - The file path relative to the skill directory.
 * @return The resource URI.
 */
export function skillUri( name: string, path: string ): string {
	return `skill://${ name }/${ path }`;
}

/**
 * Parse the YAML frontmatter of a `SKILL.md` file.
 *
 * @param markdown - The contents of `SKILL.md`.
 * @return The frontmatter fields, or null when there is no frontmatter or it
 *         is not a YAML mapping.
 */
export function parseFrontmatter(
	markdown: string
): Record< string, unknown > | null {
	const match = markdown.match( /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/ );
	if ( ! match ) {
		return null;
	}

	const fields = load( match[ 1 ] );
	return fields && typeof fields === 'object' && ! Array.isArray( fields )
		? ( fields as Record< string, unknown > )
		: null;
}

/**
 * Find the file a `skill://` URI points to.
 *
 * @param skills - The published skills.
 * @param uri    - The resource URI.
 * @return The skill and file, or null if the URI does not name a skill file.
 */
export function findSkillFile(
	skills: Skill[],
	uri: string
): { skill: Skill; file: SkillFile } | null {
	for ( const skill of skills ) {
		const prefix = skillUri( skill.name, '' );
		if ( ! uri.startsWith( prefix ) ) {
			continue;
		}
		const path = uri.slice( prefix.length );
		const file = skill.files.find( ( f ) => f.path === path );
		if ( file ) {
			return { skill, file };
		}
	}
	return null;
}
