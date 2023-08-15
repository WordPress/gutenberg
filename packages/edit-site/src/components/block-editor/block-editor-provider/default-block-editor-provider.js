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

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

const noop = () => {};

export default function DefaultBlockEditorProvider( { children } ) {
	const settings = useSiteEditorSettings();

	const { templateType, pageContentFocusMode } = useSelect( ( select ) => {
		const { getEditedPostType, getPageContentFocusMode } =
			select( editSiteStore );

		return {
			templateType: getEditedPostType(),
			pageContentFocusMode: getPageContentFocusMode(),
		};
	}, [] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);

	const pageBlocks = usePageBlocks();

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={
				pageContentFocusMode === 'withoutTemplate' ? pageBlocks : blocks
			}
			onInput={
				pageContentFocusMode === 'withoutTemplate' ? noop : onInput
			}
			onChange={
				pageContentFocusMode === 'withoutTemplate' ? noop : onChange
			}
			useSubRegistry={ false }
		>
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}

function usePageBlocks() {
	const pageBlockNames = useSelect( ( select ) => {
		const { __experimentalGetGlobalBlocksByName, getBlockNamesByClientId } =
			select( blockEditorStore );
		return getBlockNamesByClientId(
			__experimentalGetGlobalBlocksByName( [
				'core/post-title',
				'core/post-featured-image',
				'core/post-content',
			] )
		);
	}, [] );

	return useMemo( () => {
		return [
			createBlock(
				'core/group',
				{
					layout: { type: 'constrained' },
					style: {
						spacing: {
							margin: {
								top: '4em',
							},
						},
					},
				},
				pageBlockNames.map( ( name ) => createBlock( name ) )
			),
		];
	}, [ pageBlockNames ] );
}
