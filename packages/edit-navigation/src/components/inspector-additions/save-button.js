/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../../store';

const saveText = __( 'Save' );
const unsavedIndicator = '\t•';

export default function SaveButton( { navigationPost, isDisabled } ) {
	const { saveNavigationPost } = useDispatch( editNavigationStore );
	const buttonText = isDisabled
		? saveText
		: unsavedIndicator + ' ' + saveText;

	return (
		<Button
			isDisabled={ isDisabled }
			className="edit-navigation-toolbar__save-button"
			isPrimary
			onClick={ () => {
				saveNavigationPost( navigationPost );
			} }
			disabled={ ! navigationPost }
		>
			{ buttonText }
		</Button>
	);
}
