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
	const { post, blocks, settings } = useSelect( ( select ) => {
		const {
			getCurrentPost,
			getBlocksForSerialization,
			getEditorSettings,
		} = select( 'core/editor' );
		return {
			post: getCurrentPost(),
			blocks: getBlocksForSerialization(),
			settings: getEditorSettings(),
		};
	}, [] );
	const { updateEditorSettings, setupEditor } = useDispatch( 'core/editor' );

	const updateViewEditingMode = useCallback( ( viewEditingMode ) => {
		updateEditorSettings( {
			viewEditingMode,
		} );

		let newBlocks = blocks;
		if ( viewEditingMode === 'post-content' ) { // Leaving template mode.
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
			viewEditingMode === 'template' && settings.templatePost
		);
	}, [ post, blocks, settings ] );

	return (
		<SelectControl
			label={ __( 'View Editing Mode' ) }
			options={ options }
			value={ settings.viewEditingMode }
			onChange={ updateViewEditingMode }
		/>
	);
}
