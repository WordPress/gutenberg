/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelRow, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

function PostTemplate() {
	const {
		template,
		isEditing,
		supportsTemplateMode,
		isResolvingTemplate,
	} = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getCurrentPostType,
			getCurrentPost,
		} = select( editorStore );
		const {
			__experimentalGetTemplateForLink,
			getPostType,
			isResolving,
		} = select( coreStore );
		const { isEditingTemplate } = select( editPostStore );
		const link = getEditedPostAttribute( 'link' );
		const _supportsTemplateMode = select( editorStore ).getEditorSettings()
			.supportsTemplateMode;
		const isViewable =
			getPostType( getCurrentPostType() )?.viewable ?? false;

		return {
			template:
				supportsTemplateMode &&
				isViewable &&
				link &&
				getCurrentPost().status !== 'auto-draft'
					? __experimentalGetTemplateForLink( link )
					: null,
			isEditing: isEditingTemplate(),
			supportsTemplateMode: _supportsTemplateMode,
			isResolvingTemplate: isResolving(
				'__experimentalGetTemplateForLink',
				[ link ]
			),
		};
	}, [] );
	const { __unstableSwitchToEditingMode } = useDispatch( editPostStore );

	if ( ! supportsTemplateMode || isResolvingTemplate ) {
		return null;
	}

	return (
		<PanelRow className="edit-post-post-template">
			<span>{ __( 'Template' ) }</span>
			{ ! isEditing && (
				<span className="edit-post-post-template__value">
					{ !! template &&
						createInterpolateElement(
							sprintf(
								/* translators: 1: Template name. */
								__( '%s (<a>Edit</a>)' ),
								template.slug
							),
							{
								a: (
									<Button
										isLink
										onClick={ () =>
											__unstableSwitchToEditingMode()
										}
									>
										{ __( 'Edit' ) }
									</Button>
								),
							}
						) }
					{ ! template &&
						createInterpolateElement(
							__( 'Default (<create />)' ),
							{
								create: (
									<Button
										isLink
										onClick={ () =>
											__unstableSwitchToEditingMode(
												true
											)
										}
									>
										{ __( 'Create custom template' ) }
									</Button>
								),
							}
						) }
				</span>
			) }
			{ isEditing && (
				<span className="edit-post-post-template__value">
					{ template.slug }
				</span>
			) }
		</PanelRow>
	);
}

export default PostTemplate;
