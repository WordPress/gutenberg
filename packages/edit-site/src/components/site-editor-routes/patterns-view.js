/**
 * Internal dependencies
 */
import SidebarNavigationScreenPatterns from '../sidebar-navigation-screen-patterns';
import PagePatterns from '../page-patterns';
import { PATTERN_TYPES, TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

export const patternsViewRoute = {
	name: 'patterns-view',
	match: ( params ) => {
		return (
			[ TEMPLATE_PART_POST_TYPE, PATTERN_TYPES.user ].includes(
				params.postType
			) && params.canvas !== 'edit'
		);
	},
	areas: {
		sidebar: <SidebarNavigationScreenPatterns backPath={ {} } />,
		content: <PagePatterns />,
		mobile: <PagePatterns />,
	},
};
