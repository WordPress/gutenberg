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
 * Parse the flat `key: value` frontmatter of a `SKILL.md` file. Values may be
 * plain or double-quoted on a single line. Nested YAML is not supported,
 * because the skills this server publishes do not use it.
 *
 * @param markdown - The contents of `SKILL.md`.
 * @return The frontmatter fields, or null when there is no frontmatter.
 */
export function parseFrontmatter(
	markdown: string
): Record< string, string > | null {
	const match = markdown.match( /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/ );
	if ( ! match ) {
		return null;
	}

	const fields: Record< string, string > = {};
	for ( const line of match[ 1 ].split( /\r?\n/ ) ) {
		const field = line.match( /^([A-Za-z0-9_-]+):\s*(.*)$/ );
		if ( ! field ) {
			continue;
		}
		const raw = field[ 2 ].trim();
		fields[ field[ 1 ] ] = raw.startsWith( '"' )
			? ( JSON.parse( raw ) as string )
			: raw;
	}
	return fields;
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
