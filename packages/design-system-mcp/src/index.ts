import { McpServer } from '@modelcontextprotocol/server';
import { registerTools } from './tools/index.ts';

export { parseComponents, parseComponentDetail } from './parse-components.ts';
export { parsePatterns } from './parse-patterns.ts';

export function createServer() {
	const server = new McpServer(
		{
			name: 'WordPress Design System',
			version: '0.1.0',
		},
		{
			instructions: [
				'Provides guidance for building interfaces with the WordPress Design System, at three levels:',
				[
					'- Patterns describe how to approach a kind of interaction, such as confirming a destructive action or saving a form. A pattern says which components to choose for the situation and how to configure them.',
					'- Components are the building blocks in `@wordpress/ui` and `@wordpress/components`, documented with their props, examples, and import statements.',
					'- Design tokens are the themeable `--wpds-*` CSS custom properties from `@wordpress/theme` that the components are built on, for styling that no component covers.',
				].join( '\n' ),
				'Use the appropriate tool for each request:',
				[
					'- To answer a question about a specific component, such as its props or how to import it, call `get_component_details`. When the request uses a generic name ("dropdown menu") instead of the export name, call `get_components` first to find it.',
					'- To build an interface or a user flow, call `get_patterns` first to check whether a pattern covers the situation. If one does, call `get_pattern_details` and follow it: patterns record decisions that component documentation cannot, such as when to use one component instead of another. If none does, work from the components. In both cases, call `get_component_details` for the components you will use.',
					'- For custom styling, call `get_design_tokens`. Prefer component props when a component already expresses the styling intent.',
				].join( '\n' ),
			].join( '\n\n' ),
		}
	);

	registerTools( server );

	return server;
}
