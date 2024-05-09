/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

export default function StartPageOptions() {
	const [ isClosed, setIsClosed ] = useState( false );
	const { shouldEnableStartPage, postType, postId } = useSelect(
		( select ) => {
			const {
				isEditedPostDirty,
				isEditedPostEmpty,
				getCurrentPostType,
				getCurrentPostId,
			} = select( editorStore );
			const _postType = getCurrentPostType();

			return {
				shouldEnableStartPage:
					! isEditedPostDirty() &&
					isEditedPostEmpty() &&
					TEMPLATE_POST_TYPE !== _postType,
				postType: _postType,
				postId: getCurrentPostId(),
			};
		},
		[]
	);

	const { setIsInserterOpened } = useDispatch( editorStore );
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );

	useEffect( () => {
		// Should reset the start page state when navigating to a new page/post.
		setIsClosed( false );
	}, [ postType, postId ] );

	// A pattern is a start pattern if it includes 'core/post-content' in its
	// blockTypes, and it has no postTypes declared and the current post type is
	// page or if the current post type is part of the postTypes declared.
	const hasStarterPatterns = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getPatternsByBlockTypes(
				'core/post-content'
			).length
	);

	const showInserterOnNewPage =
		shouldEnableStartPage && ! isClosed && hasStarterPatterns;
	useEffect( () => {
		if ( showInserterOnNewPage ) {
			setIsInserterOpened( {
				tab: 'patterns',
				category: 'core/content',
			} );
			__unstableSetEditorMode( 'zoom-out' );
		}
	}, [
		showInserterOnNewPage,
		setIsInserterOpened,
		__unstableSetEditorMode,
	] );
	return null;
}
