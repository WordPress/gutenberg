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

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

const noop = () => {};

export default function DefaultBlockEditorProvider( {
	contentOnly,
	children,
} ) {
	const settings = useSiteEditorSettings();

	const { templateType } = useSelect( ( select ) => {
		const { getEditedPostType } = unlock( select( editSiteStore ) );

		return {
			templateType: getEditedPostType(),
		};
	}, [] );

	const [ entityBlocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);

	const contentOnlyBlocks = useMemo( () => {
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
				[
					createBlock( 'core/post-title' ),
					createBlock( 'core/post-content' ),
				]
			),
		];
	}, [] );

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={ contentOnly ? contentOnlyBlocks : entityBlocks }
			onInput={ contentOnly ? noop : onInput }
			onChange={ contentOnly ? noop : onChange }
			useSubRegistry={ false }
		>
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}
