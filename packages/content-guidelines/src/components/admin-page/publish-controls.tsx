/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface PublishControlsProps {
	status: 'draft' | 'published';
	isDirty: boolean;
	isSaving: boolean;
	onSave: ( targetStatus?: 'draft' | 'published' ) => void;
}

/**
 * Publish controls component for managing draft/published state.
 *
 * - When draft: Shows "Save Draft" and "Publish" buttons
 * - When published: Shows just "Save" button
 *
 * @param props          Component props.
 * @param props.status   Current status ('draft' or 'published').
 * @param props.isDirty  Whether there are unsaved changes.
 * @param props.isSaving Whether save is in progress.
 * @param props.onSave   Callback when save button is clicked, with optional target status.
 * @return PublishControls component.
 */
export default function PublishControls( {
	status,
	isDirty,
	isSaving,
	onSave,
}: PublishControlsProps ) {
	const isPublished = status === 'published';

	if ( isPublished ) {
		// Already published: just show Save button
		return (
			<div className="content-guidelines-publish-controls">
				<span className="content-guidelines-publish-controls__status">
					{ __( 'Published' ) }
				</span>
				<Button
					variant="primary"
					onClick={ () => onSave( 'published' ) }
					isBusy={ isSaving }
					disabled={ ! isDirty || isSaving }
					accessibleWhenDisabled
					__next40pxDefaultSize
				>
					{ isSaving ? __( 'Updating…' ) : __( 'Update' ) }
				</Button>
			</div>
		);
	}

	// Draft: show Save Draft and Publish buttons
	return (
		<div className="content-guidelines-publish-controls">
			<Button
				variant="secondary"
				onClick={ () => onSave( 'draft' ) }
				isBusy={ isSaving }
				disabled={ ! isDirty || isSaving }
				accessibleWhenDisabled
				__next40pxDefaultSize
			>
				{ isSaving ? __( 'Saving…' ) : __( 'Save Draft' ) }
			</Button>
			<Button
				variant="primary"
				onClick={ () => onSave( 'published' ) }
				isBusy={ isSaving }
				disabled={ isSaving }
				accessibleWhenDisabled
				__next40pxDefaultSize
			>
				{ __( 'Publish' ) }
			</Button>
		</div>
	);
}
