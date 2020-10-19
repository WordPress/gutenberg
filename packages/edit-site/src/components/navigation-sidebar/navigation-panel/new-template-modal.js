/**
 * External dependencies
 */
import { find, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { MenuItem, Modal, NavigableMenu } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TEMPLATES_DEFAULT_DETAILS } from '../../../utils/get-template-info/constants';

export default function NewTemplateModal( { isOpen, onClose } ) {
	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template', {
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
			} ),
		[]
	);
	const { addTemplate } = useDispatch( 'core/edit-site' );

	if ( ! isOpen ) {
		return null;
	}

	const createTemplate = ( slug ) => {
		addTemplate( {
			slug,
			title: slug,
			status: 'publish',
		} );
		onClose();
	};

	return (
		<Modal
			className="edit-site-new-template-modal"
			title={ __( 'New Template' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onClose }
		>
			<NavigableMenu label={ __( 'Select a template:' ) }>
				{ map(
					TEMPLATES_DEFAULT_DETAILS,
					( { title, description }, slug ) => (
						<MenuItem
							disabled={ !! find( templates, { slug } ) }
							info={ description }
							key={ slug }
							onClick={ () => createTemplate( slug ) }
						>
							{ title }
						</MenuItem>
					)
				) }
			</NavigableMenu>
		</Modal>
	);
}
