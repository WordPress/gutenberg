/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { arrowLeft } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import useTemplateTitle from '../use-template-title';

function getTemplateTypeName( templateType ) {
	switch ( templateType ) {
		case 'wp_template_part':
			return __( 'template part' );
		case 'wp_template':
			return __( 'template' );
		default:
			throw new Error( 'Unknown template type' );
	}
}

function BackButton() {
	const {
		isTemplatePart,
		previousTemplateType,
		previousTemplateId,
	} = useSelect( ( select ) => {
		const {
			getEditedPostType,
			getPreviousEditedPostType,
			getPreviousEditedPostId,
		} = select( editSiteStore );

		return {
			isTemplatePart: getEditedPostType() === 'wp_template_part',
			previousTemplateType: getPreviousEditedPostType(),
			previousTemplateId: getPreviousEditedPostId(),
		};
	}, [] );
	const previousTemplateTitle = useTemplateTitle(
		previousTemplateType,
		previousTemplateId
	);
	const { goBack } = useDispatch( editSiteStore );

	if ( ! isTemplatePart || ! previousTemplateId ) {
		return null;
	}

	return (
		<Button
			className="edit-site-visual-editor__back-button"
			icon={ arrowLeft }
			onClick={ () => {
				goBack();
			} }
		>
			{ sprintf(
				/* translators: Template name. */
				__( 'Back to %s' ),
				previousTemplateTitle,
				getTemplateTypeName( previousTemplateType )
			) }
		</Button>
	);
}

export default BackButton;
