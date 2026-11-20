import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import Editor from '../editor';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenGlobalStyles from '../sidebar-navigation-screen-global-styles';
import SidebarGlobalStyles from '../sidebar-global-styles';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const { StyleBookPreview, useGlobalStyles } = unlock( editorPrivateApis );

// Rendered instead of the plain style book while a revision is selected in the
// revisions screen, so the style book previews that revision's styles rather
// than the current ones. A separate component so the revisions (and authors)
// are only fetched once a revision is actually selected.
function RevisionStyleBookPreview( {
	revisionId,
	section,
	onChangeSection,
	settings,
} ) {
	const { revisions, isLoading } = useGlobalStylesRevisions();

	if ( isLoading ) {
		return null;
	}

	const selectedRevision = revisions.find(
		( revision ) => String( revision.id ) === revisionId
	);

	return (
		<StyleBookPreview
			path={ section }
			onPathChange={ onChangeSection }
			settings={ settings }
			userConfig={ selectedRevision }
		/>
	);
}

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

	const revisionId = section.match( /^\/revisions\/(.+)$/ )?.[ 1 ];
	if ( revisionId ) {
		return (
			<RevisionStyleBookPreview
				revisionId={ revisionId }
				section={ section }
				onChangeSection={ onChangeSection }
				settings={ siteData.editorSettings }
			/>
		);
	}

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

	return <Editor renderingMode="template-locked" />;
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
