/**
 * WordPress dependencies
 */
import { Button, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface PublishControlsProps {
	status: 'draft' | 'published';
	isDirty: boolean;
	isSaving: boolean;
	onSave: () => void;
	onStatusChange: ( status: 'draft' | 'published' ) => void;
}

/**
 * Publish controls component for managing draft/published state.
 *
 * @param props                Component props.
 * @param props.status         Current status ('draft' or 'published').
 * @param props.isDirty        Whether there are unsaved changes.
 * @param props.isSaving       Whether save is in progress.
 * @param props.onSave         Callback when save button is clicked.
 * @param props.onStatusChange Callback when status toggle changes.
 * @return PublishControls component.
 */
export default function PublishControls( {
	status,
	isDirty,
	isSaving,
	onSave,
	onStatusChange,
}: PublishControlsProps ) {
	const isPublished = status === 'published';

	return (
		<div className="content-guidelines-publish-controls">
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Published' ) }
				checked={ isPublished }
				onChange={ ( checked: boolean ) =>
					onStatusChange( checked ? 'published' : 'draft' )
				}
				help={
					isPublished
						? __(
								'Guidelines are active and available to AI tools.'
						  )
						: __( 'Guidelines are saved as draft.' )
				}
			/>
			<Button
				variant="primary"
				onClick={ onSave }
				isBusy={ isSaving }
				disabled={ ! isDirty || isSaving }
				accessibleWhenDisabled
				__next40pxDefaultSize
				className="content-guidelines-publish-controls__save-button"
			>
				{ isSaving ? __( 'Saving…' ) : __( 'Save Changes' ) }
			</Button>
		</div>
	);
}
