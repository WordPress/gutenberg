/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import GlobalStylesUIWrapper from '../sidebar-global-styles-wrapper';
import { StyleBookPreview } from '../style-book';

const { useLocation } = unlock( routerPrivateApis );

function MobileGlobalStylesUI() {
	const { query = {} } = useLocation();
	const { canvas } = query;

	if ( canvas === 'edit' ) {
		return <Editor />;
	}

	return <GlobalStylesUIWrapper />;
}

export const stylesRoute = {
	name: 'styles',
	path: '/styles',
	areas: {
		content: <GlobalStylesUIWrapper />,
		sidebar: <SidebarNavigationScreenGlobalStyles backPath="/" />,
		preview( { query } ) {
			const isStylebook = query.preview === 'stylebook';
			return isStylebook ? <StyleBookPreview /> : <Editor />;
		},
		mobile: <MobileGlobalStylesUI />,
	},
	widths: {
		content: 380,
	},
};
