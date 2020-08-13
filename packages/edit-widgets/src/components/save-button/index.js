/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */

function SaveButton() {
	const { hasEditedWidgetAreaIds, isSaving } = useSelect( ( select ) => {
		const { getEditedWidgetAreas, isSavingWidgetAreas } = select(
			'core/edit-widgets'
		);

		return {
			hasEditedWidgetAreaIds: getEditedWidgetAreas()?.length > 0,
			isSaving: isSavingWidgetAreas(),
		};
	}, [] );
	const { saveEditedWidgetAreas } = useDispatch( 'core/edit-widgets' );

	return (
		<Button
			isPrimary
			isBusy={ isSaving }
			aria-disabled={ isSaving }
			onClick={ isSaving ? undefined : saveEditedWidgetAreas }
			disabled={ ! hasEditedWidgetAreaIds }
		>
			{ __( 'Update' ) }
		</Button>
	);
}

export default SaveButton;
