/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { StarterPatternsModal } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function StartPageOptions() {
	const [ isClosed, setIsClosed ] = useState( false );
	const { resetEditorBlocks } = useDispatch( editorStore );
	const { shouldEnableModal, postType } = useSelect( ( select ) => {
		const { isCleanNewPost, getCurrentPostType } = select( editorStore );
		const { isEditingTemplate, isFeatureActive } = select( editPostStore );

		return {
			shouldEnableModal:
				! isEditingTemplate() &&
				! isFeatureActive( 'welcomeGuide' ) &&
				isCleanNewPost(),
			postType: getCurrentPostType(),
		};
	}, [] );

	if ( ! shouldEnableModal || isClosed ) {
		return null;
	}

	return (
		<StarterPatternsModal
			postType={ postType }
			onChoosePattern={ ( pattern, blocks ) => {
				resetEditorBlocks( blocks );
				setIsClosed( true );
			} }
			onRequestClose={ () => setIsClosed( true ) }
		/>
	);
}
