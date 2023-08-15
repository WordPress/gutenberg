/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
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

	const pageGhostBlocks = usePageGhostBlocks();

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);

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

function usePageGhostBlocks() {
	const pageContentBlockNames = useSelect( ( select ) => {
		const { __experimentalGetGlobalBlocksByName, getBlockNamesByClientId } =
			select( blockEditorStore );
		// Show only the content blocks that appear in the page's template, and
		// in the same order that they appear in the template.
		return getBlockNamesByClientId(
			__experimentalGetGlobalBlocksByName( PAGE_CONTENT_BLOCK_TYPES )
		);
	}, [] );

	const ghostBlocks = useMemo( () => {
		return [
			createBlock(
				'core/group',
				{
					layout: { type: 'constrained' },
					style: {
						spacing: {
							margin: {
								top: '4em', // Mimicks the post editor.
							},
						},
					},
				},
				pageContentBlockNames.map( ( name ) => createBlock( name ) )
			),
		];
	}, [ pageContentBlockNames ] );

	return ghostBlocks;
}
