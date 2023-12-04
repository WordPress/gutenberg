/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function BackButton() {
	const location = useLocation();
	const history = useHistory();
	const isTemplatePart = location.params.postType === TEMPLATE_PART_POST_TYPE;
	const isNavigationMenu = location.params.postType === NAVIGATION_POST_TYPE;
	// Only show the back button when editing a template part or navigation menu.
	const canShowBackButton = isTemplatePart || isNavigationMenu;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const onClickHandler = () => {
		if ( location.state?.fromTemplateId ) {
			history.back();
		} else {
			setCanvasMode( 'view' );
		}
	};

	return canShowBackButton ? (
		<Button
			className="edit-site-visual-editor__back-button"
			icon={ arrowLeft }
			onClick={ onClickHandler }
		>
			{ __( 'Back' ) }
		</Button>
	) : null;
}

export default BackButton;
