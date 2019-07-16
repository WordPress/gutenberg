/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { IconButton } from '@wordpress/components';

export default function ToggleEditTemplatePost() {
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
	return (
		<IconButton
			icon="search"
			label={ settings.editTemplatePost ? __( 'Edit Post' ) : __( 'Edit Template' ) }
			onClick={ useCallback( () => {
				const newEditTemplatePost = ! settings.editTemplatePost;
				updateEditorSettings( {
					editTemplatePost: newEditTemplatePost,
				} );

				let newBlocks = blocks;
				if ( ! newEditTemplatePost ) { // Leaving template mode.
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
					newEditTemplatePost && settings.templatePost
				);
			}, [ post, blocks, settings ] ) }
		/>
	);
}
