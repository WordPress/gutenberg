/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useIsSiteEditorLoading } from './hooks';
import Editor from '../editor';
import DataviewsPatterns from '../page-patterns/dataviews-patterns';
import PagePages from '../page-pages';
import PagePatterns from '../page-patterns';
import PageSingle from '../page-pages/page-single';
import PageTemplateParts from '../page-template-parts';
import PageTemplates from '../page-templates';

const { useLocation } = unlock( routerPrivateApis );

export default function useLayoutAreas() {
	const isSiteEditorLoading = useIsSiteEditorLoading();
	const { params } = useLocation();
	const { postType, postId, path, layout, isCustom } = params ?? {};

	// Regular page
	if ( path === '/page' ) {
		const isListLayout =
			isCustom !== 'true' && ( ! layout || layout === 'list' );
		return {
			areas: {
				content: window.__experimentalAdminViews ? (
					<PagePages />
				) : undefined,
				preview: ( isListLayout ||
					! window.__experimentalAdminViews ) && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
			},
			widths: {
				content:
					window.__experimentalAdminViews && isListLayout
						? 380
						: undefined,
			},
		};
	}

	// Regular other post types
	if ( postType && postId ) {
		return {
			areas: {
				preview: <Editor isLoading={ isSiteEditorLoading } />,
				content: window.__experimentalAdminViews ? (
					<PageSingle />
				) : undefined,
			},
			widths: {
				content: 380,
			},
		};
	}

	// Templates
	if (
		path === '/wp_template/all' ||
		( path === '/wp_template' && window?.__experimentalAdminViews )
	) {
		const isListLayout =
			isCustom !== 'true' && ( ! layout || layout === 'list' );
		return {
			areas: {
				content: <PageTemplates />,
				preview: isListLayout && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Template parts
	if ( path === '/wp_template_part/all' ) {
		return {
			areas: {
				content: <PageTemplateParts />,
			},
		};
	}

	// Patterns
	if ( path === '/patterns' ) {
		return {
			areas: {
				content: window?.__experimentalAdminViews ? (
					<DataviewsPatterns />
				) : (
					<PagePatterns />
				),
			},
		};
	}

	// Fallback shows the home page preview
	return {
		areas: { preview: <Editor isLoading={ isSiteEditorLoading } /> },
	};
}
