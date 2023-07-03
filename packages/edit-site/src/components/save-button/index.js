/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';

export default function SaveButton( {
	className = 'edit-site-save-button__button',
	variant = 'primary',
	showTooltip = true,
	defaultLabel,
	icon,
} ) {
	const { isDirty, isSaving, isSaveViewOpen } = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
			select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const { isSaveViewOpened } = select( editSiteStore );
		return {
			isDirty: dirtyEntityRecords.length > 0,
			isSaving: dirtyEntityRecords.some( ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
			isSaveViewOpen: isSaveViewOpened(),
		};
	}, [] );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );

	const activateSaveEnabled = isPreviewingTheme() || isDirty;
	const disabled = isSaving || ! activateSaveEnabled;

	const getLabel = () => {
		if ( isPreviewingTheme() ) {
			if ( isSaving ) {
				return __( 'Activating' );
			} else if ( disabled ) {
				return __( 'Saved' );
			} else if ( isDirty ) {
				return __( 'Activate & Save' );
			}
			return __( 'Activate' );
		}

		if ( isSaving ) {
			return __( 'Saving' );
		} else if ( disabled ) {
			return __( 'Saved' );
		} else if ( defaultLabel ) {
			return defaultLabel;
		}
		return __( 'Save' );
	};
	const label = getLabel();

	return (
		<Button
			variant={ variant }
			className={ className }
			aria-disabled={ disabled }
			aria-expanded={ isSaveViewOpen }
			isBusy={ isSaving }
			onClick={ disabled ? undefined : () => setIsSaveViewOpened( true ) }
			label={ label }
			/*
			 * We want the tooltip to show the keyboard shortcut only when the
			 * button does something, i.e. when it's not disabled.
			 */
			shortcut={ disabled ? undefined : displayShortcut.primary( 's' ) }
			/*
			 * Displaying the keyboard shortcut conditionally makes the tooltip
			 * itself show conditionally. This would trigger a full-rerendering
			 * of the button that we want to avoid. By setting `showTooltip`,
			 & the tooltip is always rendered even when there's no keyboard shortcut.
			 */
			showTooltip={ showTooltip }
			icon={ icon }
		>
			{ label }
		</Button>
	);
}
