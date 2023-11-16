/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	StarterPatternsModal,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function StartPageOptions() {
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const [ isClosed, setIsClosed ] = useState( false );
	const { shouldOpenModal, postType, rootClientId } = useSelect(
		( select ) => {
			const { hasPageContentFocus, getEditedPostContext } =
				select( editSiteStore );
			const context = getEditedPostContext();
			const isEditingPage =
				context?.postType === 'page' &&
				context?.postId &&
				hasPageContentFocus();
			const isWelcomeGuideOpen = select( preferencesStore ).get(
				'core/edit-site',
				'welcomeGuide'
			);
			if ( ! isEditingPage || isWelcomeGuideOpen ) {
				return { shouldOpenModal: false };
			}

			const { __experimentalGetGlobalBlocksByName, getBlock } =
				select( blockEditorStore );
			const [ contentBlockClientId ] =
				__experimentalGetGlobalBlocksByName( 'core/post-content' );
			if ( ! contentBlockClientId ) {
				return { shouldOpenModal: false };
			}

			const contentBlock = getBlock( contentBlockClientId );
			if ( contentBlock?.innerBlocks?.length ) {
				return { shouldOpenModal: false };
			}

			return {
				shouldOpenModal: true,
				postType: context.postType,
				rootClientId: contentBlockClientId,
			};
		},
		[]
	);

	if ( isClosed || ! shouldOpenModal ) {
		return null;
	}

	return (
		<StarterPatternsModal
			postType={ postType }
			rootClientId={ rootClientId }
			onChoosePattern={ ( pattern, blocks ) => {
				setIsClosed( true );
				const selectInsertedBlocks = true;
				replaceInnerBlocks(
					rootClientId,
					blocks,
					selectInsertedBlocks
				);
			} }
			onRequestClose={ () => setIsClosed( true ) }
		/>
	);
}
