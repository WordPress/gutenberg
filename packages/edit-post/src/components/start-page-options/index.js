/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useAsyncList } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function useStartPatterns() {
	// A pattern is a start pattern if it includes 'core/post-content' in its blockTypes,
	// and it has no postTypes declared and the current post type is page or if
	// the current post type is part of the postTypes declared.
	const { blockPatternsWithPostContentBlockType, postType } = useSelect(
		( select ) => {
			const { getPatternsByBlockTypes } = select( blockEditorStore );
			const { getCurrentPostType } = select( editorStore );
			return {
				blockPatternsWithPostContentBlockType:
					getPatternsByBlockTypes( 'core/post-content' ),
				postType: getCurrentPostType(),
			};
		},
		[]
	);

	return useMemo( () => {
		// filter patterns without postTypes declared if the current postType is page
		// or patterns that declare the current postType in its post type array.
		return blockPatternsWithPostContentBlockType.filter( ( pattern ) => {
			return (
				( postType === 'page' && ! pattern.postTypes ) ||
				( Array.isArray( pattern.postTypes ) &&
					pattern.postTypes.includes( postType ) )
			);
		} );
	}, [ postType, blockPatternsWithPostContentBlockType ] );
}

function PatternSelection( { blockPatterns, onChoosePattern } ) {
	const shownBlockPatterns = useAsyncList( blockPatterns );
	const { resetEditorBlocks } = useDispatch( editorStore );
	return (
		<BlockPatternsList
			blockPatterns={ blockPatterns }
			shownPatterns={ shownBlockPatterns }
			onClickPattern={ ( _pattern, blocks ) => {
				resetEditorBlocks( blocks );
				onChoosePattern();
			} }
		/>
	);
}

function StartPageOptionsModal() {
	const [ modalState, setModalState ] = useState( 'initial' );
	const startPatterns = useStartPatterns();
	const hasStartPattern = startPatterns.length > 0;
	const shouldOpenModal = hasStartPattern && modalState === 'initial';

	useEffect( () => {
		if ( shouldOpenModal ) {
			setModalState( 'open' );
		}
	}, [ shouldOpenModal ] );

	if ( modalState !== 'open' ) {
		return null;
	}

	return (
		<Modal
			className="edit-post-start-page-options__modal"
			title={ __( 'Choose a pattern' ) }
			isFullScreen
			onRequestClose={ () => setModalState( 'closed' ) }
		>
			<div className="edit-post-start-page-options__modal-content">
				<PatternSelection
					blockPatterns={ startPatterns }
					onChoosePattern={ () => setModalState( 'closed' ) }
				/>
			</div>
		</Modal>
	);
}

export default function StartPageOptions() {
	const shouldEnableModal = useSelect( ( select ) => {
		const { getEditedPostContent, isEditedPostSaveable } =
			select( editorStore );
		const { isEditingTemplate, isFeatureActive } = select( editPostStore );
		return (
			! isEditedPostSaveable() &&
			'' === getEditedPostContent() &&
			! isEditingTemplate() &&
			! isFeatureActive( 'welcomeGuide' )
		);
	}, [] );

	if ( ! shouldEnableModal ) {
		return null;
	}

	return <StartPageOptionsModal />;
}
