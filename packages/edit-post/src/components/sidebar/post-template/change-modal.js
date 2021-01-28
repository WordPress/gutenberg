/**
 * External dependencies
 */
import { map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Modal, Spinner } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { ENTER, SPACE } from '@wordpress/keycodes';

function TemplatePreview( { slug } ) {
	const { isResolved, template, postId, postType } = useSelect(
		( select ) => {
			const {
				getCurrentTheme,
				getEntityRecord,
				hasFinishedResolution,
			} = select( coreStore );
			const { getCurrentPostId, getCurrentPostType } = select(
				editorStore
			);
			const theme = getCurrentTheme();
			const templateId = theme ? theme.stylesheet + '//' + slug : null;
			const getEntityArgs = [ 'postType', 'wp_template', templateId ];
			const entityRecord = templateId
				? getEntityRecord( ...getEntityArgs )
				: null;
			const hasResolvedEntity = templateId
				? hasFinishedResolution( 'getEntityRecord', getEntityArgs )
				: false;

			return {
				template: entityRecord,
				isResolved: hasResolvedEntity,
				postId: getCurrentPostId(),
				postType: getCurrentPostType(),
			};
		},
		[ slug ]
	);

	const blocks = useMemo( () => {
		if ( ! template?.content?.raw ) {
			return [];
		}
		return parse( template.content.raw );
	}, [ template ] );

	const defaultBlockContext = useMemo( () => {
		return { postId, postType };
	}, [ postId, postType ] );

	return ! isResolved ? (
		<Spinner />
	) : (
		<BlockPreview blocks={ blocks } context={ defaultBlockContext } />
	);
}

function TemplateItem( { slug, name, isSelected } ) {
	const { editPost } = useDispatch( editorStore );

	const onSelect = () => {
		editPost( {
			template: slug,
		} );
	};

	return (
		<div
			className={ classnames( 'edit-post-template-change-modal__item', {
				'is-selected': isSelected,
				'is-default': ! slug,
			} ) }
			role="button"
			tabIndex={ 0 }
			aria-label={ name }
			onClick={ onSelect }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onSelect();
				}
			} }
		>
			<div className="edit-post-template-change-modal__item-preview">
				{ slug && <TemplatePreview slug={ slug } /> }
			</div>
			<div className="edit-post-template-change-modal__item-title">
				{ name }
			</div>
		</div>
	);
}

function TemplateChangeModal( { onClose } ) {
	const { availableTemplates, selectedTemplate } = useSelect( ( select ) => {
		const { getEditorSettings, getEditedPostAttribute } = select(
			editorStore
		);
		const { availableTemplates: _templates } = getEditorSettings();
		return {
			selectedTemplate: getEditedPostAttribute( 'template' ),
			availableTemplates: _templates,
		};
	}, [] );

	return (
		<Modal
			className="edit-post-post-template-modal"
			title={ __( 'Change Template' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
			isFullScreen
		>
			<div className="edit-post-template-change-modal__items">
				{ map( availableTemplates, ( name, slug ) => {
					return (
						<TemplateItem
							key={ slug }
							slug={ slug }
							name={ name }
							isSelected={
								slug === selectedTemplate ||
								( ! slug && ! selectedTemplate )
							}
						/>
					);
				} ) }
			</div>
		</Modal>
	);
}

export default TemplateChangeModal;
