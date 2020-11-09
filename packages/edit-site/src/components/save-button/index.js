/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { useEffect, useCallback } from '@wordpress/element';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

export default function SaveButton( { openEntitiesSavedStates } ) {
	const { isDirty, isSaving, getDirtyEntityRecords } = useSelect(
		( select ) => {
			const {
				__experimentalGetDirtyEntityRecords,
				isSavingEntityRecord,
			} = select( 'core' );
			const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
			return {
				isDirty: dirtyEntityRecords.length > 0,
				isSaving: some( dirtyEntityRecords, ( record ) =>
					isSavingEntityRecord( record.kind, record.name, record.key )
				),
				getDirtyEntityRecords: __experimentalGetDirtyEntityRecords,
			};
		}
	);
	const { registerShortcut } = useDispatch( 'core/keyboard-shortcuts' );
	const { saveEditedEntityRecord } = useDispatch( 'core' );
	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-site/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );
	} );

	useShortcut(
		'core/edit-site/save',
		useCallback(
			( event ) => {
				event.preventDefault();
				getDirtyEntityRecords().forEach( ( { kind, name, key } ) => {
					saveEditedEntityRecord( kind, name, key );
				} );
			},
			[ getDirtyEntityRecords ]
		),
		{
			bindGlobal: true,
		}
	);

	const disabled = ! isDirty || isSaving;
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<>
			<Button
				isPrimary
				className="edit-site-save-button__button"
				aria-disabled={ disabled }
				disabled={ disabled }
				isBusy={ isSaving }
				onClick={ disabled ? undefined : openEntitiesSavedStates }
			>
				{ isMobile ? __( 'Update' ) : __( 'Update Design' ) }
			</Button>
		</>
	);
}
