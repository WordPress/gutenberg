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
	const isPageContentFocused = pageContentFocusType === 'hideTemplate';
	const pageContentBlock = usePageContentBlocks(
		blocks,
		isPageContentFocused
	);
	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={
				isPageContentFocused && pageContentBlock.length
					? pageContentBlock
					: blocks
			}
			onInput={ isPageContentFocused ? noop : onInput }
			onChange={ isPageContentFocused ? noop : onChange }
			useSubRegistry={ false }
		>
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}

const identity = ( x ) => x;
const DISALLOWED_BLOCK_TYPES = [ 'core/query' ];
/**
 * Helper method to iterate through all blocks, recursing into allowed inner blocks.
 * Returns a flattened object of transformed blocks.
 *
 * @param {Array}    blocks    Blocks to flatten.
 * @param {Function} transform Transforming function to be applied to each block. If transform returns `undefined`, the block is skipped.
 *
 * @return {Array} Flattened object.
 */
function flattenBlocks( blocks, transform = identity ) {
	const result = [];
	for ( let i = 0; i < blocks.length; i++ ) {
		if ( DISALLOWED_BLOCK_TYPES.includes( blocks[ i ].name ) ) {
			continue;
		}
		const transformedBlock = transform( blocks[ i ] );
		if ( transformedBlock ) {
			result.push( transformedBlock );
		}
		result.push( ...flattenBlocks( blocks[ i ].innerBlocks, transform ) );
	}

	return result;
}

/**
 * Returns a memoized array of blocks that contain only page content blocks,
 * surrounded by a group block to mimic the post editor.
 *
 * @param {Array}   blocks               Block list.
 * @param {boolean} isPageContentFocused Whether the page content has focus. If `true` return page content blocks. Default `false`.
 *
 * @return {Array} Page content blocks.
 */
function usePageContentBlocks( blocks, isPageContentFocused = false ) {
	return useMemo( () => {
		if ( ! isPageContentFocused || ! blocks || ! blocks.length ) {
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
				flattenBlocks( blocks, ( block ) => {
					if ( PAGE_CONTENT_BLOCK_TYPES.includes( block.name ) ) {
						return createBlock( block.name );
					}
				} )
			),
		];
	}, [ blocks, isPageContentFocused ] );
}
