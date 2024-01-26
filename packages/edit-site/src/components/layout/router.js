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
import PagePages from '../page-pages';
import PagePatterns from '../page-patterns';
import PageTemplatesTemplateParts from '../page-templates-template-parts';

import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';

const { useLocation } = unlock( routerPrivateApis );

export default function useLayoutAreas() {
	const isSiteEditorLoading = useIsSiteEditorLoading();
	const { params } = useLocation();
	const { postType, postId, path, layout, isCustom } = params ?? {};
	// Regular page
	if ( path === '/page' ) {
		return {
			areas: {
				content: undefined,
				preview: <Editor isLoading={ isSiteEditorLoading } />,
			},
			widths: {
				content: undefined,
			},
		};
	}

	// List layout is still experimental.
	// Extracted it here out of the conditionals so it doesn't unintentionally becomes stable.
	const isListLayout =
		isCustom !== 'true' &&
		layout === 'list' &&
		window?.__experimentalAdminViews;

	if ( path === '/pages' ) {
		return {
			areas: {
				content: <PagePages />,
				preview: isListLayout && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Regular other post types
	if ( postType && postId ) {
		return {
			areas: {
				preview: <Editor isLoading={ isSiteEditorLoading } />,
			},
		};
	}

	// Templates
	if ( path === '/wp_template/all' ) {
		return {
			areas: {
				content: (
					<PageTemplatesTemplateParts
						postType={ TEMPLATE_POST_TYPE }
					/>
				),
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
				content: (
					<PageTemplatesTemplateParts
						postType={ TEMPLATE_PART_POST_TYPE }
					/>
				),
				preview: isListLayout && (
					<Editor isLoading={ isSiteEditorLoading } />
				),
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Patterns
	if ( path === '/patterns' ) {
		return {
			areas: {
				content: <PagePatterns />,
			},
		};
	}

	// Fallback shows the home page preview
	return {
		areas: { preview: <Editor isLoading={ isSiteEditorLoading } /> },
	};
}
