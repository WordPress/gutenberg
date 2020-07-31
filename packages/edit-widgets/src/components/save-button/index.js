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

/**
 * Internal dependencies
 */
import { KIND, WIDGET_ENTITY_TYPE } from '../../store/utils';

function SaveButton() {
	const { editedWidgetAreaIds, isSaving } = useSelect( ( select ) => {
		const { hasEditsForEntityRecord, isSavingEntityRecord } = select(
			'core'
		);
		const { getWidgetAreas } = select( 'core/edit-widgets' );
		const widgetAreas = getWidgetAreas();
		const widgetAreaIds = map( widgetAreas, ( { id } ) => id );
		return {
			editedWidgetAreaIds: filter( widgetAreaIds, ( id ) =>
				hasEditsForEntityRecord( KIND, WIDGET_ENTITY_TYPE, id )
			),
			isSaving: some( widgetAreaIds, ( id ) =>
				isSavingEntityRecord( KIND, WIDGET_ENTITY_TYPE, id )
			),
		};
	}, [] );
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	const onClick = useCallback( () => {
		forEach( editedWidgetAreaIds, ( id ) => {
			saveEditedEntityRecord( KIND, WIDGET_ENTITY_TYPE, id );
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
