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
import {
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function BackButton() {
	const location = useLocation();
	const history = useHistory();
	const isTemplatePart = location.params.postType === TEMPLATE_PART_POST_TYPE;
	const isNavigationMenu = location.params.postType === NAVIGATION_POST_TYPE;
	const isPattern = location.params.postType === PATTERN_TYPES.user;

	const isFocusMode =
		location.params.focusMode ||
		isTemplatePart ||
		isNavigationMenu ||
		isPattern;

	if ( ! isFocusMode ) {
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
