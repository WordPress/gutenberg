/**
 * WordPress dependencies
 */
import { Flex, FlexItem, Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';

/**
 * Get patterns that match navigation-overlay template parts.
 *
 * @return {Array} Array of patterns for navigation-overlay.
 */
export function useStartPatterns() {
	const { patterns, postType, area } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { getPatternsByBlockTypes } = select( blockEditorStore );
		const { getEditedEntityRecord } = select( coreStore );

		const _postType = getCurrentPostType();
		const _postId = getCurrentPostId();
		const templatePartRecord = getEditedEntityRecord(
			'postType',
			_postType,
			_postId
		);

		return {
			patterns: getPatternsByBlockTypes(
				'core/template-part/navigation-overlay'
			),
			postType: _postType,
			area: templatePartRecord?.area,
		};
	}, [] );

	return useMemo( () => {
		if (
			! patterns?.length ||
			postType !== TEMPLATE_PART_POST_TYPE ||
			area !== 'navigation-overlay'
		) {
			return [];
		}

		return patterns;
	}, [ patterns, postType, area ] );
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

function StartNavigationOverlayOptionsModal( { onClose } ) {
	const overlayPatterns = useStartPatterns();
	const hasPatterns = overlayPatterns.length > 0;

	if ( ! hasPatterns ) {
		return null;
	}

	return (
		<Modal
			className="editor-start-navigation-overlay-options__modal"
			title={ __( 'Choose a pattern' ) }
			isFullScreen
			onRequestClose={ onClose }
		>
			<div className="editor-start-navigation-overlay-options__modal-content">
				<PatternSelection
					blockPatterns={ overlayPatterns }
					onChoosePattern={ onClose }
				/>
			</div>
			<Flex
				className="editor-start-navigation-overlay-options__modal__actions"
				justify="flex-end"
				expanded={ false }
			>
				<FlexItem>
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ onClose }
					>
						{ __( 'Skip' ) }
					</Button>
				</FlexItem>
			</Flex>
		</Modal>
	);
}

export default function StartNavigationOverlayOptions() {
	const [ isOpen, setIsOpen ] = useState( false );
	const { isEditedPostDirty, isEditedPostEmpty } = useSelect( editorStore );
	const { isModalActive } = useSelect( interfaceStore );
	const { enabled, postId } = useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const currentPostType = getCurrentPostType();
		const _postId = getCurrentPostId();

		// Only enable for navigation-overlay template parts.
		if ( currentPostType !== TEMPLATE_PART_POST_TYPE ) {
			return {
				postId: _postId,
				enabled: false,
			};
		}

		const { getEditedEntityRecord } = select( coreStore );
		const templatePartRecord = getEditedEntityRecord(
			'postType',
			currentPostType,
			_postId
		);

		return {
			postId: _postId,
			enabled: templatePartRecord?.area === 'navigation-overlay',
		};
	}, [] );

	// Note: The `postId` ensures the effect re-runs when template parts are switched without remounting the component.
	useEffect( () => {
		const isFreshTemplatePart =
			! isEditedPostDirty() && isEditedPostEmpty();
		// Prevents immediately opening when features is enabled via preferences modal.
		const isPreferencesModalActive = isModalActive( 'editor/preferences' );
		if ( ! enabled || ! isFreshTemplatePart || isPreferencesModalActive ) {
			return;
		}

		// Open the modal after the initial render for a new template part.
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

	return (
		<StartNavigationOverlayOptionsModal
			onClose={ () => setIsOpen( false ) }
		/>
	);
}
