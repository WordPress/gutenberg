/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import SidebarGlobalStyles from '../sidebar-global-styles';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const { StyleBookPreview } = unlock( editorPrivateApis );

function MobileGlobalStylesUI() {
	const { query = {} } = useLocation();
	const { canvas } = query;

	if ( canvas === 'edit' ) {
		return <Editor />;
	}

	return <SidebarGlobalStyles />;
}

function StylesPreviewArea() {
	const { path, query } = useLocation();
	const history = useHistory();
	const isStylebook = query.preview === 'stylebook';

	// Get section from URL query params
	const section = query.section ?? '/';
	const onChangeSection = ( updatedSection ) => {
		history.navigate(
			addQueryArgs( path, {
				section: updatedSection,
			} )
		);
	};

	if ( isStylebook ) {
		return (
			<StyleBookPreview
				path={ section }
				onPathChange={ onChangeSection }
			/>
		);
	}

	return <Editor />;
}

export const stylesRoute = {
	name: 'styles',
	path: '/styles',
	areas: {
		content: <SidebarGlobalStyles />,
		sidebar: <SidebarNavigationScreenGlobalStyles backPath="/" />,
		preview: <StylesPreviewArea />,
		mobile: <MobileGlobalStylesUI />,
	},
	widths: {
		content: 380,
	},
};
