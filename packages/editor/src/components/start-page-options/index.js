/**
 * WordPress dependencies
 */
import { Flex, FlexItem, Modal, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';

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
	const [ showStartPatterns, setShowStartPatterns ] = useState( true );
	const { set: setPreference } = useDispatch( preferencesStore );
	const startPatterns = useStartPatterns();
	const hasStartPattern = startPatterns.length > 0;

	if ( ! hasStartPattern ) {
		return null;
	}

	function handleClose() {
		onClose();
		setPreference( 'core', 'enableChoosePatternModal', showStartPatterns );
	}

	return (
		<Modal
			className="editor-start-page-options__modal"
			title={ __( 'Choose a pattern' ) }
			isFullScreen
			onRequestClose={ handleClose }
		>
			<div className="editor-start-page-options__modal-content">
				<PatternSelection
					blockPatterns={ startPatterns }
					onChoosePattern={ handleClose }
				/>
			</div>
			<Flex
				className="editor-start-page-options__modal__actions"
				justify="flex-start"
				expanded={ false }
			>
				<FlexItem>
					<CheckboxControl
						checked={ showStartPatterns }
						label={ __(
							'Always show starter patterns for new pages'
						) }
						onChange={ ( newValue ) => {
							setShowStartPatterns( newValue );
						} }
					/>
				</FlexItem>
			</Flex>
		</Modal>
	);
}

export default function StartPageOptions() {
	const [ isOpen, setIsOpen ] = useState( false );
	const { isEditedPostDirty, isEditedPostEmpty } = useSelect( editorStore );
	const { isModalActive } = useSelect( interfaceStore );
	const { enabled, postId } = useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const choosePatternModalEnabled = select( preferencesStore ).get(
			'core',
			'enableChoosePatternModal'
		);
		return {
			postId: getCurrentPostId(),
			enabled:
				choosePatternModalEnabled &&
				TEMPLATE_POST_TYPE !== getCurrentPostType(),
		};
	}, [] );

	// Note: The `postId` ensures the effect re-runs when pages are switched without remounting the component.
	// Examples: changing pages in the List View, creating a new page via Command Palette.
	useEffect( () => {
		const isFreshPage = ! isEditedPostDirty() && isEditedPostEmpty();
		// Prevents immediately opening when features is enabled via preferences modal.
		const isPreferencesModalActive = isModalActive( 'editor/preferences' );
		if ( ! enabled || ! isFreshPage || isPreferencesModalActive ) {
			return;
		}

		// Open the modal after the initial render for a new page.
		setIsOpen( true );
	}, [
		enabled,
		postId,
		isEditedPostDirty,
		isEditedPostEmpty,
		isModalActive,
	] );

	if ( ! isOpen ) {
		return null;
	}

	return <StartPageOptionsModal onClose={ () => setIsOpen( false ) } />;
}
