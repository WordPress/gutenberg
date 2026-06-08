/**
 * Internal dependencies
 */
import Editor from '../editor';
import SidebarNavigationScreenPatterns from '../sidebar-navigation-screen-patterns';
import { isClassicThemeWithStyleBookSupport } from './utils';

export const patternItemRoute = {
	name: 'pattern-item',
	path: '/wp_block/:postId',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			const backPath =
				isBlockTheme || isClassicThemeWithStyleBookSupport( siteData )
					? '/'
					: undefined;
			return <SidebarNavigationScreenPatterns backPath={ backPath } />;
		},
		// Also rendered on mobile, where this route is only reached at canvas=edit.
		preview: <Editor />,
	},
};
