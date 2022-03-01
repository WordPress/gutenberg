/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useAsyncList } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function TemplateSelection( { onChooseTemplate } ) {
	const { availableTemplates, fetchedTemplates, linkedTemplate } = useSelect(
		( select ) => {
			const {
				getEditorSettings,
				getCurrentPostType,
				getCurrentPost,
			} = select( editorStore );
			const { getEntityRecords } = select( coreStore );

			const currentPostType = getCurrentPostType();
			const currentPostLink = getCurrentPost().link;

			const templateRecords = getEntityRecords(
				'postType',
				'wp_template',
				{
					post_type: currentPostType,
					per_page: -1,
				}
			);

			const linkedTemplateRecords = getEntityRecords(
				'postType',
				'wp_template',
				{
					'find-template': currentPostLink,
					per_page: 1,
				}
			);

			return {
				availableTemplates: getEditorSettings().availableTemplates,
				fetchedTemplates: templateRecords,
				linkedTemplate:
					linkedTemplateRecords && linkedTemplateRecords[ 0 ],
			};
		},
		[]
	);
	const templatesAsPatterns = useMemo( () => {
		let templates = ( fetchedTemplates || [] ).filter(
			( { slug } ) => !! availableTemplates[ slug ]
		);
		if (
			linkedTemplate &&
			! templates.some( ( { id } ) => id === linkedTemplate.id )
		) {
			templates = [ linkedTemplate, ...templates ];
		}
		return templates.map( ( template ) => ( {
			name: template.id,
			title: template.title.rendered,
			blocks: parse( template.content.raw ),
			template,
		} ) );
	}, [ availableTemplates, fetchedTemplates, linkedTemplate ] );
	const shownPatterns = useAsyncList( templatesAsPatterns );
	const { editPost } = useDispatch( editorStore );
	useEffect( () => {
		if ( availableTemplates.length <= 1 ) {
			onChooseTemplate();
		}
	}, [ availableTemplates.length ] );
	return (
		<BlockPatternsList
			blockPatterns={ templatesAsPatterns }
			shownPatterns={ shownPatterns }
			onClickPattern={ ( { template } ) => {
				if ( template.id !== linkedTemplate.id ) {
					editPost( { template: template.slug } );
				}
				onChooseTemplate();
			} }
		/>
	);
}

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
	useEffect( () => {
		if ( blockPatterns.length <= 1 ) {
			onChoosePattern();
		}
	}, [ blockPatterns.length ] );
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
	TEMPLATE: 'TEMPLATE',
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
			const {
				getCurrentPostType,
				getEditedPostContent,
				getEditedPostAttribute,
				isEditedPostSaveable,
			} = select( editorStore );
			const { isEditingTemplate, isFeatureActive } = select(
				editPostStore
			);
			return (
				getCurrentPostType() === 'page' &&
				! isEditedPostSaveable() &&
				'' === getEditedPostContent() &&
				'' === getEditedPostAttribute( 'template' ) &&
				! isEditingTemplate() &&
				! isFeatureActive( 'welcomeGuide' )
			);
		},
		[ modalState ]
	);

	useEffect( () => {
		if ( shouldOpenModel ) {
			setModalState( START_PAGE_MODAL_STATES.TEMPLATE );
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
			title={
				modalState === START_PAGE_MODAL_STATES.TEMPLATE
					? __( 'Choose a template' )
					: __( 'Choose a pattern' )
			}
			closeLabel={ __( 'Cancel' ) }
			onRequestClose={ () => {
				switch ( modalState ) {
					case START_PAGE_MODAL_STATES.TEMPLATE:
						setModalState( START_PAGE_MODAL_STATES.PATTERN );
						return;
					case START_PAGE_MODAL_STATES.PATTERN:
						setModalState( START_PAGE_MODAL_STATES.CLOSED );
				}
			} }
		>
			<div className="edit-post-start-page-options__modal-content">
				{ modalState === START_PAGE_MODAL_STATES.TEMPLATE && (
					<TemplateSelection
						onChooseTemplate={ () => {
							setModalState( START_PAGE_MODAL_STATES.PATTERN );
						} }
					/>
				) }
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
