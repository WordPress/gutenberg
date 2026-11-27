import type { McpServer } from '@modelcontextprotocol/server';
import { ResourceTemplate } from '@modelcontextprotocol/server';
import { getSkills } from './data.ts';
import { findSkillFile, skillUri } from './skills.ts';

/**
 * Publish the design system agent skills as MCP resources. Every file of a
 * skill is a `skill://<name>/<path>` resource, following the URI layout of
 * the Skills extension (`io.modelcontextprotocol/skills`), so clients that load
 * skills by URI can read them with `resources/read`.
 *
 * The extension's `skills/list` and `skills/get` methods are not served yet,
 * because the MCP SDK this package uses only registers standard methods.
 *
 * @param server - The MCP server instance.
 */
export function registerSkills( server: McpServer ): void {
	server.registerResource(
		'skills',
		new ResourceTemplate( 'skill://{+path}', {
			list: async () => ( {
				resources: ( await getSkills() ).flatMap( ( skill ) =>
					skill.files.map( ( file ) => ( {
						uri: skillUri( skill.name, file.path ),
						name:
							file.path === 'SKILL.md'
								? skill.name
								: `${ skill.name }/${ file.path }`,
						description:
							file.path === 'SKILL.md'
								? skill.frontmatter.description
								: undefined,
						mimeType: 'text/markdown',
					} ) )
				),
			} ),
		} ),
		{
			title: 'Design system agent skills',
			description:
				'Agent skills for building with `@wordpress/ui` and `@wordpress/theme`.',
			mimeType: 'text/markdown',
		},
		async ( uri ) => {
			const found = findSkillFile( await getSkills(), uri.href );
			if ( ! found ) {
				throw new Error( `Unknown skill file: ${ uri.href }` );
			}
			return {
				contents: [
					{
						uri: uri.href,
						mimeType: 'text/markdown',
						text: found.file.content,
					},
				],
			};
		}
	);
}
