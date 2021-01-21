/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { ENTER, SPACE } from '@wordpress/keycodes';

function TemplateItem( { slug, name } ) {
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

	const { editPost } = useDispatch( editorStore );

	const blocks = useMemo( () => {
		if ( ! template?.content?.raw ) {
			return [];
		}
		return parse( template.content.raw );
	}, [ template ] );

	const defaultBlockContext = useMemo( () => {
		return { postId, postType };
	}, [ postId, postType ] );

	const onSelect = () => {
		editPost( {
			template: slug,
		} );
	};

	return (
		isResolved && (
			<div
				className="edit-post-template-change-modal__item"
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
				<BlockPreview
					blocks={ blocks }
					context={ defaultBlockContext }
				/>
				<div className="edit-post-template-change-modal__item-title">
					{ name }
				</div>
			</div>
		)
	);
}

function TemplateChangeModal( { onClose } ) {
	const { availableTemplates } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { availableTemplates: _templates } = getEditorSettings();
		return {
			availableTemplates: _templates,
		};
	}, [] );

	return (
		<Modal
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
						/>
					);
				} ) }
			</div>
		</Modal>
	);
}

export default TemplateChangeModal;
