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
		modern: {
			accent: '#3858e9',
		},
		sunrise: {
			accent: '#dd823b',
		},
	};

	return (
		<Theme { ...themes[ context.globals.componentsTheme ] }>
			<Story { ...context } />
		</Theme>
	);
};
