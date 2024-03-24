/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import CreateTemplatePartModal from '../create-template-part-modal';
import useEditedEntityRecord from '../use-edited-entity-record';
import { TEMPLATE_PART_MODALS } from './';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

const { useHistory } = unlock( routerPrivateApis );

function DuplicateModal( { templatePart, onClose, onSuccess } ) {
	const { createSuccessNotice } = useDispatch( noticesStore );

	function handleOnSuccess( newTemplatePart ) {
		createSuccessNotice(
			sprintf(
				// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
				__( '"%s" duplicated.' ),
				templatePart.title
			),
			{
				type: 'snackbar',
				id: 'template-parts-create',
			}
		);

		onSuccess?.( newTemplatePart );
	}

	return (
		<CreateTemplatePartModal
			content={ templatePart.content }
			closeModal={ onClose }
			confirmLabel={ __( 'Duplicate' ) }
			defaultArea={ templatePart.area }
			defaultTitle={ sprintf(
				/* translators: %s: Existing template part title */
				__( '%s (Copy)' ),
				typeof templatePart.title === 'string'
					? templatePart.title
					: templatePart.title.raw
			) }
			modalTitle={ __( 'Duplicate template part' ) }
			onCreate={ handleOnSuccess }
			onError={ onClose }
		/>
	);
}

export default function TemplatePartDuplicateModal() {
	const { record } = useEditedEntityRecord();
	const { categoryType, categoryId } = getQueryArgs( window.location.href );
	const { closeModal } = useDispatch( interfaceStore );
	const history = useHistory();

	const isActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( TEMPLATE_PART_MODALS.duplicate )
	);

	if ( ! isActive ) {
		return null;
	}

	function onSuccess( newTemplatePart ) {
		history.push( {
			postType: TEMPLATE_PART_POST_TYPE,
			postId: newTemplatePart.id,
			categoryType,
			categoryId,
		} );

		closeModal();
	}

	return (
		<DuplicateModal
			onClose={ closeModal }
			onSuccess={ onSuccess }
			templatePart={ record }
		/>
	);
}
