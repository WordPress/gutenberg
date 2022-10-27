/**
 * Internal dependencies
 */
import Theme from '../../packages/components/src/theme';

/**
 *  A Storybook decorator to show a div before and after the story to check for unwanted margins.
 */

export const WithTheme = ( Story, context ) => {
	const themes = {
		default: {},
		dark: {
			accent: '#f7c849',
			background: '#1e1e1e',
		},
		modern: {
			accent: '#3858e9',
		},
		sunrise: {
			// This color was chosen intentionally, because for sufficient contrast,
			// the foreground text should be black when this orange is used as a background color.
			accent: '#dd823b',
		},
	};

	return (
		<Theme { ...themes[ context.globals.componentsTheme ] }>
			<Story { ...context } />
		</Theme>
	);
};
