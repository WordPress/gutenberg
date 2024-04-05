/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Editor from '../editor';
import PagePages from '../page-pages';
import PagePatterns from '../page-patterns';
import PageTemplatesTemplateParts from '../page-templates-template-parts';

import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function useLayoutAreas() {
	const history = useHistory();
	const { params } = useLocation();
	const { postType, postId, path, layout, isCustom, canvas } = params ?? {};

	// Note: Since "sidebar" is not yet supported here,
	// returning undefined from "mobile" means show the sidebar.

	// Regular page
	if ( path === '/page' ) {
		const isListLayout = layout === 'list' || ! layout;
		return {
			key: 'pages-list',
			areas: {
				content: <PagePages />,
				preview: isListLayout && (
					<Editor
						onClick={ () =>
							history.push( {
								path,
								postType: 'page',
								postId,
								canvas: 'edit',
							} )
						}
					/>
				),
				mobile: canvas === 'edit' ? <Editor /> : undefined,
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Regular other post types
	if ( postType && postId ) {
		return {
			key: 'page',
			areas: {
				preview: <Editor />,
				mobile: canvas === 'edit' ? <Editor /> : undefined,
			},
		};
	}

	// Templates
	if ( path === '/wp_template' ) {
		const isListLayout = isCustom !== 'true' && layout === 'list';
		return {
			key: 'templates-list',
			areas: {
				content: (
					<PageTemplatesTemplateParts
						postType={ TEMPLATE_POST_TYPE }
					/>
				),
				preview: isListLayout && <Editor />,
				mobile: (
					<PageTemplatesTemplateParts
						postType={ TEMPLATE_POST_TYPE }
					/>
				),
			},
			widths: {
				content: isListLayout ? 380 : undefined,
			},
		};
	}

	// Template parts
	if ( path === '/wp_template_part/all' ) {
		const isListLayout = isCustom !== 'true' && layout === 'list';
		return {
			key: 'template-parts',
			areas: {
				content: (
					<PageTemplatesTemplateParts
						postType={ TEMPLATE_PART_POST_TYPE }
					/>
				),
				preview: isListLayout && <Editor />,
				mobile: (
					<PageTemplatesTemplateParts
						postType={ TEMPLATE_PART_POST_TYPE }
					/>
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
			key: 'patterns',
			areas: {
				content: <PagePatterns />,
				mobile: <PagePatterns />,
			},
		};
	}

	// Fallback shows the home page preview
	return {
		key: 'default',
		areas: {
			preview: <Editor />,
			mobile: canvas === 'edit' ? <Editor /> : undefined,
		},
	};
}
