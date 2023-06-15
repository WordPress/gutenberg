/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function BackButton() {
	const location = useLocation();
	const history = useHistory();
	const isTemplatePart = location.params.postType === 'wp_template_part';
	const previousTemplateId = location.state?.fromTemplateId;

	if ( ! isTemplatePart || ! previousTemplateId ) {
		return null;
	}

	return (
		<Button
			className="edit-site-visual-editor__back-button"
			icon={ arrowLeft }
			onClick={ () => {
				history.back();
			} }
		>
			{ __( 'Back' ) }
		</Button>
	);
}

export default BackButton;
