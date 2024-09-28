/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useAsyncList } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

export function useStartPatterns() {
	// A pattern is a start pattern if it includes 'core/post-content' in its blockTypes,
	// and it has no postTypes declared and the current post type is page or if
	// the current post type is part of the postTypes declared.
	const { blockPatternsWithPostContentBlockType, postType } = useSelect(
		( select ) => {
			const { getPatternsByBlockTypes, getBlocksByName } =
				select( blockEditorStore );
			const { getCurrentPostType, getRenderingMode } =
				select( editorStore );
			const rootClientId =
				getRenderingMode() === 'post-only'
					? ''
					: getBlocksByName( 'core/post-content' )?.[ 0 ];
			return {
				blockPatternsWithPostContentBlockType: getPatternsByBlockTypes(
					'core/post-content',
					rootClientId
				),
				postType: getCurrentPostType(),
			};
		},
		[]
	);

	return useMemo( () => {
		if ( ! blockPatternsWithPostContentBlockType?.length ) {
			return [];
		}

		/*
		 * Filter patterns without postTypes declared if the current postType is page
		 * or patterns that declare the current postType in its post type array.
		 */
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
	const { editEntityRecord } = useDispatch( coreStore );
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );

		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );
	return (
		<BlockPatternsList
			blockPatterns={ blockPatterns }
			shownPatterns={ shownBlockPatterns }
			onClickPattern={ ( _pattern, blocks ) => {
				editEntityRecord( 'postType', postType, postId, {
					blocks,
					content: ( { blocks: blocksForSerialization = [] } ) =>
						__unstableSerializeAndClean( blocksForSerialization ),
				} );
				onChoosePattern();
			} }
		/>
	);
}

function StartPageOptionsModal( { onClose } ) {
	const startPatterns = useStartPatterns();
	const hasStartPattern = startPatterns.length > 0;

	if ( ! hasStartPattern ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Choose a pattern' ) }
			isFullScreen
			onRequestClose={ onClose }
		>
			<div className="editor-start-page-options__modal-content">
				<PatternSelection
					blockPatterns={ startPatterns }
					onChoosePattern={ onClose }
				/>
			</div>
		</Modal>
	);
}

export default function StartPageOptions() {
	const [ isClosed, setIsClosed ] = useState( false );
	const shouldEnableModal = useSelect( ( select ) => {
		const { isEditedPostDirty, isEditedPostEmpty, getCurrentPostType } =
			select( editorStore );
		const preferencesModalActive =
			select( interfaceStore ).isModalActive( 'editor/preferences' );
		const choosePatternModalEnabled = select( preferencesStore ).get(
			'core',
			'enableChoosePatternModal'
		);
		return (
			choosePatternModalEnabled &&
			! preferencesModalActive &&
			! isEditedPostDirty() &&
			isEditedPostEmpty() &&
			TEMPLATE_POST_TYPE !== getCurrentPostType()
		);
	}, [] );

	if ( ! shouldEnableModal || isClosed ) {
		return null;
	}

	return <StartPageOptionsModal onClose={ () => setIsClosed( true ) } />;
}
