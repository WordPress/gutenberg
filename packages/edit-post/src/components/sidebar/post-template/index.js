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

export function PostTemplate() {
	const { template, isEditingTemplate } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { __experimentalGetTemplateForLink } = select( coreStore );
		const { isFeatureActive } = select( editPostStore );
		const link = getEditedPostAttribute( 'link' );
		return {
			template: link ? __experimentalGetTemplateForLink( link ) : null,
			isEditingTemplate: isFeatureActive( 'templateZoomOut' ),
		};
	}, [] );
	const { toggleFeature } = useDispatch( editPostStore );

	if ( ! template ) {
		return null;
	}

	return (
		<PanelRow className="edit-post-post-template">
			<span>{ __( 'Template' ) }</span>
			{ ! isEditingTemplate && (
				<span>
					{ createInterpolateElement(
						sprintf(
							/* translators: 1: Template name. */
							__( '%s (<a>Edit</a>)' ),
							template.post_title
						),
						{
							a: (
								<Button
									isLink
									onClick={ () => {
										toggleFeature( 'templateZoomOut' );
									} }
								>
									{ __( 'Edit' ) }
								</Button>
							),
						}
					) }
				</span>
			) }
			{ isEditingTemplate && <span>{ template.post_title }</span> }
		</PanelRow>
	);
}

export default PostTemplate;
