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
		darkBg: {
			accent: '#f7c849',
			background: '#1e1e1e',
		},
		lightGrayBg: {
			accent: '#3858e9',
			background: '#f0f0f0',
		},
		modern: {
			accent: '#3858e9',
		},
	};

	return (
		<Theme { ...themes[ context.globals.componentsTheme ] }>
			<Story { ...context } />
		</Theme>
	);
};
