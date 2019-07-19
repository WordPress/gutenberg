/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';

const options = [
	{ value: 'post-content', label: __( 'Post content' ) },
	{ value: 'template', label: __( 'Template' ) },
];

export default function ViewEditingModePicker() {
	const { post, blocks, settings, viewEditingMode } = useSelect( ( select ) => {
		const {
			getCurrentPost,
			getBlocksForSerialization,
			getEditorSettings,
			getViewEditingMode,
		} = select( 'core/editor' );
		return {
			post: getCurrentPost(),
			blocks: getBlocksForSerialization(),
			settings: getEditorSettings(),
			viewEditingMode: getViewEditingMode(),
		};
	}, [] );
	const { setupEditor, updateViewEditingMode } = useDispatch( 'core/editor' );

	const updateViewEditingModeCallback = useCallback( ( newViewEditingMode ) => {
		updateViewEditingMode( newViewEditingMode );

		let newBlocks = blocks;
		if ( newViewEditingMode === 'post-content' ) { // Leaving template mode.
			const postContentBlock = blocks.find(
				( block ) => block.name === 'core/post-content'
			);
			newBlocks = postContentBlock ? postContentBlock.innerBlocks : [];
		}
		setupEditor(
			post,
			{
				blocks: newBlocks,
			},
			settings.template,
			newViewEditingMode === 'template' && settings.templatePost
		);
	}, [ post, blocks, settings.template, settings.templatePost, viewEditingMode ] );

	return (
		<SelectControl
			label={ __( 'View Editing Mode' ) }
			options={ options }
			value={ viewEditingMode }
			onChange={ updateViewEditingModeCallback }
		/>
	);
}
