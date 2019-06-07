/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';

function SaveButton() {
	const [ isSaving, setIsSaving ] = useState( false );
	const { saveWidgetAreas } = useDispatch( 'core/edit-widgets' );
	const onClick = useCallback( async () => {
		setIsSaving( true );
		await saveWidgetAreas();
		setIsSaving( false );
	}, [] );

	return (
		<Button
			isPrimary
			isLarge
			isBusy={ isSaving }
			aria-disabled={ isSaving }
			onClick={ isSaving ? undefined : onClick }
		>
			{ __( 'Update' ) }
		</Button>
	);
}

export default SaveButton;
