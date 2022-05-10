/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
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

function PatternSelection( { onChoosePattern } ) {
	const { blockPatterns } = useSelect( ( select ) => {
		const { __experimentalGetPatternsByBlockTypes } = select(
			blockEditorStore
		);
		return {
			blockPatterns: __experimentalGetPatternsByBlockTypes(
				'core/post-content'
			),
		};
	}, [] );
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

const START_PAGE_MODAL_STATES = {
	INITIAL: 'INITIAL',
	PATTERN: 'PATTERN',
	CLOSED: 'CLOSED',
};

export default function StartPageOptions() {
	const [ modalState, setModalState ] = useState(
		START_PAGE_MODAL_STATES.INITIAL
	);
	const shouldOpenModel = useSelect(
		( select ) => {
			if ( modalState !== START_PAGE_MODAL_STATES.INITIAL ) {
				return false;
			}
			const { __experimentalGetPatternsByBlockTypes } = select(
				blockEditorStore
			);
			const {
				getCurrentPostType,
				getEditedPostContent,
				isEditedPostSaveable,
			} = select( editorStore );
			const { isEditingTemplate, isFeatureActive } = select(
				editPostStore
			);
			return (
				getCurrentPostType() === 'page' &&
				! isEditedPostSaveable() &&
				'' === getEditedPostContent() &&
				! isEditingTemplate() &&
				! isFeatureActive( 'welcomeGuide' ) &&
				__experimentalGetPatternsByBlockTypes( 'core/post-content' )
					.length >= 1
			);
		},
		[ modalState ]
	);

	useEffect( () => {
		if ( shouldOpenModel ) {
			setModalState( START_PAGE_MODAL_STATES.PATTERN );
		}
	}, [ shouldOpenModel ] );

	if (
		modalState === START_PAGE_MODAL_STATES.INITIAL ||
		modalState === START_PAGE_MODAL_STATES.CLOSED
	) {
		return null;
	}
	return (
		<Modal
			className="edit-post-start-page-options__modal"
			title={ __( 'Choose a pattern' ) }
			closeLabel={ __( 'Cancel' ) }
			onRequestClose={ () => {
				setModalState( START_PAGE_MODAL_STATES.CLOSED );
			} }
		>
			<div className="edit-post-start-page-options__modal-content">
				{ modalState === START_PAGE_MODAL_STATES.PATTERN && (
					<PatternSelection
						onChoosePattern={ () => {
							setModalState( START_PAGE_MODAL_STATES.CLOSED );
						} }
					/>
				) }
			</div>
		</Modal>
	);
}
