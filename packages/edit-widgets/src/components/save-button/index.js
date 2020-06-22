/**
 * External dependencies
 */
import { filter, map, some, forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

function SaveButton() {
	const { editedWidgetAreaIds, isSaving } = useSelect( ( select ) => {
		const {
			hasEditsForEntityRecord,
			isSavingEntityRecord,
			getEntityRecords,
		} = select( 'core' );
		const widgetAreas = getEntityRecords( 'root', 'widgetArea' );
		const widgetAreaIds = map( widgetAreas, ( { id } ) => id );
		return {
			editedWidgetAreaIds: filter( widgetAreaIds, ( id ) =>
				hasEditsForEntityRecord( 'root', 'widgetArea', id )
			),
			isSaving: some( widgetAreaIds, ( id ) =>
				isSavingEntityRecord( 'root', 'widgetArea', id )
			),
		};
	}, [] );
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	const onClick = useCallback( () => {
		forEach( editedWidgetAreaIds, ( id ) => {
			saveEditedEntityRecord( 'root', 'widgetArea', id );
		} );
	}, [ editedWidgetAreaIds ] );

	return (
		<Button
			isPrimary
			isBusy={ isSaving }
			aria-disabled={ isSaving }
			onClick={ isSaving ? undefined : onClick }
			disabled={ editedWidgetAreaIds.length === 0 }
		>
			{ __( 'Update' ) }
		</Button>
	);
}

export default SaveButton;
