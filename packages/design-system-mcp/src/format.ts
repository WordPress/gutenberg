import type { Component, ComponentDetail } from './types';

/**
 * Format a component's name, package, and description as markdown.
 *
 * @param component    - The component to format.
 * @param headingLevel - The heading level for the component name.
 * @return Markdown lines.
 */
function formatComponentSummary(
	component: Component,
	headingLevel: number
): string[] {
	const heading = '#'.repeat( headingLevel );
	const lines = [ `${ heading } ${ component.name }` ];

	if ( component.description ) {
		lines.push( '', component.description );
	}

	return lines;
}

/**
 * Format the component list as markdown.
 *
 * @param components - The components to format.
 * @return Formatted markdown.
 */
export function formatComponents( components: Component[] ): string {
	const lines = [ '# WordPress Design System Components' ];

	for ( const component of components ) {
		lines.push( '', ...formatComponentSummary( component, 2 ) );
	}

	return lines.join( '\n' );
}

/**
 * Format a single component's detail as markdown documentation.
 *
 * @param detail - The component detail to format.
 * @return Formatted markdown.
 */
export function formatComponentDetail( detail: ComponentDetail ): string {
	const lines = formatComponentSummary( detail, 1 );

	lines.push( '', `**Package:** \`${ detail.packageName }\`` );

	if ( detail.importStatement ) {
		lines.push(
			'',
			'## Import',
			'',
			'```ts',
			detail.importStatement,
			'```'
		);
	}

	if ( detail.props.length > 0 ) {
		lines.push( '', '## Props', '' );
		for ( const prop of detail.props ) {
			const required = prop.required ? ' **(required)**' : '';
			const defaultNote = prop.defaultValue
				? ` (default: \`${ prop.defaultValue }\`)`
				: '';
			lines.push(
				`### \`${ prop.name }\`: \`${ prop.type }\`${ required }${ defaultNote }`,
				''
			);
			if ( prop.description ) {
				lines.push( prop.description, '' );
			}
		}
	}

	if ( detail.stories.length > 0 ) {
		lines.push( '', '## Examples', '' );
		for ( const story of detail.stories ) {
			lines.push( `### ${ story.name }` );
			if ( story.snippet ) {
				lines.push( '', '```tsx', story.snippet, '```' );
			}
			lines.push( '' );
		}
	}

	return lines.join( '\n' );
}
