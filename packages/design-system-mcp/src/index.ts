import { McpServer } from '@modelcontextprotocol/server';
import { registerTools } from './tools/index.ts';

export { parseComponents, parseComponentDetail } from './parse-components.ts';

export function createServer() {
	const server = new McpServer(
		{
			name: 'WordPress Design System',
			version: '0.1.0',
		},
		{
			instructions: [
				'Provides discovery and usage information for the WordPress Design System. Covers components in `@wordpress/components` and `@wordpress/ui`, and the underlying design tokens from `@wordpress/theme` exposed as `--wpds-*` CSS custom properties.',
				'In a typical flow, a user will often refer to components by generic names ("button", "dropdown menu") that don\'t match the actual export. Call `get_components` first to map the request to canonical component names, then `get_component_details` for one or more of those names to get props, descriptions, and usage notes.',
				'`get_design_tokens` covers the semantic, themeable design tokens that the components are built on. While these can be used for custom styling that adapts to the current design system theme settings, prefer using the available component APIs when available.',
				'Choosing the right component is only half of the task: the design system also documents how to compose components into an interaction. Before implementing a flow such as a destructive action, a save or submit, or an error message, call `get_patterns` and then `get_pattern_details` for the relevant one. Follow its guidance instead of inferring a solution from the component list alone.',
			].join( '\n\n' ),
		}
	);

	registerTools( server );

	return server;
}
