/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import useSiteEditorSettings from '../use-site-editor-settings';
import usePageContentBlocks from './use-page-content-blocks';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

const noop = () => {};

/**
 * The default block editor provider for the site editor. Typically used when
 * the post type is `'wp_template_part'` or `'wp_template'` and allows editing
 * of the template and its nested entities.
 *
 * If the page content focus type is `'hideTemplate'`, the provider will provide
 * a set of page content blocks wrapped in a container that, together,
 * mimic the look and feel of the post editor and
 * allow editing of the page content only.
 *
 * @param {Object}  props
 * @param {string}  props.postType
 * @param {string}  props.postId
 * @param {Element} props.children
 */
export default function DefaultBlockEditorProvider( {
	postType,
	postId,
	children,
} ) {
	const settings = useSiteEditorSettings( postType, postId );

	const { isTemplateHidden } = useSelect( ( select ) => {
		const { getPageContentFocusType, getCanvasMode } = unlock(
			select( editSiteStore )
		);
		return {
			isTemplateHidden:
				getCanvasMode() === 'edit' &&
				getPageContentFocusType() === 'hideTemplate',
			canvasMode: unlock( select( editSiteStore ) ).getCanvasMode(),
		};
	}, [] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType
	);
	const pageContentBlocks = usePageContentBlocks( {
		blocks,
		isPageContentFocused: isTemplateHidden,
		wrapPageContent: true,
	} );

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={
				isTemplateHidden && pageContentBlocks.length
					? pageContentBlocks
					: blocks
			}
			onInput={ isTemplateHidden ? noop : onInput }
			onChange={ isTemplateHidden ? noop : onChange }
			useSubRegistry={ false }
		>
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}
