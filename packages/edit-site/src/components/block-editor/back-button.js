/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function BackButton() {
	const location = useLocation();
	const history = useHistory();

	const previousTemplateId = location.state?.fromTemplateId;

	const { isFocusMode } = useSelect( ( select ) => {
		const { isEntityFocusMode } = unlock( select( editSiteStore ) );

		return {
			isFocusMode: isEntityFocusMode(),
		};
	}, [] );

	if ( ! isFocusMode || ! previousTemplateId ) {
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
