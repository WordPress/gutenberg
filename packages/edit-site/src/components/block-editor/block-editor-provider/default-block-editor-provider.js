/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import useSiteEditorSettings from '../use-site-editor-settings';
import { PAGE_CONTENT_BLOCK_TYPES } from '../../page-content-focus-manager/constants';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

const noop = () => {};

/**
 * The default block editor provider for the site editor. Typically used when
 * the post type is `'wp_template_part'` or `'wp_template'` and allows editing
 * of the template and its nested entities.
 *
 * If the page content focus type is `'hideTemplate'`, the provider will provide
 * a set of "ghost" blocks that mimick the look and feel of the post editor and
 * allow editing of the page content only.
 *
 * @param {Object}    props
 * @param {WPElement} props.children
 */
export default function DefaultBlockEditorProvider( { children } ) {
	const settings = useSiteEditorSettings();

	const { templateType, pageContentFocusType } = useSelect( ( select ) => {
		const { getEditedPostType, getPageContentFocusType } =
			select( editSiteStore );

		return {
			templateType: getEditedPostType(),
			pageContentFocusType: getPageContentFocusType(),
		};
	}, [] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	const pageGhostBlocks = usePageContentBlocks( blocks );
	const isTemplateHidden = pageContentFocusType === 'hideTemplate';

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={ isTemplateHidden ? pageGhostBlocks : blocks }
			onInput={ isTemplateHidden ? noop : onInput }
			onChange={ isTemplateHidden ? noop : onChange }
			useSubRegistry={ false }
		>
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}

/**
 * Helper method to iterate through all blocks, recursing into inner blocks.
 * Returns a flattened object.
 *
 * @param {Array} blocks Blocks to flatten.
 *
 * @return {Array} Flattened object.
 */
function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );
		result.push( ...flattenBlocks( block.innerBlocks ) );
	} );

	return result;
}

/**
 * Returns a memoized array of blocks that contain only page content blocks,
 * surrounded by a group block to mimic the post editor.
 *
 * @param {Array} blocks Block list.
 *
 * @return {Array} Flattened object.
 */
function usePageContentBlocks( blocks ) {
	return useMemo( () => {
		if ( ! blocks || ! blocks.length ) {
			return [];
		}
		return [
			createBlock(
				'core/group',
				{
					layout: { type: 'constrained' },
					style: {
						spacing: {
							margin: {
								top: '4em', // Mimics the post editor.
							},
						},
					},
				},
				flattenBlocks( blocks ).filter( ( block ) =>
					PAGE_CONTENT_BLOCK_TYPES.includes( block.name )
				)
			),
		];
	}, [ blocks ] );
}
