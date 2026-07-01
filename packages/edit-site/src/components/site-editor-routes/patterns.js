/**
 * Internal dependencies
 */
import SidebarNavigationScreenPatterns from '../sidebar-navigation-screen-patterns';
import PagePatterns from '../page-patterns';
import { isClassicThemeWithStyleBookSupport } from './utils';

export const patternsRoute = {
	name: 'patterns',
	path: '/pattern',
	areas: {
		sidebar( { siteData } ) {
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			const backPath =
				isBlockTheme || isClassicThemeWithStyleBookSupport( siteData )
					? '/'
					: undefined;
			return <SidebarNavigationScreenPatterns backPath={ backPath } />;
		},
		content: <PagePatterns />,
		mobileSidebar( { siteData, query } ) {
			if ( query.categoryId ) {
				return undefined;
			}
			const isBlockTheme = siteData.currentTheme?.is_block_theme;
			const backPath =
				isBlockTheme || isClassicThemeWithStyleBookSupport( siteData )
					? '/'
					: undefined;
			return <SidebarNavigationScreenPatterns backPath={ backPath } />;
		},
		mobileContent( { query } ) {
			return query.categoryId ? <PagePatterns /> : undefined;
		},
	},
};
