import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';
import Editor from '../editor';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import SidebarGlobalStyles from '../sidebar-global-styles';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const { StyleBookPreview, useGlobalStyles } = unlock( editorPrivateApis );

function StyleBookPreviewArea( { siteData } ) {
	const { path, query } = useLocation();
	const history = useHistory();
	const { user: userConfig } = useGlobalStyles();

	// Get section from URL query params
	const section = query.section ?? '/';
	const onChangeSection = ( updatedSection ) => {
		history.navigate(
			addQueryArgs( path, {
				section: updatedSection,
			} )
		);
	};

	return (
		<StyleBookPreview
			path={ section }
			onPathChange={ onChangeSection }
			settings={ siteData.editorSettings }
			// Without userConfig the preview falls back to the static `settings` styles and unsaved global styles edits are not shown.
			userConfig={ userConfig }
		/>
	);
}

function StylesPreviewArea( { siteData } ) {
	const { query } = useLocation();

	if ( query.preview === 'stylebook' ) {
		return <StyleBookPreviewArea siteData={ siteData } />;
	}

	return <Editor />;
}

export const stylesRoute = {
	name: 'styles',
	path: '/styles',
	areas: {
		content: <SidebarGlobalStyles />,
		sidebar: <SidebarNavigationScreenGlobalStyles backPath="/" />,
		preview: ( { siteData } ) => (
			<StylesPreviewArea siteData={ siteData } />
		),
		mobileContent: <SidebarGlobalStyles />,
	},
	widths: {
		content: 380,
	},
};
